'use strict';

const utils = require('@iobroker/adapter-core');
const fins = require('omron-fins');
const { mergeDeviceTables, nameToId, normalizeAddress, parseSymbolTable } = require('./lib/symbol-table');

function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

class OmronFins extends utils.Adapter {
    constructor(options) {
        super({ ...options, name: 'omron-fins' });
        this.client = null;
        this.devices = [];
        this.deviceByState = new Map();
        this.pollTimer = null;
        this.connectionTimer = null;
        this.polling = false;
        this.stopped = false;
        this.on('ready', () => this.onReady());
        this.on('stateChange', (id, state) => this.onStateChange(id, state));
        this.on('unload', callback => this.onUnload(callback));
    }

    async onReady() {
        this.stopped = false;
        await this.setStateAsync('info.connection', false, true);
        await this.setStateAsync('info.lastError', '', true);

        const imported = parseSymbolTable(String(this.config.symbolTable || ''));
        this.devices = mergeDeviceTables(Array.isArray(this.config.devices) ? this.config.devices : [], imported);
        if (imported.length) {
            this.log.info(`Imported ${imported.length} symbols from the CX-Programmer table`);
        }
        if (!this.config.plc_ip || !this.devices.length) {
            await this.setError(!this.config.plc_ip ? 'PLC IP address is missing' : 'No PLC variables are configured');
            return;
        }

        for (const device of this.devices) {
            device.id = nameToId(device.name);
            device.address = normalizeAddress(device.value);
            this.deviceByState.set(device.id, device);
            await this.extendObjectAsync(device.id, {
                type: 'state',
                common: {
                    name: device.name,
                    type: device.type === 'BOOL' ? 'boolean' : 'number',
                    role: device.type === 'BOOL' ? 'switch' : 'value',
                    read: true,
                    write: device.write !== false,
                },
                native: {
                    address: device.address,
                    source: device.source || 'manual',
                    dataType: device.type,
                },
            });
        }
        await this.subscribeStatesAsync('*');

        try {
            const port = Math.max(Number(this.config.plc_port) || 9600, 1);
            const timeout = Math.max(Number(this.config.timeout) || 5000, 1000);
            this.client = new fins.FinsClient(port, String(this.config.plc_ip), {
                protocol: this.config.protocol === 'tcp' ? 'tcp' : 'udp',
                timeout,
                DA1: Math.max(Number(this.config.destinationNode) || 0, 0),
                SA1: Math.max(Number(this.config.sourceNode) || 0, 0),
            });
            this.client.on('error', error => void this.setError(`FINS client error: ${errorMessage(error)}`));
            this.schedulePoll(0);
        } catch (error) {
            await this.setError(`Cannot initialize FINS client: ${errorMessage(error)}`);
        }
    }

    schedulePoll(delay) {
        if (this.stopped) {
            return;
        }
        if (this.pollTimer) {
            this.clearTimeout(this.pollTimer);
        }
        this.pollTimer = this.setTimeout(() => void this.poll(), delay);
    }

    async poll() {
        if (this.stopped || this.polling || !this.client) {
            return;
        }
        this.polling = true;
        try {
            const message = await this.readMultiple(this.devices.map(device => device.address));
            const values = message.values || (message.response && message.response.values) || [];
            for (let index = 0; index < this.devices.length; index++) {
                if (values[index] === undefined) {
                    continue;
                }
                const device = this.devices[index];
                const value = device.type === 'BOOL' ? Boolean(values[index]) : Number(values[index]);
                await this.setStateChangedAsync(device.id, value, true);
            }
            await this.setStateAsync('info.connection', true, true);
            await this.setStateAsync('info.lastError', '', true);
            await this.setStateAsync('info.lastUpdate', Date.now(), true);
            this.armConnectionTimeout();
        } catch (error) {
            await this.setError(`FINS read failed: ${errorMessage(error)}`);
        } finally {
            this.polling = false;
            this.schedulePoll(Math.max(Number(this.config.plc_poll) || 5000, 250));
        }
    }

    readMultiple(addresses) {
        return new Promise((resolve, reject) => {
            this.client.readMultiple(addresses, (error, message) => {
                if (error || !message || message.error || message.timeout) {
                    reject(
                        error ||
                            new Error(
                                message && message.response ? message.response.endCodeDescription : 'PLC timeout',
                            ),
                    );
                } else {
                    resolve(message);
                }
            });
        });
    }

    async onStateChange(id, state) {
        if (!state || state.ack || !this.client || this.stopped) {
            return;
        }
        const relative = id.startsWith(`${this.namespace}.`) ? id.slice(this.namespace.length + 1) : id;
        const device = this.deviceByState.get(relative);
        if (!device || device.write === false) {
            return;
        }
        try {
            const value = device.type === 'BOOL' ? (state.val ? 1 : 0) : Number(state.val);
            await new Promise((resolve, reject) => {
                this.client.write(device.address, value, (error, message) => {
                    if (error || !message || message.error || message.timeout) {
                        reject(error || new Error('PLC write failed'));
                    } else {
                        resolve(message);
                    }
                });
            });
            await this.setStateAsync(relative, device.type === 'BOOL' ? Boolean(value) : value, true);
            await this.setStateAsync('info.connection', true, true);
        } catch (error) {
            await this.setError(`FINS write failed for ${device.address}: ${errorMessage(error)}`);
        }
    }

    armConnectionTimeout() {
        if (this.connectionTimer) {
            this.clearTimeout(this.connectionTimer);
        }
        const delay =
            Math.max(Number(this.config.plc_poll) || 5000, 250) + Math.max(Number(this.config.timeout) || 5000, 1000);
        this.connectionTimer = this.setTimeout(() => void this.setStateAsync('info.connection', false, true), delay);
    }

    async setError(message) {
        this.log.warn(message);
        await this.setStateAsync('info.lastError', message, true);
        await this.setStateAsync('info.connection', false, true);
    }

    onUnload(callback) {
        this.stopped = true;
        if (this.pollTimer) {
            this.clearTimeout(this.pollTimer);
        }
        if (this.connectionTimer) {
            this.clearTimeout(this.connectionTimer);
        }
        try {
            if (this.client && typeof this.client.disconnect === 'function') {
                this.client.disconnect();
            }
        } catch {
            // Ignore errors while shutting down.
        }
        callback();
    }
}

if (require.main !== module) {
    module.exports = options => new OmronFins(options);
} else {
    new OmronFins();
}
