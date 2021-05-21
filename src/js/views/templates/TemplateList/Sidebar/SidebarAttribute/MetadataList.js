import React from 'react';
import PropTypes from 'prop-types';
import Can from 'Components/permissions/Can';
import { withNamespaces } from 'react-i18next';
import { attrsType } from '../../../TemplatePropTypes';

const MetadataList = ({ values, selectMetadata, t }) => {
    if (Object.prototype.hasOwnProperty.call(values, 'metadata')) {
        return (
            <div className="metadata-list-wrapper">
                <div className="metadata-list-title">
                    Metadata
                </div>
                {
                    values.metadata.map(metadata => (
                        <div
                            className="metadata-list-item"
                            key={metadata.id}
                            onClick={() => selectMetadata(metadata)}
                            onKeyPress={() => selectMetadata(metadata)}
                            tabIndex="0"
                            role="button"
                        >
                            <div className="metadata-icon">
                                <img
                                    className="title-icon attribute"
                                    src="images/icons/data_attrs-gray.png"
                                    alt=""
                                />
                            </div>
                            <div className="metadata-label">
                                {metadata.label}
                            </div>
                        </div>
                    ))
                }
            </div>
        );
    }
    return (
        <Can do="modifier" on="device-manager-template">
            <div className="body-form-nodata">
                {t('templates:alerts.select_to_add')}
            </div>
        </Can>
    );
};

MetadataList.propTypes = {
    values: PropTypes.shape(attrsType).isRequired,
    selectMetadata: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(MetadataList);
