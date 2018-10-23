/* eslint-disable */
import React, { Component } from 'react';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { hashHistory } from 'react-router';
import AltContainer from 'alt-container';
import alt from '../../alt';
import { NewPageHeader } from '../../containers/full/PageHeader';
import DeviceActions from '../../actions/DeviceActions';
import deviceManager from '../../comms/devices/DeviceManager';
import DeviceStore from '../../stores/DeviceStore';
import util from '../../comms/util/util';
import { DojotBtnCircle, DojotBtnClassic, DojotBtnRedCircle } from '../../components/DojotButton';

import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';

import MaterialInput from '../../components/MaterialInput';
import toaster from '../../comms/util/materialize';

/*
 Below begins the React Flux's hell
*/

class DeviceHandlerActions {
    set(args) { return args; }

    update(args) { return args; }

    fetch(id) {
        return (dispatch) => {
            dispatch();
            deviceManager.getDevice(id)
                .then((d) => { this.set(d); })
                .catch((error) => { console.error('Failed to get device', error); });
        };
    }
}
const FormActions = alt.createActions(DeviceHandlerActions);
const AttrActions = alt.generateActions('update');

class DeviceHandlerStore {
    constructor() {
        this.device = {}; this.set();
        this.usedTemplates = {};
        
        this.attrNames = {};
        this.attrError = '';
        this.fieldError = {};

        this.bindListeners({
            set: FormActions.SET,
            updateDevice: FormActions.UPDATE,
            fetch: FormActions.FETCH,
            setAttributes: AttrActions.UPDATE,
        });
        this.set(null);
    }


    loadAttrs() {
    // TODO: it actually makes for sense in the long run to use (id, key) for attrs which
    //       will allow name updates as well as better payload to event mapping.
        this.attrNames = {};
        if ((this.device === undefined) || (this.device === null)) {
            return;
        }

        for (const tmp_id in this.device.attrs) {
            for (const index in this.device.attrs[tmp_id]) {
                const att = this.device.attrs[tmp_id][index];
                if (String(att.type) == 'static') {
                    this.attrNames[att.id] = att.static_value;
                }
            }
        }
    }

    fetch(id) {
    }

    set(device) {
        if (device === null || device === undefined) {
            this.device = {
                label: '',
                id: '',
                protocol: 'MQTT',
                templates: [],
                tags: [],
                attrs: [],
            };
            this.usedTemplates = {};
        } else {
            this.device = device;
            this.usedTemplates = device.templates;
            this.loadAttrs();
            // console.log('Device was updated in Store: ', this.device);
        }
    }

    updateDevice(diff) {
        this.device[diff.f] = diff.v;
    }

    setAttributes(attr_list) {
        this.device.attrs = [];
        for (const k in attr_list) {
            if (!util.isTypeValid(attr_list[k].value, attr_list[k].type)) {
                return;
            }

            if (attr_list[k].hasOwnProperty('value')) {
                attr_list[k].static_value = attr_list[k].value;
                delete attr_list[k].value;
            }
            this.device.attrs.push(JSON.parse(JSON.stringify(attr_list[k])));
        }
        // console.log('All attributes were set.', this.device);
    }
}

const DeviceFormStore = alt.createStore(DeviceHandlerStore, 'DeviceFormStore');

class StaticAttributes extends Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        event.preventDefault();
        const f = event.target.name;
        const v = event.target.value;
        this.props.onChange(f, v);
    }

    render() {
        if (!this.props.attrs.length) {
            return (
                <div />
            );
        }

        let statics = this.props.attrs.filter(item => String(item.type) == 'static');
        const properties = this.props.attrs.filter(item => String(item.type) == 'meta');

        for (let index in statics) {
            if (statics[index].value == undefined)
              statics[index].value = statics[index].static_value;
        }

        for (const index in properties) {
            if (properties[index].label === 'protocol') {
                properties[index].static_value = (properties[index].value !== undefined ? properties[index].static_value.toUpperCase() : properties[index].static_value);
                properties[index].value = (properties[index].value !== undefined ? properties[index].value.toUpperCase() : properties[index].value);
            }
        }

        return (
            <div className="attr-box specific-attr">
                {properties.length > 0 && (
                    <div className="col s12">
                        <div className="col s12">
                            <div className="attr-title">Configurations</div>
                        </div>
                        <div className="col s12 bg-gray">
                            {properties.map(attr => (
                                <div key={attr.label} className="col s6 attr-fields">
                                    <div className="attr-name truncate">{attr.label}</div>
                                    <div className="attr-type">{attr.value_type}</div>
                                    <div className="attr-name input-field fix-inputs">
                                        <MaterialInput
                                            className="mt0px"
                                            id="fld_label"
                                            value={attr.value}
                                            name={attr.label}
                                            onChange={this.handleChange}
                                            maxLength={40}
                                        />
                                    </div>
                                    <div className="attr-type fix-value ">Value</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {statics.length > 0 && (
                    <div className="col s12">
                        <div className="col s12">
                            <div className="attr-title">Static Attributes</div>
                        </div>
                        <div className="col s12 bg-gray">
                            {statics.map(attr => (
                                <div key={attr.label} className="col s6 attr-fields">
                                    <div className="attr-name truncate">{attr.label}</div>
                                    <div className="attr-type">{attr.value_type}</div>
                                    <div className="attr-name input-field fix-inputs">
                                        <MaterialInput
                                            className="mt0px"
                                            id="fld_label"
                                            value={attr.value}
                                            name={attr.label}
                                            onChange={this.handleChange}
                                            maxLength={40}
                                        />
                                    </div>
                                    <div className="attr-type fix-value ">Value</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}


class DeviceHeader extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="col s12 pb20">
                <div className="col s3">
                    <div className="img">
                        <img src="images/big-chip.png" />
                    </div>
                </div>
                <div className="col s9 pt20px">
                    <div>
                        <div className="input-field large col s12 ">
                            <MaterialInput id="fld_label" value={this.props.name} name="label" onChange={this.props.onChange} maxLength={40}> Name </MaterialInput>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


class AttrBox extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const attr_list = this.props.attrs.filter(attr => attr.type == 'dynamic');

        // console.log('attr_list', attr_list);
        return (
            <div>
                {attr_list.length > 0 ? (
                    <div className="col s12">
                        {
                            attr_list.map((attr, index) => (
                                <div key={index} className="col s4">
                                    <div className="bg-gray">
                                        <div className="attr-name truncate">{attr.label}</div>
                                        <div className="attr-type">{attr.value_type}</div>
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : null }
            </div>
        );
    }
}

class AttrActuatorBox extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const attr_actuators_list = this.props.attrs.filter(attr => attr.type == 'actuator');
        return (
            <div>
                {attr_actuators_list.length > 0 ? (
                    <div className="col s12">
                        {
                            attr_actuators_list.map((attr, index) => (
                                <div key={index} className="col s4">
                                    <div className="bg-gray">
                                        <div className="attr-name truncate">{attr.label}</div>
                                        <div className="attr-type">{attr.value_type}</div>
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : null }
            </div>
        );
    }
}


class DeviceForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            templateState: 0,
            staticAttrs: [],
            templates: [],
            selectedTemplates: [],
            loaded: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleChangeAttr = this.handleChangeAttr.bind(this);

        this.toggleTemplate = this.toggleTemplate.bind(this);
        this.setTemplateState = this.setTemplateState.bind(this);
        this.save = this.save.bind(this);

        this.getStaticAttributes = this.getStaticAttributes.bind(this);
        this.handleStaticsAttributes = this.handleStaticsAttributes.bind(this);
        this.removeStaticAttributes = this.removeStaticAttributes.bind(this);
    }

    componentDidMount() {
        if (!this.props.edition) this.setState({ templateState: 1 });
    }

    componentDidUpdate() {
        const templates = this.props.templates.templates;
        const device = this.props.device.device;
        if (
            !this.state.loaded
      && templates != undefined
      && templates.length > 0
      && Object.keys(this.props.device.usedTemplates).length
      && this.state.selectedTemplates.length == 0
        ) {
            const list = [];
            let currentAttrs = this.state.staticAttrs;

            for (const tmp_id in this.props.device.usedTemplates) {
                for (const k in templates) {
                    if (templates[k].id == this.props.device.usedTemplates[tmp_id]) {
                        templates[k].active = true;
                        list.push(JSON.parse(JSON.stringify(templates[k])));
                        currentAttrs = currentAttrs.concat(this.handleStaticsAttributes(templates[k], device));
                        break;
                    }
                }
            }

            currentAttrs = currentAttrs.reduce((newArray, currentValue) => {
                for (let index = 0; index < newArray.length; index++) {
                    if(newArray[index].id === currentValue.id){
                        return newArray;
                    }
                }

                newArray.push(currentValue);
                return newArray;

            }, []);

            this.setState({ selectedTemplates: list, loaded: true, staticAttrs: currentAttrs });
        }
    }

    handleStaticsAttributes(template, device) {
        function getAttributesFromDevice(deviceAttrs) {
            let configAttrs = [];
            for (const tmp in deviceAttrs) {
                for (const index in deviceAttrs[tmp]) {
                    if (deviceAttrs[tmp][index].type == 'static' || deviceAttrs[tmp][index].type == 'meta') {
                        configAttrs = configAttrs.concat(deviceAttrs[tmp][index]);
                        console.log('handleStaticsAttributes', deviceAttrs[tmp][index]);
                    }
                }
            }
            return configAttrs;
        }
        let listAttrs = [];
        listAttrs = listAttrs.concat(getAttributesFromDevice(device.attrs)); // Handle config attributes from device

        if (this.props.edition) {
            const list = listAttrs.map((attr) => {
                attr.value = attr.static_value;
                return attr;
            });
            return list;
        }
        return this.getStaticAttributes(template);
    }

    save(e) {
        e.preventDefault();

        const to_be_checked = DeviceFormStore.getState().device;
        const ret = util.isNameValid(to_be_checked.label);
        if (!ret.result) {
            toaster.error(ret.error);
            return;
        }

        // templates describe all attributes that should be applied to device, so we only need set values related to static attributes.
        AttrActions.update(this.state.staticAttrs);


        // set templates used
        const template_list = [];
        for (const k in this.state.selectedTemplates) {
            template_list.push(this.state.selectedTemplates[k].id);
        }
        FormActions.update({ f: 'templates', v: template_list });

        // console.log('Object to be saved: ', JSON.parse(JSON.stringify(DeviceFormStore.getState().device)));

        // Now, saves the device;
        const ongoingOps = DeviceStore.getState().loading;
        if (ongoingOps == false) {
            //console.log('ongoingOps');
            this.props.operator(JSON.parse(JSON.stringify(DeviceFormStore.getState().device)), this.props.deviceid);
            hashHistory.goBack();
        }
    }

    componentWillUnmount() {
        FormActions.set(null);
    }

    setTemplateState(state) {
        this.setState({ templateState: state });
    }

    toggleTemplate(tmpt) {
    // check if the template have already been added
        const selectedTemplate = this.state.selectedTemplates.filter(item => item.id === tmpt.id);
        let currentAttrs = this.state.staticAttrs;
        let list = [];
        if (selectedTemplate.length == 0) // adding new template
        {
            list = this.state.selectedTemplates;
            list.push(tmpt);
            currentAttrs = currentAttrs.concat(this.getStaticAttributes(tmpt));
        } else { // removing template
            list = this.state.selectedTemplates.filter(item => item.id !== tmpt.id);
            currentAttrs = this.removeStaticAttributes(tmpt, currentAttrs);
        }

        this.setState({
            selectedTemplates: list,
            staticAttrs: currentAttrs,
        });
    }

    handleChange(event) {
        event.preventDefault();
        const f = event.target.name;
        const v = event.target.value;
        FormActions.update({ f, v });
    }

    handleChangeAttr(label, val) {
        const st = this.state.staticAttrs;
        for (const k in st) {
            if (st[k].label == label) st[k].value = val;
        }
        this.setState({ staticAttrs: st });
    }

    removeStaticAttributes(template, current_list) {
        const list = current_list
            .filter(i => String(i.template_id) != template.id);
        return list;
    }

    getStaticAttributes(template) {
        const list = template.attrs
            .filter(i => (String(i.type) == 'static') || (String(i.type) == 'meta'))
            .map((attr) => {
                // check if there is a current static value in device store
                if (attr.id) {
                    if (this.props.device.attrNames[attr.id]) attr.value = this.props.device.attrNames[attr.id];
                    else attr.value = attr.static_value;
                } else {
                    attr.id = util.sid();
                    attr.value = attr.static_value;
                }
                attr.template_id = template.id;
                return attr;
            });
        return list;
    }

    render() {
    // preparing template list to be used
        const templates = this.props.templates.templates;
        for (const k in templates) {
            templates[k].active = false;
            for (const j in this.state.selectedTemplates) {
                if (templates[k].id == this.state.selectedTemplates[j].id) {
                    templates[k].active = true;
                }
            }
        }
        // console.log("this.state.selectedTemplates",this.state.selectedTemplates)
        return (
            <div className={`row device device-frame mb0 ${this.props.className ? this.props.className : ''}`}>
                <div className="col s7 data-frame">
                    <div className="col s12">
                        {this.state.selectedTemplates.length > 0 ? (
                            <div className="react-bug-escape">
                                <div className="col s12 p0">
                                    <div className="col s9 p0">
                                        <DeviceHeader name={this.props.device.device.label} onChange={this.handleChange} />
                                    </div>
                                    <div className="col s3 p0 mt30px text-right">
                                        <DojotBtnClassic is_secondary={false} onClick={this.save} label="Save" title="Save" />
                                        <div className="col s12 p0 mt10px ">
                                            <DojotBtnClassic is_secondary to={this.props.edition ? `/device/id/${this.props.deviceid}/detail` : '/device/list'} label="Discard" title="Discard" />
                                        </div>

                                    </div>
                                </div>
                                <StaticAttributes attrs={this.state.staticAttrs} onChange={this.handleChangeAttr} />
                                <div className="attr-box">
                                    <div className="col s12">
                                        <div className="attr-title">Dynamic attributes</div>
                                    </div>
                                    {this.state.selectedTemplates.map(tplt => (
                                        <AttrBox key={tplt.id} {...tplt} />
                                    ))}
                                </div>
                                <div className="attr-box">
                                    <div className="col s12">
                                        <div className="attr-title">Actuators</div>
                                    </div>
                                    {this.state.selectedTemplates.map(tplt => (
                                        <AttrActuatorBox key={tplt.id} {...tplt} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="padding10 background-info pb160px">
                Select a template to start
                            </div>
                        )}
                    </div>
                </div>

                <div className="col s5 p0">
                    {this.state.templateState == 0 ? (
                        <TemplateFrame
                            changeState={this.setTemplateState}
                            toggleTemplate={this.toggleTemplate}
                            templates={this.state.selectedTemplates}
                            state={this.state.templateState}
                            numberOfTemplates={this.props.templates.templates.length}
                        />
                    ) : (
                        <TemplateFrame
                            changeState={this.setTemplateState}
                            toggleTemplate={this.toggleTemplate}
                            templates={templates}
                            state={this.state.templateState}
                            numberOfTemplates={this.props.templates.templates.length}
                        />
                    )}
                </div>
            </div>
        );
    }
}


class TemplateFrame extends Component {
    constructor(props) {
        super(props);
        // this.handleRemove = this.handleRemove.bind(this);
        this.toggleTemplate = this.toggleTemplate.bind(this);
        this.removeTemplate = this.removeTemplate.bind(this);
        this.setAditionMode = this.setAditionMode.bind(this);
        this.setRemovalMode = this.setRemovalMode.bind(this);
        this.showSearchBox = this.showSearchBox.bind(this);
    }

    removeTemplate(template) {
        this.props.toggleTemplate(template);
    }

    toggleTemplate(template) {
        this.props.toggleTemplate(template);
    }

    setAditionMode() {
        this.props.changeState(1);
    }

    setRemovalMode() {
        this.props.changeState(0);
    }

    showSearchBox() {
        // console.log('Not implemented yet');
    }

    render() {
        if (this.props.numberOfTemplates > 0) {
            return (
                <div className="col s12 template-frame">
                    <div className="col s12 header">
                        { this.props.state == 0 ? (
                            <label className="col s6 text-left">Selected Templates </label>
                        ) : (
                            <label className="col s6 text-left">All Templates </label>
                        )}

                        <div className="col s6 text-right">
                            { this.props.state == 0 ? (
                                <DojotBtnCircle click={this.setAditionMode} icon="fa fa-plus" tooltip="Add templates" />
                            ) : (
                                <div>
                                    <DojotBtnCircle click={this.setRemovalMode} icon="fa fa-chevron-left" tooltip="Remove templates" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="col s12 body">
                        {this.props.templates.map(temp => (
                            <div key={temp.id} className="card template-card" title={temp.label}>
                                { this.props.state == 0 ? (
                                    <div>
                                        <div onClick={this.removeTemplate.bind(this, temp)} className="remove-layer">
                                            <i className="fa fa-remove" />
                                        </div>
                                        <div className="template-name truncate space-p-r">{temp.label}</div>
                                    </div>
                                ) : (
                                    null
                                )}

                                { this.props.state == 1 ? (
                                    <div>
                                        { temp.active ? (
                                            <div onClick={this.toggleTemplate.bind(this, temp)} className="active-layer">
                                                <i className="fa fa-check" />
                                            </div>) : (
                                                <div onClick={this.toggleTemplate.bind(this, temp)} className="empty-layer" />
                                        ) }
                                        <div className="template-name truncate">{temp.label}</div>
                                    </div>
                                ) : (
                                    null
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return (
            <div className="col s12 template-frame">
                <div className="padding10 background-info pb160px">Create a template first</div>
            </div>
        );
    }
}

class NewDevice extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        FormActions.set(null);
        const edit = this.props.params.device;
        if (edit) {
            FormActions.fetch(edit);
        }
        TemplateActions.fetchTemplates.defer();
    }

    render() {
        let title = 'New device';
        let edition = false;
        if (this.props.params.device) edition = true;

        let ops = function (device) {
            DeviceActions.addDevice(device, (device) => {
                toaster.success('Device created');
                // hashHistory.push('/device/list');
            });
        };
        if (this.props.params.device) {
            title = 'Edit device';
            ops = function (device) {
                DeviceActions.triggerUpdate(device, () => {
                    toaster.success('Device updated');
                    // hashHistory.push('/device/list');
                });
            };
        }
        // console.log('this.props,', this.props);
        return (
            <div className="full-width full-height">
                <ReactCSSTransitionGroup transitionName="first" transitionAppear transitionAppearTimeout={500} transitionEntattrTypeerTimeout={500} transitionLeaveTimeout={500}>
                    <NewPageHeader title="Devices" subtitle="device manager" icon="device">
                        <div className="box-sh">
                            {this.props.params.device ? (
                                <DojotBtnRedCircle
                                    to={`/device/id/${this.props.params.device}/detail`}
                                    icon="fa fa-arrow-left"
                                    tooltip="Return to device details"
                                />
                            ) : (
                                <DojotBtnRedCircle
                                    to="/device/list"
                                    icon="fa fa-arrow-left"
                                    tooltip="Return to device list"
                                />
                            )}
                        </div>
                    </NewPageHeader>
                    <AltContainer stores={{ device: DeviceFormStore, templates: TemplateStore }}>
                        <DeviceForm deviceid={this.props.params.device} edition={edition} operator={ops} />
                    </AltContainer>
                </ReactCSSTransitionGroup>
            </div>
        );
    }
}

export { NewDevice };
