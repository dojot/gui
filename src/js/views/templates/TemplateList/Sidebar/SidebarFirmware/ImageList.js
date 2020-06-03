import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import MaterialInput from 'Components/MaterialInput';
import { DojotBtnClassicWithIcon } from 'Components/DojotButton';
import util from 'Comms/util';
import Dropzone from 'react-dropzone';
import { withNamespaces } from 'react-i18next';

const ImageList = ({
    list, changeAttrValue, toggleDeleteBinarySidebar, toggleDeleteSidebar, onDrop, t,
}) => (
    <Fragment>
        {Object.entries(list)
            .map(([key, element]) => (
                <div key={key} className="image-block">
                    <div className="body-attribute-name">
                        <div className="body-icon">
                            <img
                                className="title-icon attribute"
                                src="images/icons/firmware-big-gray.png"
                                alt=""
                            />
                        </div>
                        <MaterialInput
                            name="image_version"
                            className="attribute-type"
                            maxLength={40}
                            value={element.image_version}
                            onChange={(e) => changeAttrValue(e, element)}
                            disabled={!element.new}
                        >
                            {t('firmware:image_list.version')}
                        </MaterialInput>
                    </div>
                    <div className="body-attribute-name pl50px height-auto pb10px">
                        <div className="input-field attribute-type  attr-content">
                            <span className="label">{t('firmware:image_list.hash')}</span>
                            {(element.image_hash == null)
                                ? (
                                    <Fragment>
                                        {(element.file !== undefined)
                                            ? (
                                                <span className="value">
                                                    {element.file[0].name}
                                                </span>
                                            ) : (
                                                <div>
                                                    <span className="value">
                                                        {t('firmware:image_list.no_binary_yet')}
                                                    </span>
                                                    <div className="dropzone">
                                                        <Dropzone
                                                            multiple={false}
                                                            onDrop={(file) => onDrop(file, element)}
                                                        >
                                                            <p>{t('firmware:image_list.dropzone_desc')}</p>
                                                        </Dropzone>
                                                    </div>
                                                </div>
                                            )}
                                    </Fragment>
                                )
                                : (
                                    <Fragment>
                                        <span className="value">
                                            {element.image_hash}
                                        </span>
                                        <i
                                            className="fa fa-trash img-hash-icon"
                                            onClick={(e) => toggleDeleteBinarySidebar(e, element)}
                                            onKeyPress={(e) => toggleDeleteBinarySidebar(e, element)}
                                            role="button"
                                            tabIndex={0}
                                            title={t('firmware:labels.rem_bin')}
                                        />
                                    </Fragment>
                                )}
                        </div>
                    </div>
                    {(element.created != null)
                        ? (
                            <div className="body-attribute-name pl50px">
                                <div className="input-field attribute-type  attr-content">
                                    <span className="label">
                                        {t('firmware:image_list.created_at')}
                                    </span>
                                    <span className="value">
                                        {util.iso_to_date(element.created)}
                                    </span>
                                </div>
                            </div>
                        ) : null}
                    <div className="body-attribute-name height-50 pl50px">
                        <DojotBtnClassicWithIcon
                            label={t('firmware:labels.rem')}
                            title={t('firmware:labels.remove')}
                            onClick={(e) => toggleDeleteSidebar(e, element)}
                            icon="fa-times"
                        />
                    </div>
                    <div className="line-2" />
                </div>
            ))}
    </Fragment>
);

ImageList.defaultProps = {
    list: {},
};

ImageList.propTypes = {
    t: PropTypes.func.isRequired,
    list: PropTypes.object,
    changeAttrValue: PropTypes.func.isRequired,
    toggleDeleteBinarySidebar: PropTypes.func.isRequired,
    toggleDeleteSidebar: PropTypes.func.isRequired,
    onDrop: PropTypes.func.isRequired,
};

export default withNamespaces()(ImageList);
