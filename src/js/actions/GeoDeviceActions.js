import deviceManager from 'Comms/devices/DeviceManager';
import toaster from "Comms/util/materialize";
import alt from '../alt';

class GeoDeviceActions {

    fetchDevices(params = null, cb) {
        return dispatch => {
            dispatch();
            deviceManager
                .getDevicesWithPosition(params)
                .then(result => {
                    this.setDevices(result);
                    if (cb) {
                        cb(result);
                    }
                })
                .catch(error => {
                    toaster.error(error.message);
                    this.devicesFailed(error);
                });
        };
    }

    setDevices(result) {
        return result;
    }

    devicesFailed(error) {
        toaster.error(error.message);
        return error;
    }
}

const _geodevice = alt.createActions(GeoDeviceActions, exports);

export default _geodevice;
