import React, { Component, Fragment } from 'react';
import Slide from 'react-reveal/Slide';
import PropTypes from 'prop-types';
import { DojotBtnClassic } from 'Components/DojotButton';
import ImageActions from 'Actions/ImageActions';
import util from 'Comms/util';
import toaster from 'Comms/util/materialize';
import { withNamespaces } from 'react-i18next';
import ImageList from './ImageList';
import SidebarDeleteImage from './SidebarDeleteImage';

class SidebarFirmImages extends Component {
    constructor(props) {
        super(props);
        this.state = {
            newImage: false,
            showDeleteAttr: false,
            showDeleteBinaryAttr: false,
            imgToBeRemoved: null,
            binaryToBeRemoved: null,
        };
        this.createNewImage = this.createNewImage.bind(this);
        this.changeAttrValue = this.changeAttrValue.bind(this);
        this.removeBinary = this.removeBinary.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.saveImages = this.saveImages.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.toggleDeleteSidebar = this.toggleDeleteSidebar.bind(this);
        this.toggleDeleteBinarySidebar = this.toggleDeleteBinarySidebar.bind(this);
    }

    componentDidMount() {
        const { isNewTemplate, templateId } = this.props;
        if (!isNewTemplate) {
            ImageActions.fetchImages.defer(templateId);
        }
    }

    onDrop(files, image) {
        var fileName = files[0].name.substring(files[0].name.length-4,files[0].name.length);
        if(fileName.toUpperCase() !== ".HEX" ){           
           const { t } = this.props;
           toaster.warning(t('firmware:alerts.file_error'));
        }else{           
            ImageActions.updateImageData(image.id, 'file', files);
        }
       
        
    }

    toggleDeleteSidebar(e, image) {
        e.preventDefault();
        const { showDeleteAttr } = this.state;
        this.setState({
            showDeleteAttr: !showDeleteAttr,
            imgToBeRemoved: image,
        });
    }

    toggleDeleteBinarySidebar(e, image) {
        e.preventDefault();
        const { showDeleteBinaryAttr } = this.state;
        this.setState({
            showDeleteBinaryAttr: !showDeleteBinaryAttr,
            binaryToBeRemoved: image ? image.id : null,
        });
    }

    createNewImage() {
        const { newImage } = this.state;
        if (!newImage) {
            ImageActions.insertEmptyImage({
                id: util.guid(),
                image_version: '',
                created: null,
                new: true,
                saved: false,
                image_hash: null,
            });
            this.setState({ newImage: true });
        }
    }

    saveImages(e) {
        e.preventDefault();
        const { t, templateId, images } = this.props;
        let hasChange = false;
   
        Object.values(images)
            .forEach((image) => {
                if (!image.saved) {
                    hasChange = true;
                    // for each non saved image,
                    // 1. update or create image
                    // 2. upload binary
                    // 3. set as saved image

                    console.log("   Aqui   " + image.file);
          

                    if (image.image_version === '') {
                     
                        toaster.warning(t('firmware:alerts.version_required'));
                        return false;
                    }

                    if (image.new) {
                        const jsonImg = {
                            label: String(templateId),
                            fw_version: image.image_version,
                            id: image.id,
                        };
                        ImageActions.triggerInsert(jsonImg, (img) => {
                            toaster.success(t('firmware:alerts.version_created', { version: jsonImg.fw_version }));
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
                                    toaster.success(t('firmware:alerts.file_added', { version: jsonImg.fw_version }));
                                    ImageActions.updateImageData(idToBeUsed, 'file', image.file);
                                    ImageActions.updateImageData(idToBeUsed, 'saved', true);
                                });
                            }
                            // show again the image box
                            this.setState({ newImage: false });
                        });
                    } else
                    // Todo: currently we don't update meta information for images;
                    if (image.file) {
                        const imgBinary = {
                            id: image.id,
                            binary: image.file[0],
                        };
                        ImageActions.triggerUpdate(imgBinary, () => {
                            toaster.success(t('firmware:alerts.file_added', { version: image.image_version }));
                            ImageActions.updateImageData(image.id, 'saved', true);
                        });
                    }
                }
                return true; // it seems wrong, but code factor likes it, so...
            });

        if (!hasChange) {
            toaster.warning(t('firmware:alerts.not_to_be_save'));
        }
    }

    removeBinary() {
        const { binaryToBeRemoved: imageId } = this.state;
        const { t } = this.props;
        ImageActions.triggerRemovalBinary(imageId, () => {
            toaster.success(t('firmware:alerts.image_removed'));
        });
        this.setState({ showDeleteBinaryAttr: false });
    }

    removeImage() {
        const { t } = this.props;
        const { imgToBeRemoved: image } = this.state;
        const showDeleteAttr = false;
        if (image.new) {
            ImageActions.removeSingle(image.id);
            this.setState({
                showDeleteAttr,
                newImage: false,
            });
        } else {
            ImageActions.triggerRemoval(image, () => {
                toaster.success(t('firmware:alerts.version_removed'));
            });
            this.setState({ showDeleteAttr });
        }
    }

    changeAttrValue(event, attr) {
        event.preventDefault();
        const { name, value } = event.target;
        ImageActions.updateImageData(attr.id, name, value);
    }

    render() {
        const { newImage, showDeleteAttr, showDeleteBinaryAttr } = this.state;
        const {
            t, images, showFirmware, toogleSidebarFirmware,
        } = this.props;

        return (
            <Fragment>
                <Slide right when={showFirmware} duration={300}>
                    {showFirmware
                        ? (
                            <div className="sidebar-firmware">
                                <div className="header">
                                    <div className="title">{t('firmware:header')}</div>
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
                                        toggleDeleteSidebar={this.toggleDeleteSidebar}
                                        toggleDeleteBinarySidebar={this.toggleDeleteBinarySidebar}
                                        onDrop={this.onDrop}
                                    />
                                    {(!newImage)
                                        ? (
                                            <div
                                                className="body-form-nodata clickable"
                                                onKeyPress={this.createNewImage}
                                                tabIndex="0"
                                                role="button"
                                                onClick={this.createNewImage}
                                            >
                                                {t('firmware:alerts.click_to_new_image')}
                                            </div>
                                        )
                                        : null}
                                </div>
                                <div className="footer">
                                    <Fragment>
                                        <DojotBtnClassic
                                            label={t('back.label')}
                                            type="secondary"
                                            onClick={toogleSidebarFirmware}
                                        />
                                        <DojotBtnClassic
                                            color="red"
                                            label={t('save.label')}
                                            type="primary"
                                            onClick={e => this.saveImages(e)}
                                        />
                                    </Fragment>
                                </div>
                            </div>
                        )
                        : <div />
                    }
                </Slide>
                <SidebarDeleteImage
                    toggleSidebar={this.toggleDeleteSidebar}
                    showSidebar={showDeleteAttr}
                    confirm={this.removeImage}
                    message={t('firmware:alerts.qst_remove')}
                />
                <SidebarDeleteImage
                    toggleSidebar={this.toggleDeleteBinarySidebar}
                    showSidebar={showDeleteBinaryAttr}
                    confirm={this.removeBinary}
                    message={t('firmware:alerts.qst_remove_binary')}
                />
            </Fragment>
        );
    }
}


SidebarFirmImages.defaultProps = {
    showFirmware: false,
    isNewTemplate: false,
    images: {},
};

SidebarFirmImages.propTypes = {
    showFirmware: PropTypes.bool,
    isNewTemplate: PropTypes.bool,
    images: PropTypes.shape({}),
    t: PropTypes.func.isRequired,
    templateId: PropTypes.number.isRequired,
    toogleSidebarFirmware: PropTypes.func.isRequired,
};

export default withNamespaces()(SidebarFirmImages);