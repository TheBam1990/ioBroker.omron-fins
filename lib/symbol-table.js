'use strict';

/**
 * Convert a display name into a stable ioBroker object ID.
 *
 * @param {unknown} name Display name
 * @returns {string} Object ID
 */
function nameToId(name) {
    return (
        String(name || 'variable')
            .normalize('NFKD')
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '') || 'variable'
    );
}

/**
 * Normalize legacy and current FINS address notation.
 *
 * @param {unknown} address FINS address
 * @returns {string} Normalized address
 */
function normalizeAddress(address) {
    return String(address || '')
        .trim()
        .toUpperCase()
        .replace(/^CB/, 'CIO')
        .replace(/:/g, '.')
        .replace(/\s+/g, '');
}

function splitLine(line, delimiter) {
    const result = [];
    let current = '';
    let quoted = false;
    for (let index = 0; index < line.length; index++) {
        const character = line[index];
        if (character === '"') {
            quoted = !quoted;
        } else if (character === delimiter && !quoted) {
            result.push(current.trim());
            current = '';
        } else {
            current += character;
        }
    }
    result.push(current.trim());
    return result.map(value => value.replace(/^"|"$/g, '').trim());
}

function inferType(value) {
    const type = String(value || '').toUpperCase();
    if (/BOOL|BIT/.test(type)) {
        return 'BOOL';
    }
    if (/TIMER|TIME/.test(type)) {
        return 'TIMER';
    }
    if (/COUNTER/.test(type)) {
        return 'COUNTER';
    }
    return 'NUMBER';
}

/**
 * Parse an exported CX-Programmer symbol table.
 *
 * @param {unknown} text CSV or TSV source
 * @returns {import("./symbol-table").PlcVariable[]} Imported devices
 */
function parseSymbolTable(text) {
    const lines = String(text || '')
        .split(/\r?\n/)
        .filter(line => line.trim());
    if (!lines.length) {
        return [];
    }
    const delimiter = ['\t', ';', ','].sort((a, b) => lines[0].split(b).length - lines[0].split(a).length)[0];
    const rows = lines.map(line => splitLine(line, delimiter));
    const header = rows[0].map(value => value.toLowerCase());
    const find = terms => header.findIndex(value => terms.some(term => value.includes(term)));
    const nameIndex = find(['name', 'symbol', 'variable', 'bezeichnung']);
    const addressIndex = find(['address', 'adresse', 'bereich']);
    const typeIndex = find(['type', 'datentyp', 'data type']);
    const start = nameIndex >= 0 && addressIndex >= 0 ? 1 : 0;
    const addressPattern = /^(?:CIO|CB|W|H|A|D|E\d*|T|C)\d+(?:[:.]\d+)?$/i;
    const result = [];
    for (const row of rows.slice(start)) {
        const detectedAddress = row.findIndex(value => addressPattern.test(value.replace(/\s/g, '')));
        const addressPosition = addressIndex >= 0 ? addressIndex : detectedAddress;
        if (addressPosition < 0 || !row[addressPosition]) {
            continue;
        }
        const namePosition = nameIndex >= 0 ? nameIndex : Math.max(0, addressPosition - 1);
        const name = row[namePosition] || `PLC_${normalizeAddress(row[addressPosition])}`;
        result.push({
            name,
            value: normalizeAddress(row[addressPosition]),
            type: inferType(typeIndex >= 0 ? row[typeIndex] : ''),
            write: true,
            source: 'CX-Programmer',
        });
    }
    return result;
}

/**
 * Merge imported and manual variables, with manual variables taking precedence.
 *
 * @param {import("./symbol-table").PlcVariable[]} manual Manual devices
 * @param {import("./symbol-table").PlcVariable[]} imported Imported devices
 * @returns {import("./symbol-table").PlcVariable[]} Merged devices
 */
function mergeDeviceTables(manual, imported) {
    const result = new Map();
    for (const item of [...imported, ...manual]) {
        if (!item || !item.name || !item.value) {
            continue;
        }
        result.set(nameToId(item.name), {
            ...item,
            type: inferType(item.type),
            value: normalizeAddress(item.value),
        });
    }
    return [...result.values()];
}

module.exports = {
    mergeDeviceTables,
    nameToId,
    normalizeAddress,
    parseSymbolTable,
};
