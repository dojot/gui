import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import ImageActions from 'Actions/ImageActions';
import util from 'Comms/util';
import toaster from 'Comms/util/materialize';
import { templateType } from '../../../TemplatePropTypes';
import ImageList from './ImageList';

class SidebarFirmware extends Component {
    constructor(props) {
        super(props);
        this.state = {
            new_image: false,
        };
        this.images = {};
        this.createNewImage = this.createNewImage.bind(this);
        this.changeAttrValue = this.changeAttrValue.bind(this);
        this.removeBinary = this.removeBinary.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.saveImages = this.saveImages.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    componentDidMount() {
        if (!this.props.isNewTemplate) {
            ImageActions.fetchImages.defer(this.props.template.id);
        }
    }

    onDrop(files, image) {
        ImageActions.updateImageData(image.id, 'file', files);
    }

    createNewImage() {
        if (!this.state.new_image) {
            ImageActions.insertEmptyImage({
                id: util.guid(), image_version: '', created: null, new: true, saved: false, image_hash: null,
            });
            this.setState({ new_image: true });
        }
    }

    saveImages(e) {
        e.preventDefault();

        Object.entries(this.props.images).map(([key, image]) => {
            if (!image.saved) {
                // for each non saved image,
                // 1. update or create image
                // 2. upload binary
                // 3. set as saved image
                const json_img = {
                    label: String(this.props.template.id),
                    fw_version: image.image_version,
                    sha1: null,
                };
                ImageActions.triggerInsert(json_img, (img) => {
                    let id_to_be_used = image.id;
                    if (image.new) {
                        toaster.success('Image created.'); // @Todo we should split it in 2 methods;
                        id_to_be_used = img.id;
                    } else {
                        toaster.success('Image updated.');
                    }

                    if (image.file) {
                        const img_binary = {
                            id: id_to_be_used,
                            binary: image.file[0],
                        };
                        ImageActions.triggerUpdate(img_binary, () => {
                            toaster.success('Image added.');
                        });
                    }
                    ImageActions.updateImageData(id_to_be_used, 'saved', true);
                    if (image.new) {
                        this.setState({ new_image: false });
                    }
                });
            }
            return null;
        });
    }

    removeBinary(e, image) {
        e.preventDefault();

        ImageActions.triggerRemovalBinary(image.id, () => {
            toaster.success('Image updated.');
        });
    }

    removeImage(e, image) {
        e.preventDefault();
        // this.images = this.images.filter(el => el.id !== image.id);

        if (image.new) {
            ImageActions.removeSingle(image.id);
            this.setState({ new_image: false });
        } else {
            ImageActions.triggerRemoval(image, () => {
                toaster.error('Image removed.');
            });
        }
    }

    changeAttrValue(event, attr) {
        event.preventDefault();
        const { name } = event.target;
        const { value } = event.target;
        // FirmwareActions.update({ f: f, v: v });
        //    this.setState({ fw_version: event.target.value });
        // const values = { ...attr };
        // values[event.target.name] = event.target.value;
        this.props.images[attr.id].saved = false;
        this.props.images[attr.id][name] = value;
        ImageActions.updateImageData(attr.id, name, value);
    }

    render() {
        const { showFirmware, toogleSidebarFirmware } = this.props;

        return (
            <>
                <Slide right when={showFirmware} duration={300}>
                    { showFirmware
                        ? (
                            <div className="-sidebar sidebar-attribute">
                                <div className="header">
                                    <div className="title">Firmware</div>
                                    <div className="icon">
                                        <img src="images/icons/template-cyan.png" alt="device-icon" />
                                    </div>
                                    <div className="header-path">
                                        {'template > firmware management'}
                                    </div>
                                </div>

                                <div className="body">
                                    <ImageList list={this.props.images} changeAttrValue={this.changeAttrValue} removeImage={this.removeImage} removeBinary={this.removeBinary} onDrop={this.onDrop} />
                                    {(!this.state.new_image)
                                        ? (
                                            <div className="body-form-nodata clickable" onClick={this.createNewImage}>
                                                Click here to add a new image
                                            </div>
                                        )
                                        : null }
                                </div>
                                <div className="footer">
                                    <>
                                        <DojotBtnClassic label="discard" type="secondary" onClick={toogleSidebarFirmware} />
                                        <DojotBtnClassic color="red" label="save" type="primary" onClick={(e) => this.saveImages(e)} />
                                    </>
                                </div>
                            </div>
                        )
                        : <div />}
                </Slide>
            </>
        );
    }
}

SidebarFirmware.defaultProps = {
    showFirmware: false,
    isNewTemplate: false,
};

SidebarFirmware.propTypes = {
    showFirmware: PropTypes.bool,
    isNewTemplate: PropTypes.bool,
    template: PropTypes.shape(templateType).isRequired,
    toogleSidebarFirmware: PropTypes.func.isRequired,

};

export default SidebarFirmware;
