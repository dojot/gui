/* eslint-disable */
import React, { Component } from 'react';
import AltContainer from 'alt-container';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import Dropzone from 'react-dropzone';
import ImageStore from '../../stores/ImageStore';
import ImageActions from '../../actions/ImageActions';
import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';
import { NewPageHeader } from '../../containers/full/PageHeader';
import util from '../../comms/util';
import { Loading } from '../../components/Loading';

// UI elements

import MaterialInput from '../../components/MaterialInput';
import toaster from '../../comms/util/materialize';

class UploadDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            files: [],
        };
        this.dismiss = this.dismiss.bind(this);
        this.save = this.save.bind(this);
    }

    onDrop(files) {
        this.setState({
            files,
        });
    }

    dismiss(event) {
        event.preventDefault();
        this.props.closeModal();
    }

    save(event) {
        event.preventDefault();
        // console.log('save', this.state.files);

        if (this.state.files.length == 0) {
            toaster.success('No image added.');
            return;
        }

        const sha1 = util.getSHA1(this.state.files[0]);
        // console.log("sha1", sha1);
        const img_binary = {
            template_id: this.props.template,
            image_id: this.props.image.id,
            fw_version: this.props.image.fw_version,
            has_image: true,
            binary: this.state.files[0],
            sha1,
        };
        ImageActions.triggerUpdate(img_binary, () => {
            toaster.success('Image added.');
            this.props.closeModal();
        });
    }

    componentDidMount() {
    }

    render() {
        return (
            <div>
                <div className="full-background" onClick={this.dismiss} />
                <div className="modal">
                    <div className="modal-content full">
                        <div className="background-info">
                            <div>Click below to upload a file.</div>
                            <section>
                                <div className="dropzone">
                                    <Dropzone multiple={false} onDrop={this.onDrop.bind(this)}>
                                        <p>Drop the file here or click to select image to upload.</p>
                                    </Dropzone>
                                </div>
                                <aside className="listFiles">
                                    <ul>
                                        {
                                            this.state.files.map(f => (
                                                <li key={f.name}>
                                                    {f.name}
                                                    {' '}
-
                                                    {' '}
                                                    {f.size}
                                                    {' '}
bytes
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </aside>
                                <div className="modal-footer right">
                                    <button type="button" className="btn-flat btn-ciano waves-effect waves-light" onClick={this.dismiss}>cancel</button>
                                    <button type="submit" className="btn-flat btn-red waves-effect waves-light" onClick={this.save}>save</button>
                                </div>
                            </section>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
}

class NewImageCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fw_version: '',
        };
        this.save = this.save.bind(this);
        this.cancel = this.cancel.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }


    componentDidMount() {
    // FirmwareActions.set(null);
    }

    save(e) {
        e.preventDefault();

        // console.log('save');
        // let image = ImageStore.getState().new_image;
        // console.log('image', image);
        const img = {
            template_id: this.props.template.id,
            fw_version: this.state.fw_version,
        };
        // console.log('image', img);
        ImageActions.triggerInsert(img, (img) => {
            toaster.success('Image created.');
        });
        this.props.setNewImage(false);
    }

    cancel() {
        // console.log('cancel');
        this.props.setNewImage(false);
    }

    handleChange(event) {
        event.preventDefault();
        // const f = event.target.name;
        // const v = event.target.value;
        // this.fw_version = event.target.value;
        // FirmwareActions.update({ f: f, v: v });
        this.setState({ fw_version: event.target.value });

        // console.log('chacdnign');
    }

    render() {
        return (
            <div className="image-card image-card-attributes">
                <div className="lst-blockquote col s12 blockblock">
                    <div className="attr-row ">

                        {/* <div className="attr-name">Firmware Version</div> */}
                        <div className="input-field col s12">
                            <MaterialInput
                                className="mt0px"
                                id="fw_version"
                                name="fw_version"
                                value={this.state.fw_version}
                                onChange={this.handleChange}
                            >
                                {' '}
Firmware Version
                            </MaterialInput>
                        </div>

                    </div>

                    {/* <div className="attr-content black-attr-row">
            <label>No image saved. </label>
            <span>Binary Hash</span>
            <div className="searchBtn" title="Add a Binary file" onClick={this.openBinaryModal}>
              <i className="fa fa-search" />
            </div>
          </div> */}
                    <div className="attr-row">
                        <div className="row right">
                            <div className="col s6">
                                <button type="submit" className="btn-light btn-light-2 waves waves-light" onClick={this.save}>Save</button>
                            </div>
                            <div className="col s6">
                                <button type="button" className="btn-light btn-light-2 waves waves-light" onClick={this.cancel}>Cancel</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
}

class ImageCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            starred: false,
            modal_opened: false,
        };
        this.images = [];
        this.removeImage = this.removeImage.bind(this);
        this.clickStar = this.clickStar.bind(this);
        this.removeBinary = this.removeBinary.bind(this);
        this.openBinaryModal = this.openBinaryModal.bind(this);
        this.closeUploadModal = this.closeUploadModal.bind(this);
    }

    removeImage(e) {
        // console.log('removeImage', this.props.image);
        e.preventDefault();
        ImageActions.triggerRemoval(this.props.image);
    }

    closeUploadModal() {
        this.setState({ modal_opened: false });
    }

    openBinaryModal() {
        this.setState({ modal_opened: true });
    }


    clickStar() {
        // console.log('clickStar');
        // this.props.changeState(0);
        this.setState({ starred: !this.state.starred });
    }


    removeBinary() {
        const img_binary = {
            template_id: this.props.template_id,
            image_id: this.props.image.id,
            fw_version: this.props.image.fw_version,
            has_image: false,
            binary: '',
            sha1: '',
        };
        // console.log('removeBinary', img_binary);
        ImageActions.triggerUpdate(img_binary, () => {
            toaster.success('Image updated.');
        });
    // this.props.changeState(0);
    }

    componentDidMount() {
    }

    render() {
    // console.log("asdsdsd")
    // console.log("this.props.template", this.props.template);
    // console.log("this.props.image", this.props.image);

        let binaryInfo = null;
        if (this.props.image.has_image) {
            binaryInfo = (
                <div className="attr-content black-attr-row">
                    <label title={`SHA1: ${this.props.image.sha1}`}>{this.props.image.sha1}</label>
                    <span>Binary file</span>
                    <div onClick={this.removeBinary} className="searchBtn" title="Remove Binary file">
                        <i className="fa fa-trash" />
                    </div>

                </div>
            );
        } else {
            binaryInfo = (
                <div className="attr-content black-attr-row">
                    <label>No image saved. </label>
                    <span>Binary file</span>
                    <div className="searchBtn" title="Add a Binary file" onClick={this.openBinaryModal.bind(this)}>
                        <i className="fa fa-upload" />
                    </div>

                </div>
            );
        }


        return (
            <div className="image-card image-card-attributes">
                {this.state.modal_opened === true && <UploadDialog closeModal={this.closeUploadModal} image={this.props.image} template={this.props.template_id} />}
                <div className="lst-blockquote col s12 pr">
                    <div onClick={this.removeImage} className="remove-image-icon " title="Remove Image">
                        <i className="fa fa-trash" />
                    </div>

                    <div className="star-icon " onClick={this.clickStar}>
                        <i className={`fa ${this.state.starred ? 'fa-star' : 'fa-star-o'}`} />
                    </div>

                    <div className="attr-row">
                        <div className="icon">
                            {/* <i className="fa fa-hdd" /> */}
                        </div>
                        <div className="attr-content">
                            <label>{this.props.image.fw_version}</label>
                            <span>Firmware Version</span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon">
                            {/* <img src={"images/update.png"} /> */}
                        </div>
                        <div className="attr-content">
                            <label>
                                {util.iso_to_date(this.props.image.created)}
                                {' '}
                            </label>
                            <span>Created At</span>
                        </div>
                    </div>
                    {binaryInfo}

                </div>
            </div>
        );
    }
}


class FirmwareCardImpl extends Component {
    constructor(props) {
        super(props);
        this.state = {
            creating: false,
        };
        this.images = [];
        this.createNewImage = this.createNewImage.bind(this);
        this.setNewImage = this.setNewImage.bind(this);
    }

    createNewImage() {
        this.setState({ creating: true });
    }

    setNewImage(value) {
        this.setState({ creating: value });
    }

    render() {
        // console.log('this.props.template_2', this.props.template);
        // console.log('this.props.images', this.props.images);
        // this.images = this.props.images;

        const images = [];
        for (const img in this.props.images) images.push(this.props.images[img]);
        // console.log('images', images);
        // return (
        //   null
        // )
        return (
            <div className="card-size lst-entry-wrapper z-depth-2 firmware-card ">
                <div className="lst-entry-title col s12">
                    <img className="title-icon" src="images/model-icon.png" />
                    <div className="title-text">
                        <span className="text">
                            {' '}
                            {this.props.template.label}
                            <br />
                            <label className="label-explation">Template Name</label>
                        </span>
                    </div>
                </div>
                <div className="attr-area attr-list light-background">
                    {images.map((img, idx) => (
                        <ImageCard template_id={this.props.template.id} image={img} key={idx} />
                    ))}
                    {this.state.creating === false && (
                        <div className="image-card image-card-attributes">
                            <div onClick={this.createNewImage} className="lst-blockquote col s12">
                                <span className="new-image-text"> Create a new Image</span>
                            </div>
                        </div>
                    )}
                    {this.state.creating === true && <NewImageCard setNewImage={this.setNewImage} template={this.props.template} />}
                </div>

            </div>
        );
    }
}


class FirmwareCard extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        ImageActions.fetchImages.defer();
    }

    render() {
        return (
            <AltContainer store={ImageStore}>
                <FirmwareCardImpl template={this.props.template} />
            </AltContainer>
        );
    }
}


class ImageArea extends Component {
    constructor(props) {
        super(props);
        this.filteredList = [];
        this.state = {
            active_image_id: 1,
        };
        this.activeImage = this.activeImage.bind(this);
        this.getTemplateWithImages = this.getTemplateWithImages.bind(this);
    }

    getTemplateWithImages(tmplts) {
        return tmplts;
    }

    componentDidMount() {
    }

    activeImage(image_id) {
        // console.log('changing active_image_id', image_id);
        this.setState({ active_image_id: image_id });
    }

    render() {
        // console.log('this.props.templates', this.props.templates);
        // it happens when TemplateStore is loading
        // console.log('this.props.loading', this.props.loading);
        if (this.props.loading == undefined || this.props.loading) {
            return (<Loading />);
        }

        this.filteredList = this.getTemplateWithImages(this.props.templates);
        // let selectedImage = this.filteredList[0];
        // console.log('filteredList', this.filteredList);
        return (
            <div className="row bg-light-gray">
                <div className="col s12 data-frame p0">
                    {this.filteredList.length == 0 ? (
                        <span className="no-device-configured">
                No image available.
                        </span>
                    ) : (
                        <div className="col s12 lst-wrapper extra-padding">
                            {this.filteredList.map(temp => (
                                <FirmwareCard template={temp} key={temp.id} selectImage={this.activeImage.bind(this)} />
                            ))}
                        </div>
                    )}
                </div>
                {/* <div className="col s4 template-frame">
          <ImageInfo image={selectedImage} />
        </div> */}

            </div>

        );
    }
}

class FirmwareUpdate extends Component {
    constructor(props) {
        super(props);
        this.state = { showFilter: false };
        this.toggleSearchBar = this.toggleSearchBar.bind(this);
    }

    componentDidMount() {
        // console.log('componentDidMount');
        // ImageActions.fetchImages.defer();
        TemplateActions.fetchTemplates.defer();
    }

    toggleSearchBar() {
        const last = this.state.showFilter;
        this.setState({ showFilter: !last });
    }

    //   toggleDisplay() {
    //     const last = this.state.displayList;
    //     this.setState({ displayList: !last });
    //   }

    render() {
        const detail = 'detail' in this.props.location.query
            ? this.props.location.query.detail
            : null;

        return (
            <ReactCSSTransitionGroup transitionName="first" transitionAppear transitionAppearTimeout={500} transitionEnterTimeout={500} transitionLeaveTimeout={500}>
                <NewPageHeader title="Firmware management" subtitle="" icon="firmware">
                    {/* <Filter onChange={this.filterChange} /> */}
                    {/* <Link to="/device/new" title="Create a new device" className="btn-item btn-floating waves-effect waves-light cyan darken-2">
            <i className="fa fa-plus"/>
          </Link> */}
                    <div className="pt10">
                        {/* <div className="searchBtn" title="Show search bar" onClick={this.toggleSearchBar.bind(this)}>
              <i className="fa fa-search" />
            </div> */}
                        {/* <DojotBtnLink linkTo="/device/new" label="New Image" alt="Create a new image" icon="fa fa-plus" /> */}
                    </div>
                </NewPageHeader>
                <AltContainer store={TemplateStore}>
                    <ImageArea showSearchBox={this.state.showFilter} />
                </AltContainer>
            </ReactCSSTransitionGroup>
        );
    }
}

export { FirmwareUpdate, ImageCard, NewImageCard };
