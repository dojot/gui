import TagActions from 'Actions/TagActions';
import util from 'Comms/util/util';
import alt from '../../../alt';
import { FormActions, AttrActions } from '../Action';

class FStore {
    constructor() {
        this.device = {}; this.set();
        this.newAttr = {}; this.setAttr();
        this.bindListeners({
            set: FormActions.SET,
            updateDevice: FormActions.UPDATE,
            fetch: FormActions.FETCH,

            addTag: TagActions.ADD,
            removeTag: TagActions.REMOVE,

            setAttr: AttrActions.SET,
            updAttr: AttrActions.UPDATE,
            addAttr: AttrActions.ADD,
            removeAttr: AttrActions.REMOVE,
        });
        this.set(null);
    }

    fetch(id) {}

    set(device) {
        if (device === null || device === undefined) {
            this.device = {
                label: '',
                id: '',
                protocol: '',
                templates: [],
                tags: [],
                attrs: [],
                config: [],
                static_attrs: [],
            };
        } else {
            if (device.attrs === null || device.attrs === undefined) {
                device.attrs = [];
            }

            if (device.static_attrs === null || device.static_attrs === undefined) {
                device.static_attrs = [];
            }

            this.device = device;
        }
    }

    updateDevice(diff) {
        this.device[diff.f] = diff.v;
    }

    addTag(tag) {
        this.device.tags.push(tag);
    }

    removeTag(tag) {
        this.device.tags = this.device.tags.filter((i) => i !== tag);
    }

    setAttr(attr) {
        if (attr) {
            this.newAttr = attr;
        } else {
            this.newAttr = {
                object_id: '',
                name: '',
                type: '',
                value: '',
            };
        }
    }

    updAttr(diff) {
        this.newAttr[diff.f] = diff.v;
    }

    addAttr() {
        this.newAttr.object_id = util.sid();
        if (this.newAttr.type === '') { this.newAttr.type = 'string'; }
        if (this.newAttr.value.length > 0) {
            this.device.static_attrs.push(JSON.parse(JSON.stringify(this.newAttr)));
        } else {
            delete this.newAttr.value;
            this.device.attrs.push(JSON.parse(JSON.stringify(this.newAttr)));
        }
        this.setAttr();
    }

    removeAttr(attribute) {
        if (attribute.value !== undefined && attribute.value.length > 0) {
            this.device.static_attrs = this.device.static_attrs.filter(
                (i) => i.object_id !== attribute.object_id,
            );
        } else {
            this.device.attrs = this.device.attrs.filter((i) => i.object_id !== attribute.object_id);
        }
    }
}

export default FStore;
export const TemplateFormStore = alt.createStore(FStore, 'TemplateFormStore');
