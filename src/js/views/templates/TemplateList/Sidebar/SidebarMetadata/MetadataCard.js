import React from 'react';
import PropTypes from 'prop-types';
import MaterialInput from 'Components/MaterialInput';
import MaterialSelect from 'Components/MaterialSelect';
import ability from 'Components/permissions/ability';
import { withNamespaces } from 'react-i18next';
import { metadataType } from '../../../TemplatePropTypes';

const MetadataCard = ({
    metadata,
    handleChangeMetadata,
    t,
}) => (
    <div className="metadata-card">
        <div className="body-metadata-name">
            <div className="body-icon">
                <img
                    className="title-icon attribute"
                    src="images/icons/metadata-gray.png"
                    alt=""
                />
            </div>
            <MaterialInput
                name="label"
                className="attribute-type"
                maxLength={40}
                value={metadata.label}
                onChange={e => handleChangeMetadata(e)}
                disabled={!ability.can('modifier', 'device-manager-template')}
            >
                {t('options.attr_name.label')}
            </MaterialInput>
        </div>
        <div className="body-form">
            <MaterialInput
                name="type"
                maxLength={40}
                className="attribute-type"
                value={metadata.type}
                onChange={e => handleChangeMetadata(e)}
                disabled={!ability.can('modifier', 'device-manager-template')}
            >
                {t('templates:attr_type.label')}
            </MaterialInput>
            <MaterialSelect
                id="value_types"
                label={t('templates:value_type.label')}
                name="value_type"
                className="value-type"
                value={metadata.value_type}
                onChange={e => handleChangeMetadata(e)}
                isDisable={!ability.can('modifier', 'device-manager-template')}
            >
                <option value="" disabled>
                    {t('text.select_type')}
                </option>
                <option value="bool" id="adm-option">
                    {t('types.boolean')}
                </option>
                <option value="geo" id="adm-option">
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
            </MaterialSelect>
            <MaterialInput
                name="static_value"
                className="attribute-value"
                maxLength={128}
                value={metadata.static_value}
                onChange={e => handleChangeMetadata(e)}
                disabled={!ability.can('modifier', 'device-manager-template')}
            >
                {t('value.label')}
            </MaterialInput>
        </div>
    </div>
);

MetadataCard.propTypes = {
    metadata: PropTypes.shape(metadataType).isRequired,
    handleChangeMetadata: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(MetadataCard);
