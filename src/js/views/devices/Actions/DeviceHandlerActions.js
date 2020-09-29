import deviceManager from 'Comms/devices';
import toaster from 'Comms/util/materialize';
import helper from './DeviceHandlerHelper';

class DeviceHandlerActions {
    set(args) {
        if (args) {
            this.fetchTemplateData(args.templates);
        }
        return args;
    }

    fetchTemplateData(templateList, cb) {
        return (dispatch) => {
            dispatch();
            deviceManager
                .getTemplateGQL(templateList)
                .then((result) => {
                    this.setTemplateData(result.data);
                    if (cb) {
                        cb(result);
                    }
                })
                .catch((error) => {
                    this.devicesFailed(error);
                });
        };
    }

    setTemplateData(data) {
        return data;
    }

    update(args) {
        return args;
    }

    fetch(id) {
        return (dispatch) => {
            dispatch();
            deviceManager
                .getDevice(id)
                .then((d) => {
                    this.set(d);
                })
                .catch((error) => {
                    this.devicesFailed(error);
                });
        };
    }

    toggleSidebarDevice(value) {
        return value;
    }

    selectTemplate(template) {
        return template;
    }

    addDevice(device, selectedTemplates, cb) {
        const newDevice = helper.diffTemAndSpecializedAttrsMetas(device, selectedTemplates);
        return (dispatch) => {
            dispatch();
            deviceManager
                .addDevice(newDevice)
                .then((response) => {
                    this.insertDevice(response.devices[0]);
                    if (cb) {
                        cb(response.devices[0]);
                    }
                })
                .catch((error) => {
                    this.devicesFailed(error);
                });
        };
    }

    triggerUpdate(device, cb) {
        return (async (dispatch) => {
            dispatch();
            const templates = await helper.getTemplatesByDevice(device);
            const newDevice = helper.diffTemAndSpecializedAttrsMetas(device, templates);
            deviceManager
                .setDevice(newDevice)
                .then(() => {
                    this.updateSingle(newDevice);
                    if (cb) {
                        cb(newDevice);
                    }
                })
                .catch((error) => {
                    this.devicesFailed(error);
                });
        });
    }

    triggerRemoval(device, cb) {
        return (dispatch) => {
            dispatch();
            deviceManager
                .deleteDevice(device.id)
                .then((response) => {
                    this.removeSingle(device.id);
                    if (cb) {
                        cb(response);
                    }
                })
                .catch((error) => {
                    this.devicesFailed(`Failed to remove given device: ${error}`);
                });
        };
    }

    updateSingle(device) {
        return device;
    }

    insertDevice(devices) {
        return devices;
    }

    removeSingle(id) {
        return id;
    }

    devicesFailed(error) {
        toaster.error(error.message);
        return error;
    }
}

export default DeviceHandlerActions;
