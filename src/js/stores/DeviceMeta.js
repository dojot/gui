var alt = require('../alt');
var DeviceActions = require('../actions/DeviceActions');

class DeviceMeta {
  constructor() {
    this.devices = {};

    this.bindListeners({
      handleUpdateDeviceList: DeviceActions.UPDATE_DEVICES,
    });
  }

  parseStatus(device) {
    if (device.protocol.toLowerCase() == 'virtual') {
      return device.protocol.toLowerCase();
    } else {
      if (device.status) {
        return device.status;
      }
    }

    return "disabled"
  }

  handleUpdateDeviceList(devices) {
    this.devices = {};
    for (let idx = 0; idx < devices.length; idx++) {
      devices[idx]._status = this.parseStatus(devices[idx]);
      if (devices[idx].attrs == undefined) {
        devices[idx].attrs = [];
      }
      if (devices[idx].static_attrs == undefined) {
        devices[idx].static_attrs = [];
      }
      if (devices[idx].tags == undefined) {
        devices[idx].tags = [];
      }
      this.devices[devices[idx].id] = JSON.parse(JSON.stringify(devices[idx]))
    }

    this.error = null;
    this.loading = false;
  }
}

var _store =  alt.createStore(DeviceMeta, 'DeviceMeta');
export default _store;
