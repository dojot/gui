import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import AltContainer from 'alt-container';
import toaster from 'Comms/util/materialize';
import TemplateActions from 'Actions/TemplateActions';
import util from 'Comms/util/util';
import { withNamespaces } from 'react-i18next';
import ImageStore from 'Stores/ImageStore';
import ability from 'Components/permissions/ability';
import SidebarTemplate from './SidebarTemplate/index';
import SidebarAttribute from './SidebarAttribute/index';
import SidebarMetadata from './SidebarMetadata/index';
import SidebarFirmConfig from './SidebarFirmware/SidebarFirmConfig';
import { templateType, tempOpxType } from '../../TemplatePropTypes';

class Sidebar extends Component {
    static createAttribute() {
        return {
            id: `${Math.floor(Math.random() * 100000)}`,
            label: '',
            type: '',
            value_type: '',
            static_value: '',
        };
    }

    constructor(props) {
        super(props);
        this.state = {
            template: {},
            metadata: {},
            showAttribute: false,
            showMetadata: false,
            showFirmware: false,
            selectAttr: {},
            newAttr: false,
            showDeleteTemplate: false,
            showDeleteAttr: false,
            showDeleteMeta: false,
            isNewMetadata: false,
            isNewTemplate: false,
        };

        this.toogleSidebarFirmware = this.toogleSidebarFirmware.bind(this);
        this.toogleSidebarAttribute = this.toogleSidebarAttribute.bind(this);
        this.toogleSidebarMetadata = this.toogleSidebarMetadata.bind(this);
        this.changeValue = this.changeValue.bind(this);
        this.changeAttrValue = this.changeAttrValue.bind(this);
        this.updateTemplateAttr = this.updateTemplateAttr.bind(this);
        this.addTemplateAttr = this.addTemplateAttr.bind(this);
        this.saveTemplate = this.saveTemplate.bind(this);
        this.updateTemplate = this.updateTemplate.bind(this);
        this.addMetadata = this.addMetadata.bind(this);
        this.handleChangeMetadata = this.handleChangeMetadata.bind(this);
        this.validateAttrs = this.validateAttrs.bind(this);
        this.deleteTemplate = this.deleteTemplate.bind(this);
        this.toogleSidebarDelete = this.toogleSidebarDelete.bind(this);
        this.removeSelectAttr = this.removeSelectAttr.bind(this);
        this.removeSelectMeta = this.removeSelectMeta.bind(this);
        this.selectMetadata = this.selectMetadata.bind(this);
        this.updateMetadata = this.updateMetadata.bind(this);
        this.validateMetadata = this.validateMetadata.bind(this);
    }

    componentDidMount() {
        const { template } = this.props;
        this.setState({
            template,
            metadata: {
                label: '',
                type: '',
                value_type: '',
                static_value: '',
            },
            showAttribute: false,
            showMetadata: false,
            showFirmware: false,
        });
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            template: nextProps.template,
            showAttribute: false,
            showMetadata: false,
            showFirmware: false,
        });
    }

    toogleSidebarFirmware() {
        const { showFirmware } = this.state;
        this.setState({
            showFirmware: !showFirmware,
        });
    }

    toogleSidebarAttribute(attrType, attr = Sidebar.createAttribute()) {
        const { showAttribute } = this.state;
        this.setState({
            showAttribute: !showAttribute,
            showMetadata: false,
            selectAttr: {
                ...attr,
                attrType,
            },
            newAttr: attr.label.length === 0,
        });
    }

    toogleSidebarMetadata(metadata) {
        const { showMetadata } = this.state;
        if (metadata) {
            const immutableMeta = JSON.parse(JSON.stringify(metadata));
            this.setState({
                showMetadata: !showMetadata,
                metadata,
                isNewMetadata: false,
                immutableMeta,
            });
        } else {
            const newMeta = Sidebar.createAttribute();
            this.setState({
                showMetadata: !showMetadata,
                metadata: newMeta,
                isNewMetadata: true,
                immutableMeta: newMeta,
            });
        }
    }

    changeValue(field, event) {
        const { template } = this.state;
        template[field] = event.target.value;
        this.setState({
            template,
        });
    }

    changeAttrValue(event, attr) {
        const values = { ...attr };
        values[event.target.name] = event.target.value;
        this.setState({
            selectAttr: values,
        });
    }

    updateTemplateAttr(attrs) {
        if (!this.validateAttrs(attrs)) return;

        const { template } = this.state;
        const [type, values] = [attrs.attrType, { ...attrs }];

        if (type === 'config_attrs') {
            values.value_type = 'string';
            values.type = 'meta';
        }
        if (values.type === 'dynamic') values.static_value = '';

        template[type] = template[type].map((item) => {
            if (item.id === values.id) {
                delete values.attrType;
                return values;
            }
            return item;
        });

        this.setState({
            showAttribute: false,
            template,
        });
    }

    addTemplateAttr(attrs) {
        if (!this.validateAttrs(attrs)) return;

        const { template } = this.state;
        const [type, values] = [attrs.attrType, { ...attrs }];

        if (type === 'config_attrs') {
            values.value_type = 'string';
            values.type = 'meta';
        }
        if (values.type === 'dynamic') values.static_value = '';

        delete values.attrType;
        template[type].push(values);

        this.setState({
            showAttribute: false,
            template,
        });
    }

    validateAttrs(attrs) {
        const { template } = this.state;
        const [type, values] = [attrs.attrType, { ...attrs }];
        const { t } = this.props;
        const ret = util.isLabelValid(values.label);
        if (!ret.result) {
            if (type === 'config_attrs') {
                toaster.error(t('templates:alerts.must_set_type'));
            } else {
                toaster.error(ret.error);
            }
            return false;
        }

        // verify if attr name already exists
        const existName = template[type].some(
            (item) => item.label === values.label && item.id !== values.id,
        );

        if (existName) {
            toaster.warning(t('templates:alerts.label_already_exist', { label: values.label }));
            return false;
        }

        if (values.type === 'dynamic') values.static_value = '';

        if (type === 'config_attrs') {
            values.value_type = 'string';
            if (values.static_value.trim().length === 0) {
                toaster.error(t('templates:alerts.attr_empty'));
                return false;
            }

            if (template[type].some((item) => item.label === values.label && values.id !== item.id)) {
                toaster.warning(t('templates:alerts.conf_already_exist', { label: values.label }));
                return false;
            }
        }

        if (values.value_type.trim().length === 0) {
            toaster.error(t('templates:alerts.must_set_type'));
            return false;
        }

        const resp = util.isTypeValid(values.static_value, values.value_type, values.type);
        if (!resp.result) {
            toaster.error(resp.error);
            return false;
        }

        return true;
    }

    saveTemplate() {
        const { toogleSidebar, temp_opex, t } = this.props;
        const { template } = this.state;
        const ret = util.isNameValid(template.label);
        if (!ret.result) {
            toaster.error(ret.error);
            return;
        }

        template.attrs = [];
        template.attrs.push(...template.data_attrs);
        template.attrs.push(...template.config_attrs);
        template.attrs = this.removeIds(template.attrs);
        TemplateActions.addTemplate(template, () => {
            toaster.success(t('templates:alerts.create'));
            TemplateActions.removeSingle('new_template');
            toogleSidebar();
            temp_opex._fetch();
        });
    }

    updateTemplate() {
        const { template } = this.state;
        const { toogleSidebar, temp_opex, t } = this.props;

        // Verify template name
        const ret = util.isNameValid(template.label);
        if (!ret.result) {
            toaster.error(ret.error);
            return;
        }

        template.attrs = [];
        template.attrs.push(...template.data_attrs);
        template.attrs.push(...template.config_attrs);
        if (template.img_attrs) { template.attrs.push(...template.img_attrs); }
        template.attrs = this.removeIds(template.attrs);
        TemplateActions.triggerUpdate(template, () => {
            toaster.success(t('templates:alerts.update'));
            toogleSidebar();
            temp_opex._fetch();
        });
    }

    addMetadata() {
        const { metadata, selectAttr, showMetadata } = this.state;
        if (!this.validateMetadata(metadata)) return;

        if (!Object.prototype.hasOwnProperty.call(selectAttr, 'metadata')) selectAttr.metadata = [];

        selectAttr.metadata.push({ ...metadata });
        this.setState({
            showMetadata: !showMetadata,
            selectAttr,
        });
    }

    updateMetadata(originalMetadata) {
        const { selectAttr, showMetadata } = this.state;
        let { metadata } = this.state;
        if (originalMetadata) { metadata = originalMetadata; }
        if (!Object.prototype.hasOwnProperty.call(selectAttr, 'metadata')) selectAttr.metadata = [];
        if (!this.validateMetadata(metadata)) return;

        selectAttr.metadata = selectAttr.metadata.map((item) => {
            if (item.id === metadata.id) return metadata;
            return item;
        }); // updating attr's metas

        this.setState({
            showMetadata: !showMetadata,
            selectAttr,
        });
    }

    validateMetadata(metadata) {
        const { selectAttr } = this.state;
        const { t } = this.props;
        if (!Object.prototype.hasOwnProperty.call(selectAttr, 'metadata')) selectAttr.metadata = [];
        const resp = util.isLabelValid(metadata.label);
        if (!resp.result) {
            toaster.error(resp.error);
            return false;
        }

        const existName = selectAttr.metadata.some(
            (item) => item.label === metadata.label && item.id !== metadata.id,
        );
        if (existName) {
            toaster.warning(t('templates:alerts.conf_already_exist', { label: metadata.label }));
            return false;
        }

        if (metadata.type.trim().length === 0) {
            toaster.error(t('templates:alerts.attr_required'));
            return false;
        }

        if (metadata.type.match(/^[_A-z0-9 ]*([_A-z0-9 ])*$/g) == null) {
            toaster.error(t('templates:alerts.only_alpha_attr_type'));
            return false;
        }

        const ret = util.isTypeValid(metadata.static_value, metadata.value_type, metadata.type);
        if (!ret.result) {
            toaster.error(ret.error);
            return false;
        }

        return true;
    }

    selectMetadata(metadata) {
        this.setState({
            metadata,
        }, () => this.toogleSidebarMetadata(metadata));
    }

    handleChangeMetadata(e) {
        const { metadata } = this.state;
        const { value, name } = e.target;
        metadata[name] = value;
        this.setState({ metadata });
    }

    deleteTemplate() {
        const { template } = this.state;
        const { temp_opex, toogleSidebar, t } = this.props;
        TemplateActions.triggerRemoval(template.id, () => {
            toaster.success(t('templates:alerts.remove'));
            this.toogleSidebarDelete();
            toogleSidebar();
            temp_opex._fetch();
        });
    }

    toogleSidebarDelete(sidebar) {
        this.setState((prevState) => (
            { [sidebar]: !prevState[sidebar] }
        ));
    }

    removeSelectAttr() {
        const { template, selectAttr } = this.state;
        template[selectAttr.attrType] = template[selectAttr.attrType].filter(
            (item) => item.id !== selectAttr.id,
        );
        this.toogleSidebarDelete('showDeleteAttr');
        this.toogleSidebarAttribute();
        this.setState({
            template,
        });
    }

    removeSelectMeta() {
        const { selectAttr, metadata } = this.state;
        selectAttr.metadata = selectAttr.metadata.filter((item) => item.id !== metadata.id);
        this.toogleSidebarDelete('showDeleteMeta');
        this.toogleSidebarMetadata();
        this.setState({
            selectAttr,
        });
    }

    removeIds(arr) {
        return arr.map((item) => {
            const newItem = { ...item };
            delete newItem.id;
            if (Object.prototype.hasOwnProperty.call(newItem, 'metadata')) {
                newItem.metadata = this.removeIds(newItem.metadata);
            }
            return newItem;
        });
    }

    render() {
        const { showSidebar, toogleSidebar, isNewTemplate } = this.props;
        const {
            showAttribute,
            showMetadata,
            showFirmware,
            template,
            metadata,
            immutableMeta,
            selectAttr,
            newAttr,
            showDeleteTemplate,
            showDeleteAttr,
            showDeleteMeta,
            isNewMetadata,
        } = this.state;
        const templateModifier = ability.can('modifier', 'template');

        return (
            <>
                <SidebarTemplate
                    template={template}
                    isNewTemplate={isNewTemplate}
                    showSidebar={showSidebar}
                    toogleSidebar={toogleSidebar}
                    showDeleteTemplate={showDeleteTemplate}
                    toogleSidebarAttribute={this.toogleSidebarAttribute}
                    toogleSidebarFirmware={this.toogleSidebarFirmware}
                    changeValue={this.changeValue}
                    saveTemplate={this.saveTemplate}
                    updateTemplate={this.updateTemplate}
                    toogleSidebarDelete={this.toogleSidebarDelete}
                    deleteTemplate={this.deleteTemplate}
                />
                <AltContainer store={ImageStore}>
                    {showFirmware && templateModifier
                        ? (
                            <SidebarFirmConfig
                                showFirmware={showFirmware}
                                isNewTemplate={isNewTemplate}
                                template={template}
                                toogleSidebarFirmware={this.toogleSidebarFirmware}
                            />
                        ) : null}
                </AltContainer>
                {/* @To check: attr template isn't used */}
                <SidebarAttribute
                    showAttribute={showAttribute}
                    template={template}
                    selectAttr={selectAttr}
                    newAttr={newAttr}
                    showDeleteAttr={showDeleteAttr}
                    toogleSidebarAttribute={this.toogleSidebarAttribute}
                    toogleSidebarMetadata={this.toogleSidebarMetadata}
                    changeAttrValue={this.changeAttrValue}
                    updateTemplateAttr={this.updateTemplateAttr}
                    addTemplateAttr={this.addTemplateAttr}
                    toogleSidebarDelete={this.toogleSidebarDelete}
                    removeSelectAttr={this.removeSelectAttr}
                    selectMetadata={this.selectMetadata}
                />
                <SidebarMetadata
                    showMetadata={showMetadata}
                    metadata={metadata}
                    immutableMeta={immutableMeta}
                    showDeleteMeta={showDeleteMeta}
                    isNewMetadata={isNewMetadata}
                    selectAttr={selectAttr}
                    toogleSidebarMetadata={this.toogleSidebarMetadata}
                    addMetadata={this.addMetadata}
                    updateMetadata={this.updateMetadata}
                    handleChangeMetadata={this.handleChangeMetadata}
                    toogleSidebarDelete={this.toogleSidebarDelete}
                    removeSelectMeta={this.removeSelectMeta}
                />
            </>
        );
    }
}

Sidebar.defaultProps = {
    showSidebar: false,
    isNewTemplate: false,
};

Sidebar.propTypes = {
    template: PropTypes.shape(templateType).isRequired,
    toogleSidebar: PropTypes.func.isRequired,
    temp_opex: PropTypes.shape(tempOpxType).isRequired,
    showSidebar: PropTypes.bool,
    isNewTemplate: PropTypes.bool,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(Sidebar);
