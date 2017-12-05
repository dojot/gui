import React, { Component } from 'react';
import { Link } from 'react-router'

import templateManager from '../../comms/templates/TemplateManager';
import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';

import AltContainer from 'alt-container';

import {  NewPageHeader, PageHeader } from "../../containers/full/PageHeader";

import Dropzone from 'react-dropzone';

import util from "../../comms/util/util";

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';


class DeviceImageUpload extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selection: ""
    }

    this.onDrop = this.onDrop.bind(this);
    this.upload = this.upload.bind(this);
  }

  // this allows us to remove the global script required by materialize as in docs
  componentDidMount() {
    let mElement = ReactDOM.findDOMNode(this.refs.modal);
    $(mElement).ready(function() {
      $('.modal').modal();
    })
  }

  onDrop(acceptedFiles) {
    this.setState({selection: acceptedFiles[0]});
  }

  upload(e) {
    TemplateActions.triggerIconUpdate(this.props.targetDevice, this.state.selection);
  }

  render() {
    return (
      <div className="modal" id="imageUpload" ref="modal">
        <div className="modal-content">
          <div className="row">
            <Dropzone onDrop={this.onDrop} className="dropbox">
              <div className="dropbox-help">Try dropping some files here, or click to select files to upload.</div>
            </Dropzone>
          </div>
          { this.state.selection ? (
            <div className="row fileSelection">
              <span className="label">Selected file</span>
              <span className="data">{this.state.selection.name}</span>
            </div>
          ) : (
            <div className="row fileSelection">
              <span className="data">No file selected</span>
            </div>
          )}
          <div className="pull-right padding-bottom">
            <a onClick={this.upload}
               className=" modal-action modal-close waves-effect waves-green btn-flat">Update</a>
            <a className=" modal-action modal-close waves-effect waves-red btn-flat">Cancel</a>
          </div>
        </div>
      </div>
    )
  }
}


class SummaryItem extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSuppressed: false
        };

        this.suppress = this.suppress.bind(this);
    }

    suppress() {
        let state = this.state;
        state.isSuppressed = !state.isSuppressed;
        this.setState(state);
    }
    render() {
        let ts = (this.props.template.updated ? util.printTime(this.props.template.updated) : "N/A");
        let attrs = (this.props.template.attrs ? this.props.template.attrs.length : '0');
        return (
            <div className={"card-size lst-entry-wrapper z-depth-2 " + (this.state.isSuppressed ? 'suppressed' : 'fullHeight')}
                 id={this.props.id}>

              <div className="lst-entry-title col s12">
                <img className="title-icon" src="images/model-icon.png"/>
                <div className="title-text">
                  <span className="text"> {this.props.template.label} </span>
                </div>
              </div>

              <div className="lst-entry-body">

                <div className="icon-area center-text-parent">
                  <span className="center-text-child">{attrs}</span>
                </div>

                <div className="text-area center-text-parent">
                  <span className="middle-text-child">Attributes</span>
                </div>

                <div className={"center-text-parent material-btn expand-btn right-side " + (this.state.isSuppressed ? '' : 'hidden') } onClick={this.suppress}>
                  <i className="fa fa-angle-down center-text-child text"></i>
                </div>
              </div>

              <div className={"attr-list"} id={"style-3"}>
                  {this.props.template.attrs.map((attributes) =>
                      <AttributeList attributes={attributes}/>)}
              </div>
              <div className="card-footer">
                <div className="material-btn center-text-parent" title="Edit Attributes">
                  <span className="text center-text-child">edit</span>
                </div>
                  <div className="center-text-parent material-btn right-side" onClick={this.suppress}>
                      <i className="fa fa-angle-up center-text-child text"></i>
                  </div>

              </div>

            </div>
        )
    }
}


class AttributeList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isSuppressed: true
        };

        this.suppress = this.suppress.bind(this);
    }

    suppress() {
        let state = this.state;
        state.isSuppressed = !state.isSuppressed;
        this.setState(state);
    }

    render() {
        return (
            <div className={"attr-area " + (this.state.isSuppressed ? 'suppressed' : 'fullHeight')}>
                <div className="attr-row">
                    <div className="icon">
                        <img src="images/tag.png"/>
                    </div>

                    <div className={"attr-content"}>
                        <input type="text" value={this.props.attributes.label} disabled/>
                        <span>Name</span>
                    </div>

                    <div className="center-text-parent material-btn right-side" onClick={this.suppress}>
                        <i className={(this.state.isSuppressed ? 'fa fa-angle-down' : 'fa fa-angle-up') + " center-text-child text"}></i>
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon"></div>
                    <div className={"attr-content"}>
                        <input type="text" value={this.props.attributes.value_type} disabled/>
                        <span>Type</span>
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon"></div>
                    <div className={"attr-content"}>
                        <input type="text" value="True" disabled/>
                        <span>{this.props.attributes.type}</span>
                    </div>
                </div>
            </div>

        )
    }
}

class ListItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      device: {
        id: this.props.device.id,
        label: this.props.device.label,
        attributes: []
      },
      attribute: "",
      typeAttribute: ""
    };

    this.handleEdit = this.handleEdit.bind(this);
    this.handleDetail = this.handleDetail.bind(this);
    this.handleDismiss = this.handleDismiss.bind(this);
    this.addAttribute = this.addAttribute.bind(this);
    this.removeAttribute = this.removeAttribute.bind(this);
    this.handleAttribute = this.handleAttribute.bind(this);
    this.updateDevice = this.updateDevice.bind(this);
    this.deleteDevice = this.deleteDevice.bind(this);
  }

  handleDetail(e) {
    e.preventDefault();
    this.props.detailedTemplate(this.props.device.id);
  }

  handleEdit(e) {
    e.preventDefault();
    this.props.editTemplate(this.props.device.id);
  }

  handleDismiss(e) {
    e.preventDefault();
    this.props.detailedTemplate(undefined);
  }

  updateDevice(e) {
      e.preventDefault();
      let device = this.state.device;
      device.has_icon = this.props.device.has_icon;
      TemplateActions.triggerUpdate(this.state.device);
  }

  deleteDevice(e) {
      e.preventDefault();
      TemplateActions.triggerRemoval(this.state.device);
  }

  addAttribute(t) {
    let state = this.state.device;
    state.attributes.push({name: this.state.attribute, type: this.state.typeAttribute});
    this.state.attribute = '';
    this.state.typeAttribute = '';
    this.setState({ device : state});
  }

  removeAttribute(attribute) {
    let state = this.state.device;

    for(var i = 0; i < state.attributes.length; i++) {
        if(state.attributes[i].name === attribute.name) {
           state.attributes.splice(i, 1);
        }
    }

    this.setState({device: state});
  }

  handleAttribute(event) {
    const target = event.target;
    let state = this.state;
    state[target.name] = target.value;
    this.setState(state);
  }

  handleChange(event) {
    const target = event.target;
    let state = this.state.device;
    state[target.name] = target.value;
    this.setState({
      device: state
    });
  }

  render() {
      return (
            <SummaryItem template={this.props.device}/>
      );
  }
}

class TemplateList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter: ''
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.applyFiltering = this.applyFiltering.bind(this);
    this.detailedTemplate = this.detailedTemplate.bind(this);
    this.editTemplate = this.editTemplate.bind(this);
    this.updateDevice = this.updateDevice.bind(this);
    this.deleteDevice = this.deleteDevice.bind(this);
  }

  detailedTemplate(id) {
    if (this.state.detail && this.state.edit) {
    }

    let temp = this.state;
    temp.detail = id;
    this.setState(temp);
    return true;
  }

  editTemplate(id) {
    if (this.state.detail === id) {
      let temp = this.state;
      temp.edit = id;
      this.setState(temp);
      return true;
    }

    return false;
  }

  handleSearchChange(event) {
    const filter = event.target.value;
    let state = this.state;
    state.filter = filter;
    state.detail = undefined;
    this.setState(state);
  }

  applyFiltering(list) {
    return list;

    const filter = this.state.filter;
    const idFilter = filter.match(/id:\W*([-a-fA-F0-9]+)\W?/);
    return this.props.devices.filter(function(e) {
      let result = false;
      if (idFilter && idFilter[1]) {
        result = result || e.id.toUpperCase().includes(idFilter[1].toUpperCase());
      }

      return result || e.label.toUpperCase().includes(filter.toUpperCase());
    });
  }

  updateDevice(device) {
      this.props.updateDevice(device);

      let state = this.state;
      state.edit = undefined;
      this.setState(state);
  }

  deleteDevice(id) {
      this.props.deleteDevice(id);

      let state = this.state;
      state.edit = undefined;
      this.setState(state);
  }

  render() {

    const filteredList = this.applyFiltering(this.props.templates);

    if (this.props.loading) {
      return (
        <div className="row full-height relative bg-gray">
          <div className="background-info valign-wrapper full-height">
            <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
          </div>
        </div>
      )
    }
    return (
      <div className="full-height relative bg-gray">
        { filteredList.length > 0 ? (
          <div className="col s12 lst-wrapper">
            { filteredList.map((device) =>
                <ListItem device={device}
                          key={device.id}
                          detail={this.state.detail}
                          detailedTemplate={this.detailedTemplate}
                          edit={this.state.edit}
                          editTemplate={this.editTemplate}
                          updateDevice={this.updateDevice}
                          deleteDevice={this.deleteDevice}/>
            )}
          </div>
        ) : (
          <div className="background-info valign-wrapper full-height">
            <span className="horizontal-center">No configured templates</span>
          </div>
        )}

      </div>
    )
  }
}

class Templates extends Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    TemplateActions.fetchTemplates.defer();
  }

  filterChange(newFilter) {
    // TODO make this work properly
  }

  render() {
    return (
      <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true}
          transitionAppearTimeout={500}
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500} >
        <NewPageHeader title="Templates" subtitle="Templates" icon='template'>
          {/* <Filter onChange={this.filterChange} /> */}
          <Link to="/template/new" className="btn-item btn-floating waves-effect waves-light cyan darken-2" title="Create a new template">
            <i className="fa fa-plus"/>
          </Link>
        </NewPageHeader>
        <AltContainer store={TemplateStore}>
          <TemplateList />
        </AltContainer>
      </ReactCSSTransitionGroup>
    );
  }
}

export { Templates as TemplateList };
