import React from 'react';
import PropTypes from 'prop-types';
import MaterialInput from 'Components/MaterialInput';
import MaterialSelect from 'Components/MaterialSelect';
import ability from 'Components/permissions/ability';
import { withNamespaces } from 'react-i18next';
import { attrsType } from '../../../TemplatePropTypes';

const SidebarAttributeForm = ({
    selectAttr,
    changeAttrValue,
    t,
}) => (
    <div>
        <div className="body-attribute-name">
            <div className="body-icon">
                <img
                    className="title-icon attribute"
                    src="images/icons/data_attrs-gray.png"
                    alt=""
                />
            </div>
            <MaterialInput
                name="label"
                className="attribute-type"
                maxLength={40}
                value={selectAttr.label}
                onChange={(e) => changeAttrValue(e, selectAttr)}
                disabled={!ability.can('modifier', 'template')}
            >
                {t('options.attr_name.label')}
            </MaterialInput>
        </div>
        <div className="body-form">
            <MaterialSelect
                label={t('templates:attr_type.label')}
                name="type"
                className="attribute-type"
                value={selectAttr.type}
                onChange={(e) => changeAttrValue(e, selectAttr)}
                isDisable={!ability.can('modifier', 'template')}
            >
                <option value="" disabled>
                    {t('text.select_type')}
                </option>
                <option value="dynamic" id="adm-option">
                    {t('options.attr_name.values.dynamic')}
                </option>
                <option value="static" id="adm-option">
                    {t('options.attr_name.values.static')}
                </option>
                <option value="actuator" id="adm-option">
                    {t('options.attr_name.values.actuator')}
                </option>
            </MaterialSelect>
            <MaterialSelect
                id="value_types"
                label={t('templates:value_type.label')}
                name="value_type"
                className="value-type"
                value={selectAttr.value_type}
                onChange={(e) => changeAttrValue(e, selectAttr)}
                isDisable={!ability.can('modifier', 'template')}
            >
                <option value="" disabled>
                    {t('text.select_type')}
                </option>
                <option value="bool" id="adm-option">
                    {t('types.boolean')}
                </option>
                <option value="geo:point" id="adm-option">
                    {t('types.geo')}
                </option>
                <option value="float" id="adm-option">
                    {t('types.float')}
                </option>
                <option value="integer" id="adm-option">
                    {t('types.integer')}
                </option>
                <option value="string" id="adm-option">
                    {t('types.string')}
                </option>
                {selectAttr.type === 'dynamic' || selectAttr.type === 'actuator'
                    ? (
                        <option value="object" id="adm-option">
                            {t('types.object')}
                        </option>
                    ) : null}
            </MaterialSelect>

            {
                selectAttr.type !== 'dynamic' && selectAttr.type !== 'actuator'
                    ? (
                        <MaterialInput
                            name="static_value"
                            className="attribute-value"
                            maxLength={128}
                            value={selectAttr.static_value}
                            onChange={(e) => changeAttrValue(e, selectAttr)}
                            disabled={!ability.can('modifier', 'template')}
                        >
                            {t('value.label')}
                        </MaterialInput>
                    )
                    : null
            }
        </div>
    </div>
);

SidebarAttributeForm.propTypes = {
    selectAttr: PropTypes.shape(attrsType).isRequired,
    changeAttrValue: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(SidebarAttributeForm);
