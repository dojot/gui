import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
// import { attrsType } from '../../../TemplatePropTypes';
import MaterialInput from 'Components/MaterialInput';
import { DojotBtnClassicWithIcon } from 'Components/DojotButton';
import util from 'Comms/util';
import Dropzone from 'react-dropzone';

const ImageList = ({
    list, changeAttrValue, removeBinary, removeImage, onDrop,
}) => (
    <Fragment>
        {Object.entries(list).map(([key, element]) => (
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
                        onChange={e => changeAttrValue(e, element)}
                    >
                                Image Version
                    </MaterialInput>
                </div>
                <div className="body-attribute-name pl50px height-auto pb10px">
                    <div className="input-field attribute-type  attr-content">
                        <span className="label">Image Hash</span>
                        {(element.image_hash == null)
                            ? (
                                <Fragment>
                                    {(element.file != undefined)
                                        ? (
                                            <span className="value">
                                                {element.file[0].name}
                                            </span>
                                        ) : (
                                            <div>
                                                {' '}
                                                <span className="value"> No binary yet.</span>
                                                <div className="dropzone">
                                                    <Dropzone multiple={false} onDrop={file => onDrop(file, element)}>
                                                        <p>Drop the file here or click to select image to upload.</p>
                                                    </Dropzone>
                                                </div>
                                            </div>
                                        )
                                    }
                                </Fragment>
                            )
                            : (
                                <Fragment>
                                    <span className="value">
                                        {' '}
                                        {element.image_hash}
                                    </span>
                                    <i className="fa fa-trash img-hash-icon" onClick={e => removeBinary(e, element)} />
                                </Fragment>
                            )
                        }
                    </div>
                </div>
                {(element.created != null)
                    ? (
                        <div className="body-attribute-name pl50px">
                            <div className="input-field attribute-type  attr-content">
                                <span className="label">Created At</span>
                                <span className="value">
                                    {util.iso_to_date(element.created)}
                                </span>
                            </div>
                        </div>
                    ) : null}
                <div className="body-attribute-name height-50 pl50px">
                    <DojotBtnClassicWithIcon label="Remove" title="Remove Image" onClick={e => removeImage(e, element)} icon="fa-times" />
                </div>
                <div className="line-2" />
            </div>
        ))
        }
    </Fragment>
);

ImageList.defaultProps = {
    list: {},
};

ImageList.propTypes = {
    list: PropTypes.object,
    changeAttrValue: PropTypes.func.isRequired,
    removeBinary: PropTypes.func.isRequired,
    removeImage: PropTypes.func.isRequired,
    onDrop: PropTypes.func.isRequired,
};

export default ImageList;
