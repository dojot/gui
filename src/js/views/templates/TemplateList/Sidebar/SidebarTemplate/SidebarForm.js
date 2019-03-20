import React from 'react';
import PropTypes from 'prop-types';
import MaterialInput from 'Components/MaterialInput';
import SidebarProp from './SidebarProp';
import SidebarButton from '../SidebarButton';
import { templateType } from '../../../TemplatePropTypes';

const SidebarForm = ({ changeValue, toogleSidebarAttribute, template }) => {
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
                <span>Select an option below</span>
            );
    };

    let data = '';
    if (template.data_attrs && template.config_attrs) {
        data = template.data_attrs.length !== 0
            || template.config_attrs.length !== 0 ? '' : '-nodata';
    }
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
                    name="Template Name"
                    className="template-name"
                    maxLength={40}
                    value={template.label}
                    onChange={e => changeValue('label', e)}
                />
            </div>
            <div className={`body-form${data}`}>
                { renderTemplateProps() }
            </div>
            <div className="body-actions">
                <div className="body-actions--divider" />
                <SidebarButton
                    onClick={() => toogleSidebarAttribute('data_attrs')}
                    icon="data_attrs"
                    text="New Attribute"
                />

                <SidebarButton
                    onClick={() => toogleSidebarAttribute('config_attrs')}
                    icon="config_attrs"
                    text="New Configuration"
                />

            </div>
        </div>
    );
};

SidebarForm.propTypes = {
    changeValue: PropTypes.func.isRequired,
    toogleSidebarAttribute: PropTypes.func.isRequired,
    template: PropTypes.shape(templateType).isRequired,
};

export default SidebarForm;
