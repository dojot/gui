import React, {Component} from 'react';
import {Link} from 'react-router'
import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';
import AltContainer from 'alt-container';
import {NewPageHeader} from "../../containers/full/PageHeader";
import Dropzone from 'react-dropzone';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ReactDOM from 'react-dom';

class DeviceImageUpload extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selection: ""
        };

        this.onDrop = this.onDrop.bind(this);
        this.upload = this.upload.bind(this);
    }

    // this allows us to remove the global script required by materialize as in docs
    componentDidMount() {
        let mElement = ReactDOM.findDOMNode(this.refs.modal);
        $(mElement).ready(function () {
            $('.modal').modal();
        })
    }

    onDrop(acceptedFiles) {
        this.setState({selection: acceptedFiles[0]});
    }

    upload(e) {
        TemplateActions.triggerIconUpdate(this.props.targetDevice, this.state.selection);
    }

    render() {
        return (
            <div className="modal" id="imageUpload" ref="modal">
                <div className="modal-content">
                    <div className="row">
                        <Dropzone onDrop={this.onDrop} className="dropbox">
                            <div className="dropbox-help">Try dropping some files here, or click to select files to
                                upload.
                            </div>
                        </Dropzone>
                    </div>
                    {this.state.selection ? (
                        <div className="row fileSelection">
                            <span className="label">Selected file</span>
                            <span className="data">{this.state.selection.name}</span>
                        </div>
                    ) : (
                        <div className="row fileSelection">
                            <span className="data">No file selected</span>
                        </div>
                    )}
                    <div className="pull-right padding-bottom">
                        <a onClick={this.upload}
                           className=" modal-action modal-close waves-effect waves-green btn-flat">Update</a>
                        <a className=" modal-action modal-close waves-effect waves-red btn-flat">Cancel</a>
                    </div>
                </div>
            </div>
        )
    }
}

class TemplateTypes {
    constructor() {
        this.availableValueTypes = [
            {"value": "geo", "label": "Geo"},
            {"value": "float", "label": "Float"},
            {"value": "integer", "label": "Integer"},
            {"value": "string", "label": "Text"},
            {"value": "boolean", "label": "Boolean"}
        ];
        this.availableTypes = [
            {"value": "dynamic", "label": "Dynamic Value"},
            {"value": "static", "label": "Static Value"}
        ];
        this.configTypes = [
            {"value": "MQTT", "label": "MQTT"}
        ];
        this.configValueTypes = [
            {"value": "protocol", "label": "Protocol"},
            {"value": "topic", "label": "Topic"},
            {"value": "translator", "label": "Translator"}
        ];
    }

    getValueTypes() {
        return this.availableValueTypes;
    }

    getTypes() {
        return this.availableTypes;
    }

    getConfigValueTypes() {
        return this.configValueTypes;
    }

    getConfigTypes() {
        return this.configTypes;
    }
}

let attrType = new TemplateTypes();

class AttributeList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isSuppressed: true,
        };

        this.suppress = this.suppress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
        this.availableValueTypes = attrType.getValueTypes();
        this.availableTypes = attrType.getTypes();
    }

    suppress() {
        let state = this.state;
        state.isSuppressed = !state.isSuppressed;
        this.setState(state, false);
    }

    handleChange(event) {
        this.props.onChangeValue(event, this.props.index);
    }

    removeAttribute(attribute) {
        this.props.removeAttribute(attribute, false);
    }

    render() {
        return (
            <div className={"attr-area " + (this.state.isSuppressed ? 'suppressed' : '')}>
                <div className="attr-row">
                    <div className="icon">
                        <img src="images/tag.png"/>
                    </div>

                    <div className={"attr-content"}>
                        <input type="text" value={this.props.attributes.label} disabled={!this.props.editable}
                               name={"label"} onChange={this.handleChange}/>
                        <span>Name</span>
                    </div>
                    <div className="center-text-parent material-btn right-side" onClick={this.suppress}>
                        <i className={(this.state.isSuppressed ? 'fa fa-angle-down' : 'fa fa-angle-up') + " center-text-child text"}/>
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon"/>
                    <div className={"attr-content"}>
                        <select id="select_attribute_type" className="card-select"
                                name={"value_type"}
                                value={this.props.attributes.value_type}
                                disabled={!this.props.editable}
                                onChange={this.handleChange}>
                            <option value="">Select type</option>
                            {this.availableValueTypes.map((opt) =>
                                <option value={opt.value} key={opt.label}>{opt.label}</option>
                            )}
                        </select>

                        <span>Type</span>
                    </div>
                    <div className={(this.props.editable ? '' : 'none') + " center-text-parent material-btn right-side"}
                         title={"Remove Attribute"}
                         onClick={this.removeAttribute.bind(this, this.props.index)}>
                        <i className={"fa fa-minus-circle center-text-child icon-remove"}/>
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon"/>
                    <div className={"attr-content"}>
                        <input type="text" value={this.props.attributes.value} disabled={!this.props.editable}
                               name={"value"} onChange={this.handleChange}/>
                        <select id="select_attribute_type" className="card-select mini-card-select"
                                name={"type"}
                                value={this.props.attributes.type}
                                disabled={!this.props.editable}
                                onChange={this.handleChange}>
                            <option value="">Select type</option>
                            {this.availableTypes.map((opt) =>
                                <option value={opt.value} key={opt.label}>{opt.label}</option>
                            )}
                        </select>


                    </div>
                </div>
            </div>

        )
    }
}

class ConfigList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isSuppressed: true,
        };

        this.suppress = this.suppress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
        this.availableValueTypes = attrType.getConfigValueTypes();
        this.availableTypes = attrType.getConfigTypes();

    }

    suppress() {
        let state = this.state;
        state.isSuppressed = !state.isSuppressed;
        this.setState(state);
    }

    handleChange(event) {
        this.props.onChangeValue(event, this.props.index);
    }

    removeAttribute(attribute) {
        this.props.removeAttribute(attribute, true);
    }

    render() {
        return (
            <div className={"attr-area " + (this.state.isSuppressed ? 'suppressed' : '')}>
                <div className="attr-row">
                    <div className="icon">
                        <img src="images/gear-dark.png"/>
                    </div>
                    <div className={"attr-content"}>
                        <select id="select_attribute_type" className="card-select"
                                name={"value_type"}
                                value={this.props.attributes.value_type}
                                disabled={!this.props.editable}
                                onChange={this.handleChange}>
                            <option value="">Select type</option>
                            {this.availableValueTypes.map((opt) =>
                                <option value={opt.value} key={opt.label}>{opt.label}</option>
                            )}
                        </select>
                        <span>Type</span>
                    </div>
                    <div className="center-text-parent material-btn right-side" onClick={this.suppress}>
                        <i className={(this.state.isSuppressed ? 'fa fa-angle-down' : 'fa fa-angle-up') + " center-text-child text"}/>
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon"/>
                    <div className={"attr-content"}>
                        <input className={(this.props.attributes.value_type === "protocol" ? 'none' : '')} type="text"
                               name={"value"} value={this.props.attributes.value}
                               disabled={!this.props.editable} onChange={this.handleChange}/>
                        <select id="select_attribute_type"
                                className={(this.props.attributes.value_type === "protocol" ? '' : 'none') + " card-select"}
                                name={"value"}
                                value={this.props.attributes.value}
                                disabled={!this.props.editable}
                                onChange={this.handleChange}>
                            <option value="">Select type</option>
                            {this.availableTypes.map((opt) =>
                                <option value={opt.value} key={opt.label}>{opt.label}</option>
                            )}
                        </select>
                        <span>{this.props.attributes.type}</span>
                    </div>
                    <div className={(this.props.editable ? '' : 'none') + " center-text-parent material-btn right-side"}
                         title={"Remove Attribute"}
                         onClick={this.removeAttribute.bind(this, this.props.index)}>
                        <i className={"fa fa-minus-circle center-text-child icon-remove"}/>
                    </div>
                </div>
            </div>
        )
    }
}

class NewAttribute extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isSuppressed: true,
            isConfiguration: false,
            newAttr: {
                "type": "static",
                "value_type": "",
                "value": "",
                "label": ""
            }
        };

        this.suppress = this.suppress.bind(this);
        this.availableTypes = attrType.getTypes();
        this.handleChangeStatus = this.handleChangeStatus.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.addAttribute = this.addAttribute.bind(this);
        this.discardAttribute = this.discardAttribute.bind(this);
        this.availableValueTypes = attrType.getValueTypes();
        this.availableTypes = attrType.getTypes();
        this.configValueTypes = attrType.getConfigValueTypes();
        this.configTypes = attrType.getConfigTypes();
    }


    handleChangeStatus(newStatus) {
        this.props.onChangeStatus(newStatus);
    }

    suppress(property) {
        let state = this.state;
        state.isSuppressed = !state.isSuppressed;
        state.isConfiguration = property;
        this.setState(state);
        this.handleChangeStatus(property);
    }

    handleChange(event) {
        const target = event.target;
        let state = this.state;
        state.newAttr[target.name] = target.value;
        this.setState(state);
    }

    addAttribute(attribute) {
        this.props.addAttribute(attribute, this.state.isConfiguration);
        this.suppress();
    }

    discardAttribute() {
        let state = this.state;
        state.newAttr = {
            "type": "static",
            "value_type": "",
            "value": "",
            "label": ""
        };
        this.setState(state);
        this.suppress();
    }

    render() {

        return (
            <div className={"new-attr-area attr-area " + (this.state.isSuppressed ? 'suppressed-shadow' : '')}>

                <div className={"add-row " + (this.state.isSuppressed ? '' : 'invisible zero-height')}>
                    <div className={"add-btn add-config"} onClick={this.suppress.bind(this, true)}
                         title={"Add New Configuration"}>
                        <div className={"icon"}>
                            <img src="images/add-gear.png"/>
                        </div>
                        <div className={"text"}>
                            <span>configuration</span>
                        </div>
                    </div>
                    <div className={"add-btn add-attr"} onClick={this.suppress.bind(this, false)}
                         title={"Add New Attribute"}>
                        <div className={"icon"}>
                            <img src="images/add-tag.png"/>
                        </div>
                        <div className={"text"}>
                            <span>attribute</span>
                        </div>
                    </div>
                    <div className={"middle-line"}/>
                </div>

                <div className={(this.state.isSuppressed ? 'invisible' : '')}>
                    <div className={"attr-row " + (this.state.isConfiguration ? 'none' : '')}>
                        <div className="icon">
                            <img src="images/add-tag.png"/>
                        </div>

                        <div className={"attr-content "}>
                            <input type="text" value={this.state.newAttr.label} onChange={this.handleChange}
                                   name={"label"}/>
                            <span>Name</span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon">
                            <img className={(this.state.isConfiguration ? '' : 'none')} src="images/add-gear.png"/>
                        </div>
                        <div className={"attr-content"}>
                            <select id="select_attribute_type" className="card-select dark-background"
                                    name={"value_type"}
                                    value={this.state.newAttr.value_type}
                                    onChange={this.handleChange}>
                                <option value="">Select type</option>
                                {this.state.isConfiguration ? (this.configValueTypes.map((opt) =>
                                    <option value={opt.value} key={opt.label}>{opt.label}</option>
                                )) : (this.availableValueTypes.map((opt) =>
                                    <option value={opt.value} key={opt.label}>{opt.label}</option>
                                ))}
                            </select>
                            <span>Type</span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon"/>
                        <div className={"attr-content"}>
                            <input className={(this.state.newAttr.value_type === "protocol" ? 'none' : '')} type="text"
                                   value={this.state.newAttr.value} onChange={this.handleChange}
                                   name={"value"}/>

                            <select id="select_attribute_type"
                                    className={(this.state.isConfiguration ? (this.state.newAttr.value_type === "protocol" ? '' : 'none') : 'none') + " card-select dark-background"}
                                    name={"value"}
                                    value={this.state.newAttr.value}
                                    onChange={this.handleChange}>
                                <option value="">Select type</option>
                                {this.configTypes.map((opt) =>
                                    <option value={opt.value} key={opt.label}>{opt.label}</option>
                                )}
                            </select>
                            <span className={(this.state.isConfiguration ? '' : 'none')}>Value</span>

                            <select id="select_attribute_type"
                                    className={(this.state.isConfiguration ? 'none' : '') + " card-select mini-card-select dark-background"}
                                    name={"type"}
                                    value={this.state.newAttr.type}
                                    onChange={this.handleChange}>
                                <option value="">Select type</option>
                                {this.availableTypes.map((opt) =>
                                    <option value={opt.value} key={opt.label}>{opt.label}</option>
                                )}
                            </select>
                        </div>
                    </div>


                    <div className="material-btn center-text-parent" title="Add a new Attribute"
                         onClick={this.addAttribute.bind(this, this.state.newAttr)}>
                        <span className="text center-text-child light-text">add</span>
                    </div>
                    <div className="material-btn center-text-parent" title="Discard Changes"
                         onClick={this.discardAttribute}>
                        <span className="text center-text-child light-text">discard</span>
                    </div>
                </div>
            </div>

        )
    }
}

class ListItem extends Component {
    constructor(props) {
        super(props);

        this.state = {
            device: this.props.device,
            attribute: "",
            typeAttribute: "",
            isSuppressed: true,
            isEditable: false,
            isConfiguration: false
        };

        this.clone = JSON.parse(JSON.stringify(this.state.device));
        this.handleDismiss = this.handleDismiss.bind(this);
        this.addAttribute = this.addAttribute.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
        this.handleAttribute = this.handleAttribute.bind(this);
        this.updateDevice = this.updateDevice.bind(this);
        this.deleteDevice = this.deleteDevice.bind(this);
        this.suppress = this.suppress.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.editCard = this.editCard.bind(this);
        this.handleChangeAttribute = this.handleChangeAttribute.bind(this);
        this.handleChangeConfig = this.handleChangeConfig.bind(this);
    }

    handleDismiss(e) {
        e.preventDefault();
        let state = this.state;
        state.device = state.device = JSON.parse(JSON.stringify(this.clone));
        this.editCard();
    }

    updateDevice(e) {
        e.preventDefault();
        let device = this.state.device;
        device.has_icon = this.props.device.has_icon;
        TemplateActions.triggerUpdate(this.state.device);
    }

    deleteDevice(e) {
        e.preventDefault();
        TemplateActions.triggerRemoval(this.state.device);
    }

    addAttribute(attribute, isConfiguration) {
        let state = this.state.device;
        if (isConfiguration) {
            state.config.push({
                type: attribute.type,
                value_type: attribute.value_type,
                value: attribute.value
            });

        } else {
            state.attrs.push({
                label: attribute.label,
                type: attribute.type,
                value_type: attribute.value_type,
                value: attribute.value
            });
        }
        attribute.label = '';
        attribute.type = '';
        attribute.value_type = '';
        attribute.value = '';
        this.setState({device: state});
    }

    removeAttribute(index, isConfiguration) {
        let state = this.state.device;
        if (isConfiguration)
            state.config.splice(index, 1);
        else
            state.attrs.splice(index, 1);
        this.setState({device: state});
    }

    handleAttribute(event) {
        const target = event.target;
        let state = this.state;
        state[target.name] = target.value;
        this.setState(state);
    }

    handleChangeAttribute(event, key) {
        const target = event.target;
        let state = this.state;
        state.device.attrs[key][target.name] = target.value;
        this.setState(state);
    }

    handleChangeConfig(event, key) {
        const target = event.target;
        let state = this.state;
        state.device.config[key][target.name] = target.value;
        this.setState(state);
    }


    suppress() {
        let state = this.state;
        state.isSuppressed = !state.isSuppressed;
        this.setState(state);
    }

    getStatus(newState) {
        let state = this.state;
        state.isConfiguration = newState;
        this.setState(state);
    }

    editCard() {
        let state = this.state;
        state.isEditable = !state.isEditable;
        this.setState(state);
    }


    render() {
        let attrs = (this.state.device.attrs ? this.state.device.attrs.length : '0');
        return (
            <div
                className={"card-size lst-entry-wrapper z-depth-2 " + (this.state.isSuppressed ? 'suppressed' : 'fullHeight')}
                id={this.props.id}>

                <div className="lst-entry-title col s12">
                    <img className="title-icon" src="images/model-icon.png"/>
                    <div className="title-text">
                        <span className="text"> {this.state.device.label} </span>
                    </div>
                </div>

                <div className="lst-entry-body">

                    <div className="icon-area center-text-parent">
                        <span className="center-text-child">{attrs}</span>
                    </div>

                    <div className="text-area center-text-parent">
                        <span className="middle-text-child">Properties</span>
                    </div>

                    <div
                        className={"center-text-parent material-btn expand-btn right-side " + (this.state.isSuppressed ? '' : 'invisible')}
                        onClick={this.suppress}>
                        <i className="fa fa-angle-down center-text-child text"/>
                    </div>
                </div>

                <div className={"attr-list"} id={"style-3"}>
                    {this.state.device.attrs.map((attributes, index) =>
                        <AttributeList key={index} index={index} attributes={attributes}
                                       editable={this.state.isEditable}
                                       onChangeValue={this.handleChangeAttribute}
                                       removeAttribute={this.removeAttribute}/>)}

                    {this.state.device.config.map((attributes, index) =>
                        <ConfigList key={index} index={index} attributes={attributes} editable={this.state.isEditable}
                                    onChangeValue={this.handleChangeConfig} removeAttribute={this.removeAttribute}/>)}
                </div>

                <div className={"card-footer  " + (this.state.isConfiguration ? 'config-footer' : '')}>
                    <div className={(this.state.isEditable ? '' : 'invisible zero-height')}>
                        <NewAttribute onChangeStatus={this.getStatus} addAttribute={this.addAttribute}/>
                    </div>
                    <div>
                        <div className={"material-btn center-text-parent " + (this.state.isEditable ? 'none' : '')}
                             title="Edit Attributes" onClick={this.editCard}>
                            <span className="text center-text-child">edit</span>
                        </div>

                        <div className={"material-btn center-text-parent " + (this.state.isEditable ? '' : 'none')}
                             title="Edit Attributes" onClick={this.updateDevice}>
                            <span className="text center-text-child">save</span>
                        </div>

                        <div className={"material-btn center-text-parent " + (this.state.isEditable ? '' : 'none')}
                             title="Edit Attributes" onClick={this.handleDismiss}>
                            <span className="text center-text-child">discard</span>
                        </div>

                        <div
                            className={"center-text-parent material-btn right-side " + (this.state.isEditable ? 'none' : '')}
                            onClick={this.suppress}>
                            <i className="fa fa-angle-up center-text-child text"/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class TemplateList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            filter: ''
        };

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.applyFiltering = this.applyFiltering.bind(this);
        this.detailedTemplate = this.detailedTemplate.bind(this);
        this.editTemplate = this.editTemplate.bind(this);
        this.updateDevice = this.updateDevice.bind(this);
        this.deleteDevice = this.deleteDevice.bind(this);
    }

    detailedTemplate(id) {
        if (this.state.detail && this.state.edit) {
        }

        let temp = this.state;
        temp.detail = id;
        this.setState(temp);
        return true;
    }

    editTemplate(id) {
        if (this.state.detail === id) {
            let temp = this.state;
            temp.edit = id;
            this.setState(temp);
            return true;
        }

        return false;
    }

    handleSearchChange(event) {
        const filter = event.target.value;
        let state = this.state;
        state.filter = filter;
        state.detail = undefined;
        this.setState(state);
    }

    applyFiltering(list) {
        return list;

        // const filter = this.state.filter;
        // const idFilter = filter.match(/id:\W*([-a-fA-F0-9]+)\W?/);
        // return this.props.devices.filter(function (e) {
        //     let result = false;
        //     if (idFilter && idFilter[1]) {
        //         result = result || e.id.toUpperCase().includes(idFilter[1].toUpperCase());
        //     }
        //
        //     return result || e.label.toUpperCase().includes(filter.toUpperCase());
        // });
    }

    updateDevice(device) {
        this.props.updateDevice(device);

        let state = this.state;
        state.edit = undefined;
        this.setState(state);
    }

    deleteDevice(id) {
        this.props.deleteDevice(id);

        let state = this.state;
        state.edit = undefined;
        this.setState(state);
    }

    render() {

        const filteredList = this.applyFiltering(this.props.templates);

        if (this.props.loading) {
            return (
                <div className="row full-height relative bg-gray">
                    <div className="background-info valign-wrapper full-height">
                        <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
                    </div>
                </div>
            )
        }
        return (
            <div className="full-height relative bg-gray">
                {filteredList.length > 0 ? (
                    <div className="col s12 lst-wrapper">
                        {filteredList.map((device) =>
                            <ListItem device={device}
                                      key={device.id}
                                      detail={this.state.detail}
                                      detailedTemplate={this.detailedTemplate}
                                      edit={this.state.edit}
                                      editTemplate={this.editTemplate}
                                      updateDevice={this.updateDevice}
                                      deleteDevice={this.deleteDevice}/>
                        )}
                    </div>
                ) : (
                    <div className="background-info valign-wrapper full-height">
                        <span className="horizontal-center">No configured templates</span>
                    </div>
                )}

            </div>
        )
    }
}

class Templates extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        TemplateActions.fetchTemplates.defer();
    }

    render() {
        return (
            <ReactCSSTransitionGroup
                transitionName="first"
                transitionAppear={true}
                transitionAppearTimeout={500}
                transitionEnterTimeout={500}
                transitionLeaveTimeout={500}>
                <NewPageHeader title="Templates" subtitle="Templates" icon='template'>
                    <Link to="/template/new" className="btn-item btn-floating waves-effect waves-light cyan darken-2"
                          title="Create a new template">
                        <i className="fa fa-plus"/>
                    </Link>
                </NewPageHeader>
                <AltContainer store={TemplateStore}>
                    <TemplateList/>
                </AltContainer>
            </ReactCSSTransitionGroup>
        );
    }
}

export {Templates as TemplateList};
