import React from 'react';
import PropTypes from 'prop-types';
import MaterialInput from 'Components/MaterialInput';
import Can from 'Components/permissions/Can';
import ability from 'Components/permissions/ability';
import { withNamespaces } from 'react-i18next';
import SidebarProp from './SidebarProp';
import SidebarButton from '../SidebarButton';
import { templateType } from '../../../TemplatePropTypes';

const SidebarForm = ({
    isNewTemplate, changeValue, toogleSidebarAttribute, toogleSidebarFirmware, template, t,
}) => {
    const renderTemplateProps = () => {
        const templateProps = [];
        if (Object.prototype.hasOwnProperty.call(template, 'data_attrs')) {
            if (template.data_attrs.length > 0) {
                templateProps.push(template.data_attrs.map(item => (
                    <SidebarProp
                        key={`data_attrs-${item.id}`}
                        attr={item}
                        icon="data_attrs"
                        toogleSidebarAttribute={toogleSidebarAttribute}
                    />
                )));
            }
        }

        if (Object.prototype.hasOwnProperty.call(template, 'config_attrs')) {
            if (template.config_attrs.length > 0) {
                templateProps.push(template.config_attrs.map(item => (
                    <SidebarProp
                        key={`config_attrs-${item.id}`}
                        attr={item}
                        icon="config_attrs"
                        toogleSidebarAttribute={toogleSidebarAttribute}
                    />
                )));
            }
        }

        return templateProps.length > 0
            ? templateProps
            : (
                <div className="body-form-nodata">
                    <span>{t('text.select_option_below')}</span>
                </div>
            );
    };

    const cannotEdit = !ability.can('modifier', 'device-manager-template');

    return (
        <div className="body">
            <div className="body-template-name">
                <div className="body-icon">
                    <img
                        className="title-icon template"
                        src="images/icons/template-gray.png"
                        alt=""
                    />
                </div>
                <MaterialInput
                    name={t('templates:template_name.label')}
                    className="template-name"
                    maxLength={40}
                    value={template.label}
                    onChange={e => changeValue('label', e)}
                    disabled={cannotEdit}
                />
            </div>
            <div className="body-form">
                {renderTemplateProps()}
            </div>
            <div className="body-actions">
                <div className="body-actions--divider" />
                <Can do="modifier" on="template">
                    <SidebarButton
                        onClick={() => toogleSidebarAttribute('data_attrs')}
                        icon="data_attrs"
                        text={t('templates:btn.new_attr.label')}
                    />
                    {/*                    <SidebarButton
                        onClick={() => toogleSidebarAttribute('config_attrs')}
                        icon="config_attrs"
                        text={t('templates:btn.new_conf.label')}
                    /> */}
                    {!isNewTemplate
                        ? (
                            <SidebarButton
                                onClick={() => toogleSidebarFirmware()}
                                icon="firmware"
                                text={t('templates:btn.mng_firmware.label')}
                            />
                        ) : null}
                </Can>
            </div>
        </div>
    );
};

SidebarForm.propTypes = {
    isNewTemplate: PropTypes.bool.isRequired,
    changeValue: PropTypes.func.isRequired,
    toogleSidebarAttribute: PropTypes.func.isRequired,
    toogleSidebarFirmware: PropTypes.func.isRequired,
    template: PropTypes.shape(templateType).isRequired,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(SidebarForm);
