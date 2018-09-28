/* eslint-disable */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import AltContainer from 'alt-container';
import { hashHistory } from 'react-router';
import toaster from '../../comms/util/materialize';

import { Loading } from '../../components/Loading';
import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';

import ImageStore from '../../stores/ImageStore';
import ImageActions from '../../actions/ImageActions';

import { ImageCard, NewImageCard } from '../firmware/elements';

import {
    Filter, Pagination, FilterLabel, GenericOperations,
} from '../utils/Manipulation';
import util from '../../comms/util/util';

import { NewPageHeader } from '../../containers/full/PageHeader';
import { DojotBtnLink } from '../../components/DojotButton';


import { RemoveModal } from '../../components/Modal';


// this component is pretty similar to FirmwareCardImpl

class ImageModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            creating: false,
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

    dismiss() {
        // console.log('dismiss');
        this.props.toggleModal();
    }


    // toggleModal() {
    //     this.props.toggleModal();
    // }

    render() {
        // console.log("Rendering Image Modal", this.props);

        const images = [];
        for (const img in this.props.images) images.push(this.props.images[img]);

        let default_version = this.props.template.config_attrs.filter(
            (elem, index) => elem.type === 'fw_version',
        )[0];
        if (default_version) default_version = default_version.static_value;
        // console.log("default fw_version: ", default_version);

        return (

            <div className="image-modal-canvas">
                <div className="full-background" onClick={this.dismiss} />
                <ReactCSSTransitionGroup transitionName="imageModal">

                    <div className="image-modal-div imageModal">
                        <div className="row im-header">
                            <div className="col s12 pl40">
                                <div className="icon-firmware" />

                                <label className="title truncate" title={this.props.template.label}>{this.props.template.label}</label>
                                <label className="subtitle">Firmware Management</label>
                            </div>
                        </div>

                        <div className="col s12">
                            <div className="card-size card-size-clear">
                                <div className="attr-area">
                                    {images.map((img, idx) => (
                                        <ImageCard updateDefaultVersion={this.props.updateDefaultVersion} template_id={this.props.template.id} image={img} key={idx} default_version={default_version} />
                                    ))}
                                    {this.state.creating === false && (
                                        <div className="image-card image-card-attributes">
                                            <div onClick={this.createNewImage} className="lst-blockquote col s12">
                                                <span className="new-image-text"> Create a new Image</span>
                                            </div>
                                        </div>
                                    )}
                                    {this.state.creating === true && <NewImageCard refreshImages={this.props.refreshImages} setNewImage={this.setNewImage} template={this.props.template} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </ReactCSSTransitionGroup>

            </div>
        );
    }
}


class TemplateTypes {
    constructor() {
        this.availableValueTypes = [
            { value: 'geo:point', label: 'Geo' },
            { value: 'float', label: 'Float' },
            { value: 'integer', label: 'Integer' },
            { value: 'string', label: 'String' },
            { value: 'boolean', label: 'Boolean' },
        ];
        this.availableTypes = [
            { value: 'dynamic', label: 'Dynamic Value' },
            { value: 'static', label: 'Static Value' },
            { value: 'actuator', label: 'Actuator' },
        ];
        this.configTypes = [
            { value: 'mqtt', label: 'MQTT' },
        ];
        this.configValueTypes = [
            // {"value": "fw_version", "label": "Firmware Version" },
            { value: 'protocol', label: 'Protocol' },
            { value: 'topic', label: 'Topic' },
            { value: 'translator', label: 'Translator' },
            { value: 'device_timeout', label: 'Device Timeout' },
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

const attrType = new TemplateTypes();

class AttributeList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSuppressed: true,
            fieldSizeDyAttrStatus: false,
            fieldSizeStaticAttrStatus: false,
        };

        this.suppress = this.suppress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
        this.availableValueTypes = attrType.getValueTypes();
        this.availableTypes = attrType.getTypes();
    }

    componentWillMount() {
        if (this.props.attributes.label.length > 18) {
            this.setState({ fieldSizeDyAttrStatus: true });
        }

        if (this.props.attributes.hasOwnProperty('static_value')) {
            if (this.props.attributes.static_value.length > 18) {
                this.setState({ fieldSizeStaticAttrStatus: true });
            }
        }
    }

    suppress() {
        this.setState({ isSuppressed: !this.state.isSuppressed });
    }

    handleChange(event) {
        this.props.onChangeValue(event, this.props.index);
    }

    removeAttribute(attribute) {
        this.props.removeAttribute(attribute, false);
    }

    render() {
        const staticValue = this.props.attributes.static_value || '';
        return (
            <div className={`attr-area ${this.state.isSuppressed ? 'suppressed' : ''}`}>
                <div className="attr-row">
                    <div className="icon">
                        <img src="images/tag.png" />
                    </div>
                    <div className="attr-content">
                        <input
                            className={this.state.fieldSizeDyAttrStatus ? 'truncate' : ''}
                            type="text"
                            value={this.props.attributes.label}
                            disabled={!this.props.editable}
                            name="label"
                            onChange={this.handleChange}
                            maxLength="25"
                            title={this.props.attributes.label}
                        />
                        <span>Name</span>
                    </div>
                    <div className="center-text-parent material-btn right-side" onClick={this.suppress}>
                        <i className={`${this.state.isSuppressed ? 'fa fa-angle-down' : 'fa fa-angle-up'} center-text-child text`} />
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon" />
                    <div className="attr-content">
                        <select
                            id="select_attribute_type"
                            className="card-select"
                            name="value_type"
                            value={this.props.attributes.value_type}
                            disabled={!this.props.editable}
                            onChange={this.handleChange}
                        >
                            <option value="">Select type</option>
                            {this.availableValueTypes.map(opt => <option value={opt.value} key={opt.label}>{opt.label}</option>)}
                        </select>

                        <span>Type</span>
                    </div>
                    <div
                        className={`${this.props.editable ? '' : 'none'} center-text-parent material-btn right-side raised-btn`}
                        title="Remove Attribute"
                        onClick={this.removeAttribute.bind(this, this.props.index)}
                    >
                        <i className="fa fa-trash center-text-child icon-remove" />
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon" />
                    <div className="attr-content">
                        <input
                            className={this.state.fieldSizeStaticAttrStatus ? 'truncate' : ''}
                            type="text"
                            value={staticValue}
                            disabled={!this.props.editable}
                            name="static_value"
                            onChange={this.handleChange}
                            maxLength="25"
                            title={staticValue}
                        />
                        <select
                            id="select_attribute_type"
                            className="card-select mini-card-select"
                            name="type"
                            value={this.props.attributes.type}
                            disabled={!this.props.editable}
                            onChange={this.handleChange}
                        >
                            <option value="">Select type</option>
                            {this.availableTypes.map(opt => <option value={opt.value} key={opt.label}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        );
    }
}

class ConfigList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSuppressed: true,
            configFieldSizeStatus: false,
        };

        this.suppress = this.suppress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
        this.availableValueTypes = attrType.getConfigValueTypes();
        this.availableTypes = attrType.getConfigTypes();
    }

    componentWillMount() {
        if (this.props.attributes.hasOwnProperty('static_value')) {
            if (this.props.attributes.static_value.length > 18) {
                this.setState({ configFieldSizeStatus: true });
            }
        }
    }

    suppress() {
        const state = this.state;
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
        if (this.props.attributes.type == 'fw_version') {
            return null;
        }

        const staticValue = this.props.attributes.static_value || '';

        return (
            <div className={`attr-area ${this.state.isSuppressed ? 'suppressed' : ''}`}>
                <div className="attr-row">
                    <div className="icon">
                        <img src="images/gear-dark.png" />
                    </div>
                    <div className="attr-content">
                        <select
                            id="select_attribute_type"
                            className="card-select"
                            name="label"
                            value={this.props.attributes.label}
                            disabled={!this.props.editable}
                            onChange={this.handleChange}
                        >
                            <option value="">Select type</option>
                            {this.availableValueTypes.map(opt => <option value={opt.value} key={opt.label}>{opt.label}</option>)}
                        </select>
                        <span>Type</span>
                    </div>
                    <div className="center-text-parent material-btn right-side" onClick={this.suppress}>
                        <i className={`${this.state.isSuppressed ? 'fa fa-angle-down' : 'fa fa-angle-up'} center-text-child text`} />
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon" />
                    <div className="attr-content">
                        <input
                            className={(this.props.attributes.label === 'protocol' ? 'none' : '') || (this.state.configFieldSizeStatus ? 'truncate' : '')}
                            type="text"
                            name="static_value"
                            value={staticValue}
                            disabled={!this.props.editable}
                            onChange={this.handleChange}
                            title={staticValue}
                            maxLength="25"
                        />
                        <select
                            id="select_attribute_type"
                            className={`${this.props.attributes.label === 'protocol' ? '' : 'none'} card-select`}
                            name="static_value"
                            value={staticValue}
                            disabled={!this.props.editable}
                            onChange={this.handleChange}
                        >
                            <option value="">Select type</option>
                            {this.availableTypes.map(opt => <option value={opt.value} key={opt.label}>{opt.label}</option>)}
                        </select>
                        <span>Meta Value</span>
                    </div>
                    <div
                        className={`${this.props.editable ? '' : 'none'} center-text-parent material-btn right-side raised-btn`}
                        title="Remove Attribute"
                        onClick={this.removeAttribute.bind(this, this.props.index)}
                    >
                        <i className="fa fa-trash center-text-child icon-remove" />
                    </div>
                </div>
            </div>
        );
    }
}

class NewAttribute extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSuppressed: true,
            isConfiguration: false,
            newAttr: {
                type: '',
                value_type: '',
                value: '',
                label: '',
            },
            isActuator: false,
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
        const state = this.state;
        state.isSuppressed = !state.isSuppressed;
        state.isConfiguration = property;
        state.newAttr = { value_type: '', value: '', label: '' };
        property === true ? state.newAttr.type = 'meta' : state.newAttr.type = 'dynamic';
        this.setState(state);
        this.handleChangeStatus(property);
    }

    handleChange(event) {
        const target = event.target;
        const state = this.state;
        state.newAttr[target.name] = target.value;
        if (target.value == 'actuator') {
            state.isActuator = true;
        } else if (target.value == 'dynamic' || target.value == 'static') {
            state.isActuator = false;
        }
        this.setState(state);
    }

    addAttribute(attribute) {
        let ret = util.isNameValid(attribute.label);
        if (!ret.result && !this.state.isConfiguration) {
            toaster.error(ret.error);
            return;
        }

        ret = util.isTypeValid(attribute.value, attribute.value_type, attribute.type, this.state.isActuator);
        if (!ret.result) {
            toaster.error(ret.error);
            return;
        }

        // type of attribute can't be empty
        if (attribute.value_type == '') {
            toaster.error("You can't leave type empty");
            return;
        }

        this.props.addAttribute(attribute, this.state.isConfiguration, this.state.isActuator);
        this.suppress();
    }

    discardAttribute() {
        const state = this.state;
        state.newAttr = {
            type: '',
            value_type: '',
            value: '',
            label: '',
        };
        this.setState(state);
        this.suppress();
    }

    render() {
        return (
            <div className={`new-attr-area attr-area ${this.state.isSuppressed ? 'suppressed-shadow' : ''}`}>

                <div className={`add-row ${this.state.isSuppressed ? '' : 'invisible zero-height'}`}>
                    <div
                        className="add-btn add-config"
                        onClick={this.suppress.bind(this, true)}
                        title="Add New Configuration"
                    >
                        <div className="icon">
                            <img src="images/add-gear.png" />
                        </div>
                        <div className="text">
                            <span>configuration</span>
                        </div>
                    </div>
                    <div
                        className="add-btn add-attr"
                        onClick={this.suppress.bind(this, false)}
                        title="Add New Attribute"
                    >
                        <div className="icon">
                            <img src="images/add-tag.png" />
                        </div>
                        <div className="text">
                            <span>attribute</span>
                        </div>
                    </div>
                    <div className="middle-line" />
                </div>

                <div className={(this.state.isSuppressed ? 'invisible' : 'padding5')}>
                    <div className={`attr-row ${this.state.isConfiguration ? 'none' : ''}`}>
                        <div className="icon">
                            <img src="images/add-tag.png" />
                        </div>

                        <div className="attr-content ">
                            <input
                                type="text"
                                value={this.state.newAttr.label}
                                maxLength="25"
                                onChange={this.handleChange}
                                name="label"
                            />
                            <span>Name</span>
                        </div>
                    </div>

                    <div className="attr-row">
                        <div className="icon">
                            <img className={(this.state.isConfiguration ? '' : 'none')} src="images/add-gear.png" />
                        </div>
                        <div className="attr-content">
                            <select
                                id="select_attribute_type"
                                className="card-select dark-background"
                                name="value_type"
                                value={this.state.newAttr.value_type}
                                onChange={this.handleChange}
                            >
                                <option value="">Select type</option>
                                {this.state.isConfiguration ? (this.configValueTypes.map(opt => <option value={opt.value} key={opt.label}>{opt.label}</option>)) : (this.availableValueTypes.map(opt => <option value={opt.value} key={opt.label}>{opt.label}</option>))}
                            </select>
                            <span>Type</span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon" />
                        <div className="attr-content">
                            {this.state.isActuator ? null
                                : (
                                    <input
                                        className={(this.state.newAttr.value_type === 'protocol' ? 'none' : '')}
                                        type="text"
                                        value={this.state.newAttr.value}
                                        maxLength="25"
                                        onChange={this.handleChange}
                                        name="value"
                                    />
                                )}

                            <select
                                id="select_attribute_type"
                                className={`${this.state.isConfiguration ? (this.state.newAttr.value_type === 'protocol' ? '' : 'none') : 'none'} card-select dark-background`}
                                name="value"
                                value={this.state.newAttr.value}
                                onChange={this.handleChange}
                            >
                                <option value="">Select type</option>
                                {this.configTypes.map(opt => <option value={opt.value} key={opt.label}>{opt.label}</option>)}
                            </select>

                            <span className={(this.state.isConfiguration ? '' : 'none')}>Value</span>

                            <select
                                id="select_attribute_type"
                                className={`${this.state.isConfiguration ? 'none' : ''} card-select mini-card-select dark-background`}
                                name="type"
                                value={this.state.newAttr.type}
                                onChange={this.handleChange}
                            >
                                <option value="">Select type</option>
                                {this.availableTypes.map(opt => <option value={opt.value} key={opt.label}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div
                        className="material-btn center-text-parent"
                        title="Add a new Attribute"
                        onClick={this.addAttribute.bind(this, this.state.newAttr)}
                    >
                        <span className="text center-text-child light-text">add</span>
                    </div>
                    <div
                        className="material-btn center-text-parent"
                        title="Discard Changes"
                        onClick={this.discardAttribute}
                    >
                        <span className="text center-text-child light-text">discard</span>
                    </div>
                </div>
            </div>

        );
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
        const modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement).ready(() => {
            $('.modal').modal();
        });
    }

    dismiss(event) {
        event.preventDefault();
        const modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement).modal('close');
    }

    remove(event) {
        event.preventDefault();
        const modalElement = ReactDOM.findDOMNode(this.refs.modal);
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
        );
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
        // this.getDataAttrs = this.getDataAttrs.bind(this);
    }


    refreshImages() {
        // console.log("this.state.template.label", this.state.template.label);
        ImageActions.fetchSingle.defer(this.state.template.label, () => {
        });
    }

    componentDidMount() {
        if (this.state.template.isNewTemplate) {
            this.setState({ isEditable: true, isSuppressed: false });
        } else {
            let fw_version = null;
            const attr = this.state.template.config_attrs.filter(
                (elem, index) => elem.type == 'fw_version',
            )[0];
            if (attr) fw_version = attr.static_value;
            this.setState({ fw_version_used: fw_version });
        }
    }

    componentWillMount() {
        const template = this.state.template;
        for (const k in template.config_attrs) {
            if (template.config_attrs[k].type == 'actuator') {
                template.data_attrs.push(template.config_attrs[k]);
                template.config_attrs.splice(k, 1);
            }
        }
        this.setState({ template });
    }

    handleDismiss(e) {
        e.preventDefault();
        const state = this.state;
        state.template = state.template = JSON.parse(JSON.stringify(this.clone));
        this.editCard();
    }

    updateTemplate(e) {
        if (e != undefined) e.preventDefault();
        // Verify template name
        let ret = util.isNameValid(this.state.template.label);
        if (!ret.result && !this.state.isConfiguration) {
            toaster.error(ret.error);
            return;
        }

        const template = this.state.template;
        template.has_icon = this.props.template.has_icon;
        this.state.template.attrs = [];
        this.state.template.attrs.push.apply(this.state.template.attrs, this.state.template.data_attrs);
        this.state.template.attrs.push.apply(this.state.template.attrs, this.state.template.config_attrs);

        this.removeAttributeId(this.state.template);
        // Validation of template attributes
        for (const k in this.state.template.attrs) {
            // console.log('attrs: ', this.state.template.attrs);
            // Validation of config attributes
            let ret = util.isNameValid(this.state.template.attrs[k].label);
            if (!ret.result && !this.state.isConfiguration) {
                toaster.error(ret.error);
                return;
            }

            if (this.state.template.attrs[k].type == 'meta') {
                if (this.state.template.attrs[k].label == '') {
                    toaster.error("You can't leave configuration attribute type empty");
                    return;
                }

                if (this.state.template.attrs[k].static_value == '') {
                    toaster.error("You can't leave configuration attribute value empty");
                    return;
                }

                // Validation of device_timeout
                if (this.state.template.attrs[k].label == 'device_timeout') {
                    ret = util.isDeviceTimeoutValid(this.state.template.attrs[k].static_value);
                    if (!ret.result) {
                        toaster.error(ret.error);
                        return;
                    }
                }
            } else {
                // Validation of data attributes
                if (this.state.template.attrs[k].label == '') {
                    toaster.error("You can't leave attribute name empty");
                    return;
                }

                if (this.state.template.attrs[k].value_type == '') {
                    toaster.error("You can't leave attribute value type empty");
                    return;
                }

                if (this.state.template.attrs[k].type == 'static') {
                    ret = util.isTypeValid(this.state.template.attrs[k].static_value, this.state.template.attrs[k].value_type, this.state.template.attrs[k].type);
                    if (!ret.result) {
                        toaster.error(ret.error);
                        return;
                    }
                }
            }

            // Verify if name is already exist
            for (const j in this.state.template.attrs) {
                if (k != j) {
                    if (this.state.template.attrs[k].label == this.state.template.attrs[j].label) {
                        toaster.error('Name already exists');
                        return;
                    }
                }
            }
        }

        TemplateActions.triggerUpdate(this.state.template, (template) => {
            toaster.success('Template updated');
        });
    }

    removeAttributeId(template) {
        for (const index in template.attrs) {
            delete template.attrs[index].id;
        }
    }

    deleteTemplate(e) {
        e.preventDefault();
        TemplateActions.triggerRemoval(this.state.template.id, (template) => {
            hashHistory.push('/template/list');
            toaster.success('Template removed');
            this.props.temp_opex._fetch();
        });
    }

    addAttribute(attribute, isConfiguration) {
        const state = this.state.template;
        if (isConfiguration) {
            // we should check if config_attrs and data_attrs already contains the pair (label, type) before save it.

            if (state.config_attrs.filter(
                (elem, index) => elem.label == attribute.value_type,
            )[0]) {
                toaster.warning(`The label '${attribute.value_type}' is already created.`);
                return;
            }

            state.config_attrs.push({
                label: attribute.value_type,
                value_type: 'string',
                type: attribute.type,
                static_value: attribute.value,
            });
        } else {
            if (state.data_attrs.filter(
                (elem, index) => elem.label == attribute.label,
            )[0]) {
                toaster.warning(`The label ${attribute.label} is already created.`);
                return;
            }

            state.data_attrs.push({
                label: attribute.label,
                type: attribute.type,
                value_type: attribute.value_type,
                static_value: attribute.value,
            });
        }
        attribute.label = '';
        attribute.type = '';
        attribute.value_type = '';
        attribute.value = '';
        this.setState({ template: state });
    }

    removeAttribute(index, isConfiguration) {
        const state = this.state.template;
        if (isConfiguration) state.config_attrs.splice(index, 1);
        else state.data_attrs.splice(index, 1);
        this.setState({ template: state });
    }

    handleAttribute(event) {
        const target = event.target;
        const state = this.state;
        state.template[target.name] = target.value;
        this.setState(state);
    }

    handleChangeAttribute(event, key) {
        const target = event.target;
        const state = this.state;
        state.template.data_attrs[key][target.name] = target.value;
        this.setState(state);
    }

    handleChangeConfig(event, key) {
        const target = event.target;
        const state = this.state;
        state.template.config_attrs[key][target.name] = target.value;
        this.setState(state);
    }

    suppress() {
        const state = this.state;
        state.isSuppressed = !state.isSuppressed;
        this.setState(state);
    }

    getStatus(newState) {
        const state = this.state;
        state.isConfiguration = newState;
        this.setState(state);
    }

    editCard() {
        const state = this.state;
        state.isEditable = !state.isEditable;
        this.setState(state);
    }

    addTemplate(e) {
        e.preventDefault();
        const ret = util.isNameValid(this.state.template.label);
        if (!ret.result && !this.state.isConfiguration) {
            toaster.error(ret.error);
            return;
        }

        this.state.template.attrs.push.apply(this.state.template.attrs, this.state.template.data_attrs);
        this.state.template.attrs.push.apply(this.state.template.attrs, this.state.template.config_attrs);
        TemplateActions.addTemplate(this.state.template, (template) => {
            toaster.success('Template created.');
            TemplateActions.removeSingle('new_template');
            this.props.enableNewTemplate();
            this.props.temp_opex._fetch();
        });
    }

    discardUnsavedTemplate(e) {
        e.preventDefault();
        TemplateActions.removeSingle('new_template');
        // TemplateActions.fetchTemplates.defer();
        this.props.enableNewTemplate();
    }

    handleModal() {
        this.setState({ show_modal: true });
    }

    openModal(status) {
        this.setState({ show_modal: status });
    }

    openImageModal() {
        this.refreshImages();
        this.setState({ show_image_modal: true });
    }

    toggleImageModal() {
        // console.log("toggle_image_modal");
        this.setState({ show_image_modal: !this.state.show_image_modal });
    }

    updateDefaultVersion(img) {
        // console.log("update Star", img);
        // 1. remove previous default version
        const tmplt = this.state.template;
        tmplt.config_attrs = tmplt.config_attrs.filter(
            (elem, index) => elem.type != 'fw_version',
        );

        // 2. add a new version
        tmplt.config_attrs.push({
            label: 'fw_version',
            value_type: 'string',
            type: 'fw_version',
            static_value: img,
        });
        // 3. update state and after save the template
        this.setState(
            { template: tmplt },
            () => this.updateTemplate(),
        );
    }

    // getDataAttrs(template){
    //     console.log("t: ", template);
    // }

    render() {
        // let data_attrs = this.props.template.attrs;
        // this.getDataAttrs(this.state.template);
        let fw_version_used = 'No default image';
        if (this.state.fw_version_used) {
            fw_version_used = this.state.fw_version_used;
        }

        const attrs = this.state.template.data_attrs.length + this.state.template.config_attrs.length;

        return (
            <div className={`mg20px fl ${this.state.template.isNewTemplate ? 'flex-order-1' : 'flex-order-2'}`}>
                {this.state.show_image_modal ? (
                    <AltContainer store={ImageStore}>
                        <ImageModal updateDefaultVersion={this.updateDefaultVersion} template={this.state.template} refreshImages={this.refreshImages} toggleModal={this.toggleImageModal} />
                    </AltContainer>
                ) : null }

                <div
                    className={`template card-size lst-entry-wrapper z-depth-2 mg0px height-auto ${this.state.isSuppressed ? 'suppressed' : 'full-height'}`}
                    id={this.props.id}
                >
                    {this.state.show_modal ? (
                        <RemoveModal name="template" remove={this.deleteTemplate} openModal={this.openModal} />
                    ) : (
                        <div />
                    )}
                    <div className="lst-entry-title bg-gradient-ciano-blue col s12">
                        <img className="title-icon template" src="images/big-icons/template.png" />
                        <div className="title-text">
                            <input
                                className="template-title-text truncate"
                                placeholder="Template Name"
                                readOnly={!this.state.isEditable}
                                value={this.state.template.label}
                                name="label"
                                title={this.state.template.label}
                                maxLength={45}
                                onChange={this.handleAttribute}
                            />
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
                            className={`center-text-parent material-btn expand-btn right-side ${this.state.isSuppressed ? '' : 'invisible none'}`}
                            onClick={this.suppress}
                        >
                            <i className="fa fa-angle-down center-text-child text" />
                        </div>
                    </div>

                    {(!this.state.template.isNewTemplate
                && (
                    <div className="lst-entry-body img-line-on-template">
                        <div className="attr-row icon-area center-text-parent">
                            <div className="icon" />
                        </div>
                        <div className="text-area center-text-parent attr-content">
                            <div className="attr-content">
                                <label>Firmware used</label>
                                <span>{fw_version_used}</span>
                            </div>
                        </div>
                        <div
                            className="center-text-parent material-btn expand-btn right-side "
                            onClick={this.openImageModal}
                        >
                            <i className="fa fa-pencil center-text-child text" />
                        </div>
                    </div>
                ))}

                    <div className="attr-list" id="style-3">
                        {this.state.template.data_attrs.map((attributes, index) => (
                            <AttributeList
                                key={index}
                                index={index}
                                attributes={attributes}
                                editable={this.state.isEditable}
                                onChangeValue={this.handleChangeAttribute}
                                removeAttribute={this.removeAttribute}
                            />
                        ))}

                        {this.state.template.config_attrs.map((attributes, index) => <ConfigList key={index} index={index} attributes={attributes} editable={this.state.isEditable} onChangeValue={this.handleChangeConfig} removeAttribute={this.removeAttribute} />)}
                    </div>

                    <div className={`card-footer  ${this.state.isConfiguration ? 'config-footer' : ''}`}>
                        <div className={(this.state.isEditable ? '' : 'invisible zero-height')}>
                            <NewAttribute onChangeStatus={this.getStatus} addAttribute={this.addAttribute} />
                        </div>
                        <div>
                            <div
                                className={`material-btn center-text-parent ${this.state.isEditable ? 'none' : ''}`}
                                title="Edit Attributes"
                                onClick={this.editCard}
                            >
                                <span className="text center-text-child">edit</span>
                            </div>
                            <div
                                className={`material-btn center-text-parent raised-btn ${this.state.isEditable ? 'none' : ''}`}
                                title="Remove template"
                                onClick={this.handleModal}
                            >
                                <span className="text center-text-child">remove</span>
                            </div>
                            <div className={(this.state.isEditable ? (this.state.template.isNewTemplate ? 'none' : '') : 'none')}>
                                <div
                                    className="material-btn center-text-parent "
                                    title="Save"
                                    onClick={this.updateTemplate}
                                >
                                    <span className="text center-text-child">save</span>
                                </div>

                                <div
                                    className="material-btn center-text-parent "
                                    title="Discard"
                                    onClick={this.handleDismiss}
                                >
                                    <span className="text center-text-child">discard</span>
                                </div>
                            </div>
                            <div className={(this.state.isEditable ? (this.state.template.isNewTemplate ? '' : 'none') : 'none')}>
                                <div
                                    className="material-btn center-text-parent "
                                    title="Create"
                                    onClick={this.addTemplate}
                                >
                                    <span className="text center-text-child">create</span>
                                </div>
                                <div
                                    className="material-btn center-text-parent "
                                    title="Discard"
                                    onClick={this.discardUnsavedTemplate}
                                >
                                    <span className="text center-text-child">discard</span>
                                </div>
                            </div>
                            <div
                                className={`center-text-parent material-btn right-side ${this.state.isEditable ? 'none' : ''}`}
                                onClick={this.suppress}
                            >
                                <i className="fa fa-angle-up center-text-child text" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class TemplateList extends Component {
    constructor(props) {
        super(props);

        this.state = {};
        this.filteredList = [];

        this.detailedTemplate = this.detailedTemplate.bind(this);
        this.editTemplate = this.editTemplate.bind(this);
        this.updateTemplate = this.updateTemplate.bind(this);
        this.deleteTemplate = this.deleteTemplate.bind(this);
    }

    detailedTemplate(id) {
        const temp = this.state;
        temp.detail = id;
        this.setState(temp);
    }

    editTemplate(id) {
        if (this.state.detail === id) {
            const temp = this.state;
            temp.edit = id;
            this.setState(temp);
            return true;
        }

        return false;
    }

    // @TO_CHECK I guess that every call to the function below aren't passing any parameter
    updateTemplate(template) {
        this.props.updateTemplate(template);

        // let state = this.state;
        // state.edit = undefined;
        this.setState({ edit: undefined });
    }

    deleteTemplate(id) {
        this.props.deleteTemplate(id);
        const state = this.state;
        state.edit = undefined;
        this.setState(state);
    }

    convertTemplateList() {
        this.filteredList = [];
        for (const k in this.props.templates) {
            this.filteredList.push(this.props.templates[k]);
        }
    }

    render() {
        if (this.props.loading) {
            return (
                <div className="row full-height relative">
                    <Loading />
                </div>
            );
        }

        this.convertTemplateList();

        if (this.filteredList.length > 0) {
            let existsNewDevice = false;
            let newTemplate;

            for (let i = 0; i < this.filteredList.length; i++) {
                if (this.filteredList[i].isNewTemplate != undefined) {
                    if (this.filteredList[i].isNewTemplate) {
                        existsNewDevice = true;
                        newTemplate = this.filteredList[i];
                    }
                }
            }

            if (existsNewDevice) {
                const filteredListAux = [];
                filteredListAux[0] = newTemplate;
                for (let i = 0; i < this.filteredList.length - 1; i++) {
                    if (this.filteredList[i].isNewTemplate === undefined) {
                        filteredListAux[filteredListAux.length + 1] = this.filteredList[i];
                    }
                }
                this.filteredList = filteredListAux;
            }
        }

        return (
            <div className="full-height flex-container">
                {this.filteredList.length > 0 ? (
                    <div className="col s12 lst-wrapper w100">
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
                                temp_opex={this.props.temp_opex}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="background-info valign-wrapper full-height">
                        <span className="horizontal-center">
                            {this.props.temp_opex.hasFilter()
                                ? <b className="noBold">No templates to be shown</b>
                                : <b className="noBold">No configured templates</b>
                            }
                        </span>
                    </div>
                )}
            </div>
        );
    }
}


class TemplateOperations extends GenericOperations {
    constructor() {
        super();
        this.filterParams = { sortBy: 'label' };
        this.paginationParams = {};
        this.setDefaultPaginationParams();
    }


    whenUpdatePagination(config) {
        for (const key in config) this.paginationParams[key] = config[key];
        this._fetch();
    }

    whenUpdateFilter(config) {
        // set default parameters
        this.setDefaultPageNumber();
        this.filterParams = config;
        this._fetch();
    }

    _fetch() {
        const res = Object.assign({}, this.paginationParams, this.filterParams);
        // console.log('fetching: ', res);
        TemplateActions.fetchTemplates(res);
    }
}


class Templates extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showFilter: false,
            has_new_template: false,
        };

        this.temp_opex = new TemplateOperations();
        this.addTemplate = this.addTemplate.bind(this);
        this.toggleSearchBar = this.toggleSearchBar.bind(this);
        this.enableNewTemplate = this.enableNewTemplate.bind(this);
    }

    toggleSearchBar() {
        const last = this.state.showFilter;
        this.setState({ showFilter: !last });
    }

    addTemplate() {
        if (this.state.has_new_template) return;
        const template = {
            id: 'new_template',
            label: '',
            data_attrs: [],
            config_attrs: [],
            attrs: [],
            isNewTemplate: true,
        };
        TemplateActions.insertTemplate(template);
        this.setState({ has_new_template: true });
    }

    enableNewTemplate() {
        this.setState({ has_new_template: false });
    }

    componentDidMount() {
        this.temp_opex._fetch();
        this.setState({ has_new_template: false });
    }

    render() {
        this.metaData = { alias: 'template' };

        return (
            <ReactCSSTransitionGroup transitionName="first" transitionAppear transitionAppearTimeout={100} transitionEnterTimeout={100} transitionLeaveTimeout={100}>
                <div className="full-device-area">
                    <AltContainer store={TemplateStore}>
                        <NewPageHeader title="Templates" subtitle="Templates" icon="template">
                            <FilterLabel ops={this.temp_opex} text="Filtering Templates" />
                            <Pagination show_pagination ops={this.temp_opex} />
                            <OperationsHeader addTemplate={this.addTemplate} toggleSearchBar={this.toggleSearchBar.bind(this)} />
                        </NewPageHeader>
                        <Filter showPainel={this.state.showFilter} metaData={this.metaData} ops={this.temp_opex} fields={FilterFields} />
                        <TemplateList temp_opex={this.temp_opex} enableNewTemplate={this.enableNewTemplate} />
                    </AltContainer>
                </div>
            </ReactCSSTransitionGroup>
        );
    }
}

function OperationsHeader(props) {
    return (
        <div className="col s5 pull-right pt10">
            <div className="searchBtn" title="Show search bar" onClick={props.toggleSearchBar}>
                <i className="fa fa-search" />
            </div>
            <DojotBtnLink
                responsive="true"
                onClick={props.addTemplate} 
                label="New Template"
                alt="Create a new template"
                icon="fa fa-plus"
                className="w130px"
            />

        </div>
    );
}

function FilterFields(props) {
    return (
        <div className="col s12 m12">
            <input id="fld_name" type="text" className="form-control form-control-lg" placeholder="Label" name="label" value={props.fields.label} onChange={props.onChange} />
        </div>
    );
}


export { Templates as TemplateList };
