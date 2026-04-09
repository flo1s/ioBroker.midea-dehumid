"use strict";

const { py, python } = require("pythonia");

class MideaBeautifulBackend {
  constructor(adapter, appCredentials) {
    this.adapter = adapter;
    this.appCredentials = appCredentials;
    this.mideaBeautiful = null;
    this.cloud = null;
    this.appliances = [];
    this.applianceById = new Map();
  }

  async connect(config) {
    this.mideaBeautiful = await python("midea_beautiful");
    const credentialSet = this.appCredentials[config.type] || this.appCredentials.nethome;
    this.cloud = await this.mideaBeautiful.connect_to_cloud$({
      account: config.user,
      password: config.password,
      ...credentialSet,
    });
    return this.cloud;
  }

  async discover() {
    const discovered = await this.mideaBeautiful.find_appliances$({ cloud: this.cloud });
    this.appliances = [];
    this.applianceById.clear();

    for await (const [, appliance] of await py.enumerate(discovered)) {
      const id = String(await appliance.appliance_id);
      this.appliances.push(appliance);
      this.applianceById.set(id, appliance);
    }

    return this.appliances;
  }

  async getStatus({ applianceId, address, token, key, useLocal }) {
    if (useLocal && address && token && key) {
      return this.mideaBeautiful.appliance_state$({
        address,
        token,
        key,
        appliance_id: applianceId,
      });
    }

    return this.mideaBeautiful.appliance_state$({
      cloud: this.cloud,
      appliance_id: applianceId,
      use_cloud: true,
    });
  }

  async setState(applianceId, patch) {
    const appliance = this.applianceById.get(String(applianceId));
    if (!appliance) {
      throw new Error(`Unable to find appliance ${applianceId} in discovered device list`);
    }

    const payload = { cloud: this.cloud, ...patch };
    await appliance.set_state$(payload);
  }

  async close() {
    await python.exit();
  }
}

module.exports = { MideaBeautifulBackend };
