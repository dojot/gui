import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import ImageActions from 'Actions/ImageActions';
import TemplateActions from 'Actions/TemplateActions';
import MaterialInput from 'Components/MaterialInput';
import toaster from 'Comms/util/materialize';
import { withNamespaces } from 'react-i18next';
import ability from 'Components/permissions/ability';
import { templateType } from '../../../TemplatePropTypes';
import SidebarFirmImages from './SidebarFirmImages';
import SidebarButton from '../SidebarButton';

function createAttribute(label, type, valueType, staticValue) {
    return {
        label,
        type,
        value_type: valueType,
        static_value: staticValue,
    };
}

function createImageAttribute(data, type, valueType) {
    const aux = createAttribute(data.user_value, type, valueType, '');
    aux.metadata = [createAttribute(data.dojot_value, 'meta', 'boolean', true)];
    return aux;
}

class SidebarFirmConfig extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showFirmwareImage: false,
            attrs: {
                current_state: { label: 'Current State', dojot_value: 'dojot:firmware_update:state', user_value: 'image_state' },
                update_result: { label: 'Update Result', dojot_value: 'dojot:firmware_update:update_result', user_value: 'update_result' },
                current_version: { label: 'Current Version', dojot_value: 'dojot:firmware_update:version', user_value: 'current_version' },
                upload_image: { label: 'Transfer Image', dojot_value: 'dojot:firmware_update:desired_version', user_value: 'transferred_version' },
                apply_image: { label: 'Apply Image', dojot_value: 'dojot:firmware_update:update', user_value: 'apply_image' },
            },
        };

        this.dictFirmwareUpdate = {
            'dojot:firmware_update:state': 'current_state',
            'dojot:firmware_update:update_result': 'update_result',
            'dojot:firmware_update:version': 'current_version',
            'dojot:firmware_update:desired_version': 'upload_image',
            'dojot:firmware_update:update': 'apply_image',
        };


        this.changeAttrValue = this.changeAttrValue.bind(this);
        this.changeFirmwareState = this.changeFirmwareState.bind(this);
        this.saveImageConfig = this.saveImageConfig.bind(this);
        this.toogleSidebarFirmImage = this.toogleSidebarFirmImage.bind(this);
        this.updateFieldsWithTemplateData = this.updateFieldsWithTemplateData.bind(this);
    }

    componentDidMount() {
        const { isNewTemplate, template } = this.props;
        if (!isNewTemplate) {
            if (template.img_attrs.length === 0) {
                ImageActions.updateImageAllowed(false);
            } else {
                ImageActions.updateImageAllowed(true);
                this.updateFieldsWithTemplateData(template.img_attrs);
            }
            ImageActions.fetchImages.defer(template.id);
        }
    }

    updateFieldsWithTemplateData(defaultAttrs) {
        const { attrs } = this.state;
        defaultAttrs.forEach((element) => {
            attrs[this.dictFirmwareUpdate[element.metadata[0].label]].user_value = element.label;
        });
        this.setState({ attrs });
    }

    toogleSidebarFirmImage() {
        const { showFirmwareImage } = this.state;
        this.setState({
            showFirmwareImage: !showFirmwareImage,
        });
    }

    changeFirmwareState(e) {
        e.preventDefault();
        const { imageAllowed } = this.props;
        ImageActions.updateImageAllowed(!imageAllowed);
    }

    saveImageConfig(e) {
        e.preventDefault();
        const { t, template, imageAllowed } = this.props;
        const { attrs } = this.state;
        if (imageAllowed) {
            // adding image attributes
            template.attrs.push(createImageAttribute(attrs.current_state, 'dynamic', 'integer'));
            template.attrs.push(createImageAttribute(attrs.update_result, 'dynamic', 'integer'));
            template.attrs.push(createImageAttribute(attrs.current_version, 'dynamic', 'string'));
            template.attrs.push(createImageAttribute(attrs.upload_image, 'actuator', 'string'));
            template.attrs.push(createImageAttribute(attrs.apply_image, 'actuator', 'string'));
        } else {
            // removing image attributes
            template.img_attrs = [];
            // 2. also removes img attrs in attr list
            for (let i = template.attrs.length - 1; i >= 0; i--) {
                if (template.attrs[i].metadata.length) {
                    const lbl = template.attrs[i].metadata[0].label;
                    if (lbl.includes('dojot:firmware_update:')) {
                        delete template.attrs[i];
                    }
                }
            }
        }

        TemplateActions.triggerUpdate(template, () => {
            toaster.success(t('firmware:alerts.template_updated'));
            TemplateActions.fetchSingle(template.id);
        });
    }

    changeAttrValue(event) {
        event.preventDefault();
        const { name, value } = event.target;
        const { attrs } = this.state;
        attrs[name].user_value = value;
        this.setState({
            attrs,
        });
    }

    render() {
        const {
            t, imageAllowed, images, showFirmware, template, isNewTemplate, toogleSidebarFirmware,
        } = this.props;
        const clssBtn = imageAllowed ? 'fw_btn_pushed' : 'fw_btn_push';
        const { attrs, showFirmwareImage } = this.state;
        const fwImageModifier = ability.can('modifier', 'image');

        return (
            <Fragment>
                <Slide right when={showFirmware} duration={300}>
                    {showFirmware
                        ? (
                            <div className="sidebar-firmware">
                                <div className="header">
                                    <div className="title">{t('firmware:title')}</div>
                                    <div className="icon">
                                        <img src="images/firmware-red.png" alt="device-icon" />
                                    </div>
                                    <div className="header-path">
                                        {'template > firmware management'}
                                    </div>
                                </div>

                                <div className="body box-firmware-enabled">
                                    <div className="sub-content">
                                        <div
                                            tabIndex="0"
                                            role="button"
                                            onKeyPress={this.changeFirmwareState}
                                            onClick={this.changeFirmwareState}
                                            className={`firmware-enabled clickable z-depth-2 card-hover ${clssBtn}`}
                                        >
                                            <div className="icon">
                                                <img src="images/firmware-red.png" alt="device-icon" />
                                            </div>
                                            <div className="description">
                                                <div className="tl">
                                                    {imageAllowed
                                                        ? <b>{t('firmware:states.enabled')}</b>
                                                        : <b>{t('firmware:states.disabled')}</b>
                                                    }

                                                </div>
                                                {t('firmware:states.short_desc')}
                                            </div>
                                        </div>
                                        {imageAllowed
                                            ? (
                                                <div className="image-related-attrs">
                                                    <span>
                                                        {t('firmware:states.long_desc')}
                                                    </span>
                                                    <div className="body-attribute-name">
                                                        <MaterialInput
                                                            name="current_state"
                                                            className="attribute-type"
                                                            maxLength={40}
                                                            value={attrs.current_state.user_value}
                                                            onChange={e => this.changeAttrValue(e)}
                                                        >
                                                            {t('firmware:default_attrs_template.state')}
                                                        </MaterialInput>
                                                    </div>
                                                    <div className="body-attribute-name">
                                                        <MaterialInput
                                                            name="update_result"
                                                            className="attribute-type"
                                                            maxLength={40}
                                                            value={attrs.update_result.user_value}
                                                            onChange={e => this.changeAttrValue(e)}
                                                        >
                                                            {t('firmware:default_attrs_template.update_result')}
                                                        </MaterialInput>
                                                    </div>
                                                    <div className="body-attribute-name">
                                                        <MaterialInput
                                                            name="upload_image"
                                                            className="attribute-type"
                                                            maxLength={40}
                                                            value={attrs.upload_image.user_value}
                                                            onChange={e => this.changeAttrValue(e)}
                                                        >
                                                            {t('firmware:default_attrs_template.upload_image')}
                                                        </MaterialInput>
                                                    </div>
                                                    <div className="body-attribute-name">
                                                        <MaterialInput
                                                            name="apply_image"
                                                            className="attribute-type"
                                                            maxLength={40}
                                                            value={attrs.apply_image.user_value}
                                                            onChange={e => this.changeAttrValue(e)}
                                                        >
                                                            {t('firmware:default_attrs_template.apply_image')}
                                                        </MaterialInput>
                                                    </div>
                                                    <div className="body-attribute-name">
                                                        <MaterialInput
                                                            name="current_version"
                                                            className="attribute-type"
                                                            maxLength={40}
                                                            value={attrs.current_version.user_value}
                                                            onChange={e => this.changeAttrValue(e)}
                                                        >
                                                            {t('firmware:default_attrs_template.current_version')}
                                                        </MaterialInput>
                                                    </div>
                                                </div>
                                            )
                                            : null}
                                    </div>
                                    <div className="body-actions">
                                        <div className="body-actions--divider" />
                                        <SidebarButton
                                            onClick={() => this.toogleSidebarFirmImage()}
                                            icon="firmware"
                                            text={t('firmware:btn')}
                                        />
                                    </div>
                                </div>
                                <div className="footer">
                                    <Fragment>
                                        <DojotBtnClassic label={t('discard.label')} type="secondary" onClick={toogleSidebarFirmware} />
                                        <DojotBtnClassic color="red" label={t('save.label')} type="primary" onClick={e => this.saveImageConfig(e)} />
                                    </Fragment>
                                </div>
                            </div>
                        )
                        : <div />
                    }
                </Slide>
                { fwImageModifier
                    ? (
                        <SidebarFirmImages
                            showFirmware={showFirmwareImage}
                            isNewTemplate={isNewTemplate}
                            templateId={template.id}
                            images={images}
                            toogleSidebarFirmware={this.toogleSidebarFirmImage}
                        />
                    ) : null}
            </Fragment>
        );
    }
}


SidebarFirmConfig.defaultProps = {
    showFirmware: false,
    isNewTemplate: false,
    imageAllowed: false,
};

SidebarFirmConfig.propTypes = {
    t: PropTypes.func.isRequired,
    showFirmware: PropTypes.bool,
    isNewTemplate: PropTypes.bool,
    imageAllowed: PropTypes.bool,
    template: PropTypes.shape(templateType).isRequired,
    toogleSidebarFirmware: PropTypes.func.isRequired,
};

export default withNamespaces()(SidebarFirmConfig);
