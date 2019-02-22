import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import ImageActions from 'Actions/ImageActions';
import util from 'Comms/util';
import toaster from 'Comms/util/materialize';
import ImageList from './ImageList';

class SidebarFirmImages extends Component {
    constructor(props) {
        super(props);
        this.state = {
            newImage: false,
        };
        this.createNewImage = this.createNewImage.bind(this);
        this.changeAttrValue = this.changeAttrValue.bind(this);
        this.removeBinary = this.removeBinary.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.saveImages = this.saveImages.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    componentDidMount() {
        const { isNewTemplate, templateId } = this.props;
        if (!isNewTemplate) {
            ImageActions.fetchImages.defer(templateId);
        }
    }

    onDrop(files, image) {
        ImageActions.updateImageData(image.id, 'file', files);
    }

    createNewImage() {
        const { newImage } = this.state;
        if (!newImage) {
            ImageActions.insertEmptyImage({
                id: util.guid(), image_version: '', created: null, new: true, saved: false, image_hash: null,
            });
            this.setState({ newImage: true });
        }
    }

    saveImages(e) {
        e.preventDefault();
        const { templateId, images } = this.props;
        Object.values(images).forEach((image) => {
            if (!image.saved) {
                // for each non saved image,
                // 1. update or create image
                // 2. upload binary
                // 3. set as saved image
                if (image.new) {
                    const jsonImg = {
                        label: String(templateId),
                        fw_version: image.image_version,
                        sha1: null,
                    };
                    ImageActions.triggerInsert(jsonImg, (img) => {
                        toaster.success('Image created.');
                        // todo: get image_id correctly
                        // const idToBeUsed = img.id;
                        const { url } = img;
                        const idToBeUsed = url.split('/')[2];
                        if (image.file) {
                            const imgBinary = {
                                id: idToBeUsed,
                                binary: image.file[0],
                            };
                            ImageActions.triggerUpdate(imgBinary, () => {
                                toaster.success('Image added.');
                            });
                        }
                    });
                } else
                // Todo: currently we don't update meta information for images;
                if (image.file) {
                    const imgBinary = {
                        id: image.id,
                        binary: image.file[0],
                    };
                    ImageActions.triggerUpdate(imgBinary, () => {
                        toaster.success('Image added.');
                    });
                }
            }
        });
        // return the component to up-to-date state
        this.setState({ newImage: false });
        ImageActions.fetchImages.defer(templateId);
    }

    removeBinary(e, image) {
        e.preventDefault();
        ImageActions.triggerRemovalBinary(image.id, () => {
            toaster.success('Image updated.');
        });
    }

    removeImage(e, image) {
        e.preventDefault();

        if (image.new) {
            ImageActions.removeSingle(image.id);
            this.setState({ newImage: false });
        } else {
            ImageActions.triggerRemoval(image, () => {
                toaster.success('Image removed.');
            });
        }
    }

    changeAttrValue(event, attr) {
        event.preventDefault();
        const { name, value } = event.target;
        ImageActions.updateImageData(attr.id, name, value);
    }

    render() {
        const { newImage } = this.state;
        const { images, showFirmware, toogleSidebarFirmware } = this.props;

        return (
            <Fragment>
                <Slide right when={showFirmware} duration={300}>
                    { showFirmware
                        ? (
                            <div className="-sidebar sidebar-attribute sidebar-firmware">
                                <div className="header">
                                    <div className="title">MANAGE IMAGES</div>
                                    <div className="icon">
                                        <img src="images/firmware-red.png" alt="device-icon" />
                                    </div>
                                    <div className="header-path">
                                        {'template > firmware > images'}
                                    </div>
                                </div>

                                <div className="body">
                                    <ImageList
                                        list={images}
                                        changeAttrValue={this.changeAttrValue}
                                        removeImage={this.removeImage}
                                        removeBinary={this.removeBinary}
                                        onDrop={this.onDrop}
                                    />
                                    {(!newImage)
                                        ? (
                                            <div className="body-form-nodata clickable" onKeyPress={this.createNewImage} tabIndex="0" role="button" onClick={this.createNewImage}>
                                        Click here to add a new image
                                            </div>
                                        )
                                        : null }
                                </div>
                                <div className="footer">
                                    <Fragment>
                                        <DojotBtnClassic label="back" type="secondary" onClick={toogleSidebarFirmware} />
                                        <DojotBtnClassic color="red" label="save" type="primary" onClick={e => this.saveImages(e)} />
                                    </Fragment>
                                </div>
                            </div>
                        )
                        : <div />
                    }
                </Slide>
            </Fragment>
        );
    }
}


SidebarFirmImages.defaultProps = {
    showFirmware: false,
    isNewTemplate: false,
};

SidebarFirmImages.propTypes = {
    showFirmware: PropTypes.bool,
    isNewTemplate: PropTypes.bool,
    templateId: PropTypes.string.isRequired,
    toogleSidebarFirmware: PropTypes.func.isRequired,

};

export default SidebarFirmImages;
