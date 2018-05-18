var alt = require('../alt');
var DeviceActions = require('../actions/DeviceActions');
var TrackingActions = require('../actions/TrackingActions');

class DeviceStore {
  constructor() {
    this.devices = {};
    this.deviceList = [];
    this.tracking = {};
    this.error = null;
    this.loading = false;

    this.bindListeners({
      handleUpdateDeviceList: DeviceActions.UPDATE_DEVICES,
      handleFetchDeviceList: DeviceActions.FETCH_DEVICES,

      handleInsertDevice: DeviceActions.INSERT_DEVICE,
      handleTriggerInsertion: DeviceActions.ADD_DEVICE,

      handleTriggerUpdate: DeviceActions.TRIGGER_UPDATE,
      handleUpdateSingle: DeviceActions.UPDATE_SINGLE,

      handleTriggerRemoval: DeviceActions.TRIGGER_REMOVAL,
      handleRemoveSingle: DeviceActions.REMOVE_SINGLE,

      handleFailure: DeviceActions.DEVICES_FAILED,

      fetchSingle: DeviceActions.FETCH_SINGLE,

      fetchDevicesByTemplate: DeviceActions.FETCH_DEVICES_BY_TEMPLATE,

      handleUpdateStatus: DeviceActions.UPDATE_STATUS,
    });
  }

  /*
  *
  * It's necessary discuss about status of a device
  *
  parseStatus(device) {
    // if (device.protocol && device.protocol.toLowerCase() === 'virtual') {
    //   return device.protocol.toLowerCase();
    // } else {
      if (device.status) {
        return device.status;
      }
    // }

    return "disabled"
  }
  */

  handleUpdateSingle(device) {
    let newDevice = JSON.parse(JSON.stringify(device));
    if (newDevice.attrs === undefined) {
      newDevice.attrs = [];
    }
    if (newDevice.static_attrs === undefined) {
      newDevice.static_attrs = [];
    }

    newDevice.loading = false;

    this.devices[device.id] = newDevice;

    this.loading = false;
  }

  handleUpdateStatus(device) {
   if ((device.metadata.status != undefined) && (this.devices[device.metadata.deviceid])) {
    this.devices[device.metadata.deviceid].status = device.metadata.status;
   }
  }


  handleTriggerUpdate(device) {
    // trigger handler for updateSingle
    this.error = null;
    this.loading = true;
  }

  handleTriggerRemoval(device) {
    // trigger handler for removeSingle
    this.error = null;
    this.loading = true;
  }

  handleRemoveSingle(id) {
    if (this.devices.hasOwnProperty(id)) {
      delete this.devices[id];
    }

    this.loading = false;
  }

  handleInsertDevice(device) {
    device._status="disabled";
    this.devices[device.id] = JSON.parse(JSON.stringify(device));
    this.error = null;
    this.loading = false;
  }

  handleTriggerInsertion(newDevice) {
    // this is actually just a intermediary while addition happens asynchonously
    this.error = null;
    this.loading = true;
  }

  handleUpdateDeviceList(devices) {
    this.devices = {};
    for (let idx = 0; idx < devices.length; idx++) {
      //devices[idx]._status = this.parseStatus(devices[idx]);
      if (devices[idx].attrs === undefined) {
        devices[idx].attrs = [];
      }
      if (devices[idx].static_attrs === undefined) {
        devices[idx].static_attrs = [];
      }
      if (devices[idx].tags === undefined) {
        devices[idx].tags = [];
      }

      if (devices[idx].status === undefined){
        devices[idx].status = "disabled";
      }

      this.devices[devices[idx].id] = JSON.parse(JSON.stringify(devices[idx]))
      this.deviceList[idx] = this.devices[devices[idx].id]
    }

    this.error = null;
    this.loading = false;
  }

  handleFetchDeviceList() {
    this.devices = {};
    this.loading = true;
  }

  fetchDevicesByTemplate() {
    this.devices = {};
    this.loading = true;
  }

  fetchSingle(deviceid) {
    this.devices[deviceid] = {loading: true};
  }

  handleFailure(error) {
    this.error = error;
    this.loading = false;
  }
}

var _store =  alt.createStore(DeviceStore, 'DeviceStore');
export default _store;
