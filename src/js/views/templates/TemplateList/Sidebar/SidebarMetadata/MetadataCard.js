import React from 'react';
import PropTypes from 'prop-types';
import MaterialInput from 'Components/MaterialInput';
import MaterialSelect from 'Components/MaterialSelect';
import { metadataType } from '../../../TemplatePropTypes';

const MetadataCard = ({
    metadata,
    handleChangeMetadata,
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
            >
                Attribute Name
            </MaterialInput>
        </div>
        <div className="body-form">
            <MaterialInput
                name="type"
                maxLength={40}
                className="attribute-type"
                value={metadata.type}
                onChange={e => handleChangeMetadata(e)}
            >
                Attribute Type
            </MaterialInput>
            <MaterialSelect
                id="value_types"
                label="Value Type"
                name="value_type"
                className="value-type"
                value={metadata.value_type}
                onChange={e => handleChangeMetadata(e)}
            >
                <option value="" disabled>
                    Select type
                </option>
                <option value="bool" id="adm-option">
                    Boolean
                </option>
                <option value="geo" id="adm-option">
                    Geo
                </option>
                <option value="float" id="adm-option">
                    Float
                </option>
                <option value="integer" id="adm-option">
                    Integer
                </option>
                <option value="string" id="adm-option">
                    String
                </option>
            </MaterialSelect>
            <MaterialInput
                name="static_value"
                className="attribute-value"
                maxLength={40}
                value={metadata.static_value}
                onChange={e => handleChangeMetadata(e)}
            >
                Value
            </MaterialInput>
        </div>
    </div>
);

MetadataCard.propTypes = {
    metadata: PropTypes.shape(metadataType).isRequired,
    handleChangeMetadata: PropTypes.func.isRequired,
};

export default MetadataCard;
