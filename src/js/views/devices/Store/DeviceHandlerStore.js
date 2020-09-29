import { FormActions } from '../Actions';

class DeviceHandlerStore {
    constructor() {
        this.device = {};
        this.usedTemplates = {};
        this.showSidebarDevice = false;
        this.isNewDevice = false;
        this.templateIdAllowedImage = '';
        this.hasTemplateWithImages = false;

        this.bindListeners({
            set: FormActions.SET,

            fetch: FormActions.FETCH,

            handleToggleSidebarDevice: FormActions.TOGGLE_SIDEBAR_DEVICE,

            handleTriggerInsertion: FormActions.ADD_DEVICE,

            handleTriggerUpdate: FormActions.TRIGGER_UPDATE,

            handleUpdateSingle: FormActions.UPDATE_SINGLE,

            handleRemoveSingle: FormActions.TRIGGER_REMOVAL,

            handleSetTemplateData: FormActions.SET_TEMPLATE_DATA,
        });
    }

    handleSetTemplateData(data) {
        this.hasTemplateWithImages = false;
        this.templateIdAllowedImage = '';
        const tmps = data.templatesHasImageFirmware;
        tmps.forEach((element) => {
            if (element.value === 'true') {
                this.templateIdAllowedImage = element.key;
                this.hasTemplateWithImages = true;
            }
        });
    }

    fetch() {}

    set(device) {
        this.templateIdAllowedImage = '';
        this.hasTemplateWithImages = false;
        if (device === null || device === undefined) {
            this.device = {
                label: '',
                id: '',
                protocol: 'MQTT',
                templates: [],
                tags: [],
                attrs: [],
                configValues: [],
                dynamicValues: [],
                staticValues: [],
                actuatorValues: [],
                metadata: {},
            };
            this.usedTemplates = {};
            this.isNewDevice = true;
        } else {
            const customDevice = { ...device };
            customDevice.attrs = [];
            device.templates.forEach((id) => {
                customDevice.attrs = customDevice.attrs.concat(device.attrs[id]);
            });
            customDevice.configValues = customDevice.attrs.filter((item) => item.type === 'meta');
            customDevice.dynamicValues = customDevice.attrs.filter((item) => item.type === 'dynamic');
            customDevice.staticValues = customDevice.attrs.filter((item) => item.type === 'static');
            customDevice.actuatorValues = customDevice.attrs.filter((item) => item.type === 'actuator');
            customDevice.metadata = {};
            customDevice.attrs.forEach((item) => {
                if (Object.prototype.hasOwnProperty.call(item, 'metadata')) {
                    customDevice.metadata[item.id] = [...item.metadata];
                }
            });

            this.device = customDevice;
            this.usedTemplates = device.templates;
            this.isNewDevice = false;
        }
        this.showSidebarDevice = true;
    }

    handleTriggerUpdate(device) {
        this.device = device;
        this.showSidebarDevice = false;
    }

    handleUpdateSingle(device) {
        this.device = device;
        this.showSidebarDevice = false;
    }

    handleToggleSidebarDevice(value) {
        this.showSidebarDevice = value;
    }

    handleTriggerInsertion() {
        this.showSidebarDevice = false;
        this.device = {};
    }

    handleRemoveSingle() {
        this.showSidebarDevice = false;
        this.device = {};
    }
}

export default DeviceHandlerStore;
