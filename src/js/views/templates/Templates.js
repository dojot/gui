import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import AltContainer from 'alt-container';
import Materialize from 'materialize-css';

import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';

import ImageStore from '../../stores/ImageStore';
import ImageActions from '../../actions/ImageActions';

import { ImageCard, NewImageCard } from "../firmware/elements";


import util from "../../comms/util/util";
import {NewPageHeader} from "../../containers/full/PageHeader";
import { hashHistory } from 'react-router';

import { GenericModal, RemoveModal } from "../../components/Modal";
import Toggle from 'material-ui/Toggle';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';


// this component is pretty similar to FirmwareCardImpl

class ImageModal extends Component {

    constructor(props) {
        super(props);
        this.state = {
            creating: false
        };

        this.images = [];
        this.dismiss = this.dismiss.bind(this);
        // this.toggleModal = this.toggleModal.bind(this);
        this.createNewImage = this.createNewImage.bind(this);
        this.setNewImage = this.setNewImage.bind(this);
    }

    createNewImage() {
        this.setState({ creating: true });
    }

    setNewImage(value) {
        this.setState({ creating: value });
    }

    dismiss()
    {
        console.log("dismiss");
        this.props.toggleModal();
    }


    // toggleModal() {
    //     this.props.toggleModal();
    // }

    render() {
        // console.log("Rendering Image Modal", this.props);

        let images = [];
        for (let img in this.props.images)
            images.push(this.props.images[img]);

        let default_version = this.props.template.config_attrs.filter(
            function (elem, index) {
                return elem.type === "fw_version";
            }
        )[0];
        if (default_version)
            default_version = default_version.static_value;
        // console.log("default fw_version: ", default_version);

        return (

            <div className="image-modal-canvas">
                <div className="full-background" onClick={this.dismiss}> </div>
                <ReactCSSTransitionGroup transitionName="imageModal">

                    <div className="image-modal-div imageModal">
                    <div className="row im-header">
                    <div className="col s12 pl40">
                        <div className="icon-firmware"/>

                        <label className="title">{this.props.template.label}</label>
                        <label className="subtitle">Firmware Management</label>
                    </div>
                    </div>

                    <div className="col s12">
                        <div className="card-size card-size-clear">
                            <div className="attr-area">
                                {images.map((img, idx) => (
                                        <ImageCard updateDefaultVersion={this.props.updateDefaultVersion} template_id={this.props.template.id} image={img} key={idx} default_version={default_version}/>
                                ))}
                                {this.state.creating === false && <div className="image-card image-card-attributes">
                                    <div onClick={this.createNewImage} className="lst-blockquote col s12">
                                        <span className="new-image-text"> Create a new Image</span>
                                    </div>
                                </div >}
                                    {this.state.creating === true && <NewImageCard refreshImages={this.props.refreshImages} setNewImage={this.setNewImage} template={this.props.template} />}
                            </div>
                        </div>
                    </div>
                </div>
                </ReactCSSTransitionGroup>

            </div>
        )
    }
}


class TemplateTypes {
    constructor() {
        this.availableValueTypes = [
            {"value": "geo:point", "label": "Geo"},
            {"value": "float", "label": "Float"},
            {"value": "integer", "label": "Integer"},
            {"value": "string", "label": "String"},
            {"value": "boolean", "label": "Boolean"}
        ];
        this.availableTypes = [
            {"value": "dynamic", "label": "Dynamic Value"},
            {"value": "static", "label": "Static Value"},
            {"value": "actuator", "label": "Actuator"}
        ];
        this.configTypes = [
            {"value": "mqtt", "label": "MQTT"}
        ];
        this.configValueTypes = [
            // {"value": "fw_version", "label": "Firmware Version" },
            {"value": "protocol", "label": "Protocol"},
            {"value": "topic", "label": "Topic"},
            {"value": "translator", "label": "Translator"},
            {"value": "device_timeout", "label": "Device Timeout"}
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
            fieldSizeDyAttrStatus: false,
            fieldSizeStaticAttrStatus: false
        };

        this.suppress = this.suppress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
        this.availableValueTypes = attrType.getValueTypes();
        this.availableTypes = attrType.getTypes();
    }

    componentWillMount(){
        if(this.props.attributes.label.length > 18){
           this.setState({fieldSizeDyAttrStatus: true});
        }

        if (this.props.attributes.hasOwnProperty('static_value')) {
            if(this.props.attributes.static_value.length > 18){
                this.setState({fieldSizeStaticAttrStatus: true});
            }
        }
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
        const staticValue = this.props.attributes.static_value || "";
        return (
            <div className={"attr-area " + (this.state.isSuppressed ? 'suppressed' : '')}>
                <div className="attr-row">
                    <div className="icon">
                        <img src={"images/tag.png"}/>
                    </div>
                    <div className={"attr-content"}>
                        <input className={this.state.fieldSizeDyAttrStatus ? "truncate": ""} type="text" value={this.props.attributes.label} disabled={!this.props.editable}
                               name={"label"} onChange={this.handleChange} maxLength="25" title={this.props.attributes.label}/>
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
                    <div className={(this.props.editable ? '' : 'none') + " center-text-parent material-btn right-side raised-btn"}
                         title={"Remove Attribute"}
                         onClick={this.removeAttribute.bind(this, this.props.index)}>
                        <i className={"fa fa-trash center-text-child icon-remove"}/>
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon"/>
                    <div className={"attr-content"}>
                        <input className={this.state.fieldSizeStaticAttrStatus ? "truncate": ""} type="text" value={staticValue} disabled={!this.props.editable}
                               name={"static_value"} onChange={this.handleChange} maxLength="25" title={staticValue}/>
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
            configFieldSizeStatus: false
        };

        this.suppress = this.suppress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
        this.availableValueTypes = attrType.getConfigValueTypes();
        this.availableTypes = attrType.getConfigTypes();

    }

    componentWillMount(){
        if (this.props.attributes.hasOwnProperty('static_value')) {
            if(this.props.attributes.static_value.length > 18){
                this.setState({configFieldSizeStatus: true});
            }
        }
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
        // console.log("this.props.attributes", this.props.attributes);
        if (this.props.attributes.type == "fw_version"){
            return null;
        }

        const staticValue = this.props.attributes.static_value || '';

        return (
            <div className={"attr-area " + (this.state.isSuppressed ? 'suppressed' : '')}>
                <div className="attr-row">
                    <div className="icon">
                        <img src={"images/gear-dark.png"}/>
                    </div>
                    <div className={"attr-content"}>
                        <select id="select_attribute_type" className="card-select"
                                name={"label"}
                                value={this.props.attributes.label}
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
                        <input className={(this.props.attributes.label === "protocol" ? 'none' : '') || (this.state.configFieldSizeStatus ? "truncate": "")}type="text"
                               name={"static_value"} value={staticValue}
                               disabled={!this.props.editable} onChange={this.handleChange} title={staticValue} maxLength="25"/>
                        <select id="select_attribute_type"
                                className={(this.props.attributes.label === "protocol" ? '' : 'none') + " card-select"}
                                name={"static_value"}
                                value={staticValue}
                                disabled={!this.props.editable}
                                onChange={this.handleChange}>
                            <option value="">Select type</option>
                            {this.availableTypes.map((opt) =>
                                <option value={opt.value} key={opt.label}>{opt.label}</option>
                            )}
                        </select>
                        <span>{'Meta Value'}</span>
                    </div>
                    <div className={(this.props.editable ? '' : 'none') + " center-text-parent material-btn right-side raised-btn"}
                         title={"Remove Attribute"}
                         onClick={this.removeAttribute.bind(this, this.props.index)}>
                        <i className={"fa fa-trash center-text-child icon-remove"}/>
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
                "type": "",
                "value_type": "",
                "value": "",
                "label": ""
            },
            isActuator:false
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

        property === true ?  state.newAttr.type = 'meta': state.newAttr.type = 'dynamic';
        this.setState(state);
        this.handleChangeStatus(property);
    }

    handleChange(event) {
        const target = event.target;
        let state = this.state;
        state.newAttr[target.name] = target.value;
        if(target.value == "actuator"){
            state.isActuator = true;
        } else {
            if(target.value == "dynamic" || target.value == "static"){
                state.isActuator = false;
            }
        }
        this.setState(state);
    }

    addAttribute(attribute) {
        let ret = util.isNameValid(attribute.label);
        if (!ret.result && !this.state.isConfiguration) {
            Materialize.toast(ret.error, 4000);
            return;
        }

        ret = util.isTypeValid(attribute.value, attribute.value_type, attribute.type, this.state.isActuator);
        if (!ret.result){
            Materialize.toast(ret.error, 4000);
            return;
        }

        this.props.addAttribute(attribute, this.state.isConfiguration, this.state.isActuator);
        this.suppress();
    }

    discardAttribute() {
        let state = this.state;
        state.newAttr = {
            "type": "",
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
                            <img src={"images/add-gear.png"}/>
                        </div>
                        <div className={"text"}>
                            <span>configuration</span>
                        </div>
                    </div>
                    <div className={"add-btn add-attr"} onClick={this.suppress.bind(this, false)}
                         title={"Add New Attribute"}>
                        <div className={"icon"}>
                            <img src={"images/add-tag.png"}/>
                        </div>
                        <div className={"text"}>
                            <span>attribute</span>
                        </div>
                    </div>
                    <div className={"middle-line"}/>
                </div>

                <div className={(this.state.isSuppressed ? 'invisible' : 'padding5')}>
                    <div className={"attr-row " + (this.state.isConfiguration ? 'none' : '')}>
                        <div className="icon">
                            <img src={"images/add-tag.png"}/>
                        </div>

                        <div className={"attr-content "}>
                            <input type="text" value={this.state.newAttr.label} maxLength="22" onChange={this.handleChange}
                                   name={"label"}/>
                            <span>Name</span>
                        </div>
                    </div>

                    <div className="attr-row">
                        <div className="icon">
                            <img className={(this.state.isConfiguration ? '' : 'none')} src={"images/add-gear.png"}/>
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
                            {this.state.isActuator ? null :
                            (
                                <input className={(this.state.newAttr.value_type === "protocol" ? 'none' : '')} type="text"
                                value={this.state.newAttr.value} maxLength="22" onChange={this.handleChange}
                                name={"value"}/>  
                            )}

                            <select id="select_attribute_type"
                                    className={(this.state.isConfiguration ? (this.state.newAttr.value_type === 'protocol' ? '' : 'none') : 'none') + " card-select dark-background"}
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

class RemoveDialog extends Component {
  constructor(props) {
    super(props);

    this.dismiss = this.dismiss.bind(this);
    this.remove = this.remove.bind(this);
  }

  componentDidMount() {
    // materialize jquery makes me sad
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).ready(function() {
      $('.modal').modal();
    })
  }

  dismiss(event) {
    event.preventDefault();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).modal('close');
  }

  remove(event) {
    event.preventDefault();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    this.props.callback(event);
    $(modalElement).modal('close');
  }

  render() {
    return (
      <div className="modal" id={this.props.target} ref="modal">
        <div className="modal-content full">
          <div className="row center background-info">
            <div><i className="fa fa-exclamation-triangle fa-4x" /></div>
            <div>You are about to remove this template.</div>
            <div>Are you sure?</div>
          </div>
        </div>
        <div className="modal-footer right">
            <button type="button" className="btn-flat btn-ciano waves-effect waves-light" onClick={this.dismiss}>cancel</button>
            <button type="submit" className="btn-flat btn-red waves-effect waves-light" onClick={this.remove}>remove</button>
        </div>
      </div>
    )
  }
}

class ListItem extends Component {
    constructor(props) {
        super(props);

        this.state = {
            template: this.props.template,
            isSuppressed: true,
            isEditable: false,
            isConfiguration: false,
            show_modal: false,
            show_image_modal: false,
            fw_version_used: null,
        };

        this.clone = JSON.parse(JSON.stringify(this.state.template));
        this.handleDismiss = this.handleDismiss.bind(this);
        this.addAttribute = this.addAttribute.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
        this.handleAttribute = this.handleAttribute.bind(this);
        this.updateTemplate = this.updateTemplate.bind(this);
        this.deleteTemplate = this.deleteTemplate.bind(this);
        this.suppress = this.suppress.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.editCard = this.editCard.bind(this);
        this.handleChangeAttribute = this.handleChangeAttribute.bind(this);
        this.handleChangeConfig = this.handleChangeConfig.bind(this);
        this.addTemplate = this.addTemplate.bind(this);
        this.discardUnsavedTemplate = this.discardUnsavedTemplate.bind(this);
        this.handleModal = this.handleModal.bind(this);
        this.openModal = this.openModal.bind(this);
        this.openImageModal = this.openImageModal.bind(this);
        this.toggleImageModal = this.toggleImageModal.bind(this);
        this.refreshImages = this.refreshImages.bind(this);
        this.updateDefaultVersion = this.updateDefaultVersion.bind(this);
        this.removeAttributeId = this.removeAttributeId.bind(this);
    }


    refreshImages()
    {
        // console.log("this.state.template.label", this.state.template.label);
           ImageActions.fetchSingle.defer(this.state.template.label, () => {
        });
    }

    componentDidMount() {
        if (this.state.template.isNewTemplate) {
            this.setState({ isEditable: true, isSuppressed: false});
        }
        else
        {
            let fw_version = null;
            let attr = this.state.template.config_attrs.filter(
                function (elem, index) {
                    return elem.type == "fw_version";
                }
            )[0];
            if (attr)
                fw_version = attr.static_value;
            this.setState({ fw_version_used: fw_version });
        }
    }

    componentWillMount(){
        let template = this.state.template;
        console.log("template: ", template);
        for(let k in template.config_attrs){
            console.log(k, template.config_attrs[k])
            if(template.config_attrs[k].type == 'actuator'){
                template.data_attrs.push(template.config_attrs[k]);
                template.config_attrs.splice(k, 1);
            }
        }
        this.setState({template: template});
    }

    handleDismiss(e) {
        e.preventDefault();
        let state = this.state;
        state.template = state.template = JSON.parse(JSON.stringify(this.clone));
        this.editCard();
    }

    updateTemplate(e) {
        if (e != undefined)
            e.preventDefault();
        let ret = util.isNameValid(this.state.template.label);
        if (!ret.result && !this.state.isConfiguration) {
            Materialize.toast(ret.error, 4000);
            return;
        }

        for (let i = 0; i < this.state.template.config_attrs.length; i++) {
          if (this.state.template.config_attrs[i].label === "") {
              Materialize.toast("Missing type.", 4000);
              return;
          }
        }

        let template = this.state.template;
        template.has_icon = this.props.template.has_icon;
        this.state.template.attrs = [];
        this.state.template.attrs.push.apply(this.state.template.attrs, this.state.template.data_attrs);
        this.state.template.attrs.push.apply(this.state.template.attrs ,this.state.template.config_attrs);

        this.removeAttributeId(this.state.template);

        TemplateActions.triggerUpdate(this.state.template, (template) => {
          Materialize.toast('Template updated', 4000);
        });
    }

    removeAttributeId(template){
        for(let index in template.attrs){
            delete template.attrs[index].id;
        }
    }

    deleteTemplate(e) {
        e.preventDefault();
          TemplateActions.triggerRemoval(this.state.template.id, (template) => {
          hashHistory.push('/template/list');
          Materialize.toast('Template removed', 4000);
        });
    }

    addAttribute(attribute, isConfiguration) {
        let state = this.state.template;
        if (isConfiguration) {
            // we should check if config_attrs and data_attrs already contains the pair (label, type) before save it.

            if (state.config_attrs.filter(
                function (elem, index) {
                    return elem.label == attribute.value_type && elem.static_value == attribute.value;
                }
            )[0])
            {
                Materialize.toast("The pair (label, type) is already created.", 4000);
                return;
            }

            state.config_attrs.push({
                label: attribute.value_type,
                value_type: "string",
                type: attribute.type,
                static_value: attribute.value
            });

        } else {
            if (state.data_attrs.filter(
                function (elem, index) {
                    return elem.label == attribute.label && elem.value_type == attribute.value_type;

                }
            )[0])
            {
                Materialize.toast("The pair (label, type) is already created.", 4000);
                return;
            }

            state.data_attrs.push({
                label: attribute.label,
                type: attribute.type,
                value_type: attribute.value_type,
                static_value: attribute.value
            });
        }
        attribute.label = '';
        attribute.type = '';
        attribute.value_type = '';
        attribute.value = '';
        this.setState({template: state});
    }

    removeAttribute(index, isConfiguration) {
        let state = this.state.template;
        if (isConfiguration)
            state.config_attrs.splice(index, 1);
        else
            state.data_attrs.splice(index, 1);
        this.setState({template: state});
    }

    handleAttribute(event) {
        const target = event.target;
        let state = this.state;
        state.template[target.name] = target.value;
        this.setState(state);
    }

    handleChangeAttribute(event, key) {
        const target = event.target;
        let state = this.state;
        state.template.data_attrs[key][target.name] = target.value;
        this.setState(state);
    }

    handleChangeConfig(event, key) {
        const target = event.target;
        let state = this.state;
        state.template.config_attrs[key][target.name] = target.value;
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

    addTemplate(e) {
        e.preventDefault();
        let ret = util.isNameValid(this.state.template.label);
        if (!ret.result && !this.state.isConfiguration) {
            Materialize.toast(ret.error, 4000);
            return;
        }

        this.state.template.attrs.push.apply(this.state.template.attrs, this.state.template.data_attrs);
        this.state.template.attrs.push.apply(this.state.template.attrs ,this.state.template.config_attrs);

        TemplateActions.addTemplate(this.state.template, (template) => {
            Materialize.toast('Template created', 4000);
            TemplateActions.removeSingle("new_template");
            this.props.enableNewTemplate();
        })
    }

    discardUnsavedTemplate(e) {
        e.preventDefault();
        TemplateActions.removeSingle("new_template");
        // TemplateActions.fetchTemplates.defer();
        this.props.enableNewTemplate();
    }

    handleModal(){
     this.setState({show_modal: true});
    }

    openModal(status){
     this.setState({show_modal: status});
    }

    openImageModal(){
        this.refreshImages();
        this.setState({show_image_modal:true});
    }

    toggleImageModal(){
        // console.log("toggle_image_modal");
        this.setState({ show_image_modal: !this.state.show_image_modal });
    }

    updateDefaultVersion(img)
    {
        // console.log("update Star", img);
        // 1. remove previous default version
        let tmplt = this.state.template;
        tmplt.config_attrs = tmplt.config_attrs.filter(
            function( elem, index ) {
                return elem.type != "fw_version";
            }
        );

        // 2. add a new version
        tmplt.config_attrs.push({
            label: "fw_version",
            value_type: "string",
            type: "fw_version",
            static_value: img
        });
        // 3. update state and after save the template
        this.setState(
            { template: tmplt },
            () => this.updateTemplate()
        );
    }

    // getDataAttrs(template){
    //     console.log("t: ", template);
    // }

    render() {
        // let data_attrs = this.props.template.attrs;
        // this.getDataAttrs(this.state.template);
        let fw_version_used = "No default image"
        if (this.state.fw_version_used) {
            fw_version_used = this.state.fw_version_used;
        }

        let attrs = this.state.template.data_attrs.length + this.state.template.config_attrs.length;

        return (
            <div className={"mg20px "+ (this.state.template.isNewTemplate ? 'flex-order-1' : 'flex-order-2')}>
            {this.state.show_image_modal ? (
                <AltContainer store={ImageStore}>
                        <ImageModal updateDefaultVersion={this.updateDefaultVersion} template={this.state.template} refreshImages={this.refreshImages} toggleModal={this.toggleImageModal} />
                </AltContainer>
            ) : null }

                <div className={"template card-size lst-entry-wrapper z-depth-2 mg0px " + (this.state.isSuppressed ? 'suppressed' : 'full-height')}
                id={this.props.id}>
                {this.state.show_modal ?(
                  <RemoveModal name={"template"} remove={this.deleteTemplate} openModal={this.openModal} />
                ) : (
                  <div></div>
                )}
                <div className="lst-entry-title bg-gradient-ciano-blue col s12">
                    <img className="title-icon template" src={"images/big-icons/template.png"}/>
                    <div className="title-text">
                       <input className="template-title-text truncate" placeholder={"Template Name"} readOnly={!this.state.isEditable}
                            value={this.state.template.label} name={"label"} title={this.state.template.label} maxLength={45} onChange={this.handleAttribute}/>
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
                        className={"center-text-parent material-btn expand-btn right-side " + (this.state.isSuppressed ? '' : 'invisible none')}
                        onClick={this.suppress}>
                        <i className="fa fa-angle-down center-text-child text"/>
                    </div>
                </div>

            {(!this.state.template.isNewTemplate &&
                <div className="lst-entry-body img-line-on-template">
                        <div className="attr-row icon-area center-text-parent">
                            <div className="icon">
                            </div>
                        </div>
                        <div className="text-area center-text-parent attr-content">
                           <div className="attr-content">
                                <label>Firmware used</label>
                                <span>{fw_version_used}</span>
                           </div>
                        </div>
                    <div
                        className={"center-text-parent material-btn expand-btn right-side "}
                        onClick={this.openImageModal}>
                        <i className="fa fa-pencil center-text-child text" />
                    </div>
                        </div>)}

                <div className={"attr-list"} id={"style-3"}>
                    {this.state.template.data_attrs.map((attributes, index) =>
                        <AttributeList key={index} index={index} attributes={attributes}
                                       editable={this.state.isEditable}
                                       onChangeValue={this.handleChangeAttribute}
                                       removeAttribute={this.removeAttribute}/>)}

                    {this.state.template.config_attrs.map((attributes, index) =>
                        <ConfigList key={index} index={index} attributes={attributes} editable={this.state.isEditable} onChangeValue={this.handleChangeConfig} removeAttribute={this.removeAttribute}/>)}
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
                        <div className={"material-btn center-text-parent raised-btn " + (this.state.isEditable ? 'none' : '')}
                            title="Remove template" onClick={this.handleModal}>
                            <span className="text center-text-child">remove</span>
                        </div>
                        <div className={(this.state.isEditable ? (this.state.template.isNewTemplate ? 'none' : '') : 'none')}>
                            <div className={"material-btn center-text-parent "}
                                 title="Save" onClick={this.updateTemplate}>
                                <span className="text center-text-child">save</span>
                            </div>

                            <div className={"material-btn center-text-parent "}
                                 title="Discard" onClick={this.handleDismiss}>
                                <span className="text center-text-child">discard</span>
                            </div>
                        </div>
                        <div className={(this.state.isEditable ? (this.state.template.isNewTemplate ? '' : 'none') : 'none')}>
                            <div
                                className={"material-btn center-text-parent "}
                                title="Create" onClick={this.addTemplate}>
                                <span className="text center-text-child">create</span>
                            </div>
                            <div className={"material-btn center-text-parent "}
                                    title="Discard" onClick={this.discardUnsavedTemplate}>
                                <span className="text center-text-child">discard</span>
                            </div>
                        </div>
                        <div
                            className={"center-text-parent material-btn right-side " + (this.state.isEditable ? 'none' : '')}
                            onClick={this.suppress}>
                            <i className="fa fa-angle-up center-text-child text"/>
                        </div>
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

        this.filteredList = [];

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.applyFiltering = this.applyFiltering.bind(this);
        this.detailedTemplate = this.detailedTemplate.bind(this);
        this.editTemplate = this.editTemplate.bind(this);
        this.updateTemplate = this.updateTemplate.bind(this);
        this.deleteTemplate = this.deleteTemplate.bind(this);
        this.filterListByName = this.filterListByName.bind(this);
        this.clearInputField = this.clearInputField.bind(this);
    }

    filterListByName (event){
      event.preventDefault();
      this.setState({filter: event.target.value});
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
    }

    // @TO_CHECK but every call to the function below don't pass any parameter
    updateTemplate(template) {
        this.props.updateTemplate(template);

        // let state = this.state;
        // state.edit = undefined;
        this.setState({edit:undefined});
    }

    deleteTemplate(id) {
        this.props.deleteTemplate(id);

        let state = this.state;
        state.edit = undefined;
        this.setState(state);
    }

    convertTemplateList() {
      if (this.state.filter != "") {
        var updatedList = this.filteredList.filter(function(template) {
          return template.label.includes(event.target.value);
        });
        this.filteredList = updatedList;
      } else {
        this.filteredList = [];
        for (let k in this.props.templates) {
          if (this.props.templates.hasOwnProperty(k)){
            this.filteredList.push(this.props.templates[k]);
          }
        }
      }
    }

    clearInputField(){
        this.state.filter = "";
      }

    render() {
        this.filteredList = this.applyFiltering(this.props.templates);

        this.convertTemplateList();

        if (this.props.loading) {
            return (
                <div className="row full-height relative">
                    <div className="background-info valign-wrapper full-height">
                        <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
                    </div>
                </div>
            )
        }

        if (this.filteredList.length > 0) {
            let existsNewDevice = false;
            let newTemplate;

            for (let i = 0; i < this.filteredList.length; i++) {
                if(this.filteredList[i].isNewTemplate != undefined) {
                    if (this.filteredList[i].isNewTemplate) {
                        existsNewDevice = true;
                        newTemplate = this.filteredList[i];
                    }
                }
            }

            if (existsNewDevice) {
                let filteredListAux = [];
                filteredListAux[0] = newTemplate;
                for (let i = 0; i < this.filteredList.length - 1; i++) {
                    if (this.filteredList[i].isNewTemplate === undefined) {
                        filteredListAux[filteredListAux.length + 1] = this.filteredList[i];
                    }
                }
                this.filteredList = filteredListAux;
            }
        }

        let header = null;
        if (this.props.showSearchBox){
            header = <div className={"row z-depth-2 templatesSubHeader " + (this.props.showSearchBox ? "show-dy" : "hide-dy")} id="inner-header">
            <div className="col s3 m3 main-title">
              Showing {this.filteredList.length} template(s)
            </div>
            <div className="col s1 m1 header-info hide-on-small-only">
            </div>
            <div className="col s4 m4">
              <label htmlFor="fld_template_name">Template Name</label>
              <input id="fld_template_name" type="text" name="Template Name" className="form-control form-control-lg" placeholder="Search" value={this.state.filter} onChange={this.filterListByName} />
            </div>
          </div>;
        } else {
            this.filteredList = this.applyFiltering(this.props.templates);
            this.clearInputField();
        }

        return <div className="full-height relative">
        <ReactCSSTransitionGroup transitionName="templatesSubHeader">
          {header}
        </ReactCSSTransitionGroup>
            {this.filteredList.length > 0 ? <div className="col s12 lst-wrapper w100 display-flex">
                {this.filteredList.map(template => (
                  <ListItem
                    template={template}
                    key={template.id}
                    detail={this.state.detail}
                    detailedTemplate={this.detailedTemplate}
                    edit={this.state.edit}
                    editTemplate={this.editTemplate}
                    updateTemplate={this.updateTemplate}
                    deleteTemplate={this.deleteTemplate}
                    enableNewTemplate={this.props.enableNewTemplate}
                    confirmTarget="confirmDiag"
                  />
                ))}
              </div> : <div className="background-info valign-wrapper full-height">
                <span className="horizontal-center">
                   No configured templates
                </span>
              </div>}
          </div>;
    }
}

class Templates extends Component {

    constructor(props) {
        super(props);

        this.addTemplate = this.addTemplate.bind(this);
        this.toggleSearchBar = this.toggleSearchBar.bind(this);
        this.enableNewTemplate = this.enableNewTemplate.bind(this);
        this.state = { showFilter: false,
            has_new_template: false
        };
    }

    toggleSearchBar() {
        const last = this.state.showFilter;
        this.setState({ showFilter: !last });
    }

    addTemplate() {
        if (this.state.has_new_template)
            return;
        let template =
            {
                "id":"new_template",
                "label": "",
                "data_attrs": [],
                "config_attrs": [],
                "attrs": [],
                "isNewTemplate": true
            };
        TemplateActions.insertTemplate(template);
       this.setState({'has_new_template': true});
    }

    enableNewTemplate()
    {
        this.setState({ 'has_new_template': false });
    }

    componentDidMount() {
        TemplateActions.fetchTemplates.defer();
    }

    render() {
        return (
            <ReactCSSTransitionGroup
                transitionName="first"
                transitionAppear={true}
                transitionAppearTimeout={100}
                transitionEnterTimeout={100}
                transitionLeaveTimeout={100}>
                <NewPageHeader title="Templates" subtitle="Templates" icon='template'>
                    <div className="pt10">
                        {/* <div className="searchBtn" title="Show search bar" onClick={this.toggleSearchBar.bind(this)}>
                          <i className="fa fa-search" />
                        </div> */}
                        <div onClick={this.addTemplate} className="new-btn-flat red "
                              title="Create a new template">
                            New Template<i className="fa fa-plus"/>
                        </div>
                    </div>
                </NewPageHeader>
                <AltContainer store={TemplateStore}>
                    <TemplateList enableNewTemplate={this.enableNewTemplate} showSearchBox={this.state.showFilter}/>
                </AltContainer>
            </ReactCSSTransitionGroup>
        );
    }
}

function OperationsHeader(props) {
    return (
        <div className="col s6 pull-right pt10">
            <div className="searchBtn" title="Show search bar" onClick={props.toggleSearchBar}>
                <i className="fa fa-search" />
            </div>
            <div onClick={props.addTemplate} className="new-btn-flat red waves-effect waves-light" title="Create a new template">
                New Template<i className="fa fa-plus" />
            </div>
        </div>
    )
}

function FilterFields(props) {
    return <div className="col s12 m12">
        <input id="fld_name" type="text" className="form-control form-control-lg" placeholder="Label" name="label" value={props.fields.label} onChange={props.onChange} />
      </div>;
}


export {Templates as TemplateList};
