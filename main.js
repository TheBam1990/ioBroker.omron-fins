"use strict";

/*
 * Created with @iobroker/create-adapter v1.29.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const fins = require("omron-fins/lib/index.js");

const thisval=[];
const thisName=[];
const all=[];
let time;
let time2;
let plc_poll;
let plc_ip;
let plc_port;
let client ;

// Load your modules here, e.g.:
// const fs = require("fs");

class OmronFins extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "omron-fins",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// Reset the connection indicator during startup
		this.setState("info.connection", false, true);

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		//this.log.debug("Value1: " + JSON.stringify(this.config.devices[0].value));
		//this.log.debug("config.devices: " + JSON.stringify(this.config.devices));
		plc_poll=this.config.plc_poll;			//werte von index als Daten übergeben
		plc_ip=this.config.plc_ip;
		plc_port=Number(this.config.plc_port);
		client = new fins.FinsClient(plc_port,plc_ip);
		for  (const device in this.config.devices){				//for schleife für Array Bilden der werte
			try {
				thisval.push(this.config.devices[device].value);
				thisName.push(this.config.devices[device].name);
				all.push(
					this.stateValues = {
						name: nameFilter(this.config.devices[device].name),
						variable: this.config.devices[device].value}
				);

			}	catch (error){this.log.info("Error Arry ");}
		}



		//this.log.debug("thisval wert: " + JSON.stringify(thisval));			//log ob Array Bilden geklappt hat
		//this.log.debug("thisval Name: " + JSON.stringify(thisName));
		//this.log.debug("ALL: " + JSON.stringify(all));

		/*const client = new fins.FinsClient(plc_port,plc_ip);			//Client deglariern

		const _this = this;

		client.on("reply",async ()=> {						//info.connection Abfrage ob es verbindung steht
			await _this.setStateAsync("info.connection", true);
			clearTimeout(time);
			time=setTimeout(async function(){
				await _this.setStateAsync("info.connection", false);
			}, plc_poll + 2000);
			//console.log("Reply from: ", msg.remotehost);
		});

		client.readMultiple(...thisval);*/



		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		for (const datapoint in this.config.devices) {
			let data;
			switch (this.config.devices[datapoint].type) {		//Von Index abrufen was für ein Datentyp und Umwandeln
				case "BOOL":
					data = "boolean";
					break;
				case "CHANNEL":
					data = "number";
					break;
				case "NUMBER":
					data = "number";
					break;
				case "COUNTER":
					data = "number";
					break;
				case "TIMER":
					data = "number";
					break;
				default:
				// code block
			}
			//objekte Bilden
			await this.setObjectNotExistsAsync(nameFilter(this.config.devices[datapoint].name), {
				type: "state",
				common: {
					name: this.config.devices[datapoint].name,
					type: data,
					role: "state",
					read: true,
					write: true,
				},
				native: {
					adress: this.config.devices[datapoint].value,
				},
			});

			this.subscribeStates(nameFilter(this.config.devices[datapoint].name));
		}

		await this.setObjectNotExistsAsync("info.connection", {
			type: "state",
			common: {
				name: "info.connection",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		//this.subscribeStates("testVariable");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		//let result = await this.checkPasswordAsync("admin", "iobroker");
		//this.log.info("check user admin pw iobroker: " + result);

		//result = await this.checkGroupAsync("admin", "admin");
		//this.log.info("check group user admin group admin: " + result);

		this.readStates();

	}

	readStates() {		//Abrufen der der Werte von der Steuerung mit Zeit interval
		const _this = this;
		//Abrufen der Werte
		//const client = new fins.FinsClient(plc_port,plc_ip);
		//this.log.debug("port: " + JSON.stringify(plc_port));
		//this.log.debug("IP: " + JSON.stringify(plc_ip));

		client.on("reply",function(msg) {
			//console.log("Reply from: ", msg.remotehost);
			//_this.log.debug("Replying to issued command of: "+ msg.command);
			//_this.log.debug("Response code of: "  + msg.code);
			//_this.log.debug("Data returned: "+ msg.values);

			for (const x in msg.values) {
				//_this.log.info(`${thisName[x]}: ${Boolean(msg.values[x])}`);
				//_this.log.debug(`${thisName[x]}: ${msg.values[x]}`);
				//_this.setStateAsync(nameFilter(thisName[x]), { val: Boolean(msg.values[x]), ack: true });
				_this.setStateAsync(nameFilter(thisName[x]), { val: msg.values[x], ack: true });
			}
			_this.setStateAsync("info.connection", true);
			clearTimeout(time);
			time=setTimeout(()=> {
				_this.setStateAsync("info.connection", false);
			}, Number(plc_poll) + 4000);
		});

		client.readMultiple(...thisval);
		//this.log.info("Time  wert: " + time);
		time2 = setTimeout(async function () {
			_this.readStates();			//Am ende der funktion erneut aufrufen
		}, plc_poll);
	}


	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {   //Beim Beenden des Adapters noch Timeouts löschen
		try {
			// Here you must clear all timeouts or intervals that may still be active
			clearTimeout(time);
			clearTimeout(time2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */


	onStateChange(id, state ) {
		if (state && state.ack === false) {
			let aktuell;
			// The state was changed and is not (yet) acknowledged
			this.log.debug(`state ${id} changed: ${state.val}  (ack = ${state.ack})`);
			//ALL: [{"name":"Test","variable":"CB0:00"},{"name":"Test2","variable":"CB0:01"},{"name":"test3","variable":"W31:00"},{"name":"Testd","variable":"D12"}]
			const idarry=id.split(".");
			aktuell=all.find(x=>x.name===idarry[idarry.length-1]).variable;
			//this.log.debug(`idarry ${idarry} `);
			//this.log.debug(`Variable ${aktuell} `);
			//this.log.debug(`Wert ${state.val} `);
			client.write(aktuell,Number(state.val));

		} else {
			//this.log.info(`state ${id} deleted`);
			// Send command 1 - level  nesting
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

function nameFilter(name) {
	const signs = [String.fromCharCode(46), String.fromCharCode(44), String.fromCharCode(92), String.fromCharCode(47), String.fromCharCode(91), String.fromCharCode(93), String.fromCharCode(123), String.fromCharCode(125), String.fromCharCode(32), String.fromCharCode(129), String.fromCharCode(154), String.fromCharCode(132), String.fromCharCode(142), String.fromCharCode(148), String.fromCharCode(153)]; //46=. 44=, 92=\ 47=/ 91=[ 93=] 123={ 125=} 32=Space 129=ü 154=Ü 132=ä 142=Ä 148=ö 153=Ö
	signs.forEach((item, index) => {
		const count = name.split(item).length - 1;

		for (let i = 0; i < count; i++) {
			name = name.replace(item, "");
		}

		const result = name.search(/$/);
		if (result !== -1) {
			name = name.replace(/_$/, "");
		}

	});
	return name;
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new OmronFins(options);
} else {
	// otherwise start the instance directly
	new OmronFins();
}
