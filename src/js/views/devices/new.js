import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { NewPageHeader, PageHeader, ActionHeader } from "../../containers/full/PageHeader";
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link, hashHistory } from 'react-router'

import alt from '../../alt';
import AltContainer from 'alt-container';
import DeviceActions from '../../actions/DeviceActions';
import TagActions from '../../actions/TagActions';
import deviceManager from '../../comms/devices/DeviceManager';
import DeviceStore from '../../stores/DeviceStore';
import TagForm from '../../components/TagForm';
import util from "../../comms/util/util";

import MaterialSelect from "../../components/MaterialSelect";
import MaterialInput from "../../components/MaterialInput";

class FActions {
  set(args) { return args; }
  update(args) { return args; }

  fetch(id) {
    return (dispatch) => {
      dispatch();
      deviceManager.getDevice(id)
        .then((d) => { this.set(d); })
        .catch((error) => { console.error('Failed to get device', error); })
    }
  }
}
const FormActions = alt.createActions(FActions);
const AttrActions = alt.generateActions('set', 'update', 'add', 'remove');
class ErrorActionsImpl {
  reset() { return {}; }
  setField(field, message) {
    return {field: field, message: message};
  }
}
const ErrorActions = alt.createActions(ErrorActionsImpl);
class FStore {
  constructor() {
    this.device = {}; this.set();
    this.newAttr = {}; this.setAttr();

    // Map used to filter out duplicated attr names. Do check loadAttrs() for further notes.
    this.attrNames = {}; this.loadAttrs();

    // General form-wide sticky error messages
    this.attrError = "";
    // Map used to keep per field, custom error messages
    this.fieldError = {};

    this.bindListeners({
      set: FormActions.SET,
      updateDevice: FormActions.UPDATE,
      fetch: FormActions.FETCH,

      addTag: TagActions.ADD,
      removeTag: TagActions.REMOVE,

      setAttr: AttrActions.SET,
      updAttr: AttrActions.UPDATE,
      addAttr: AttrActions.ADD,
      removeAttr: AttrActions.REMOVE,

      errorAttr: ErrorActions.SET_FIELD,
      errorReset: ErrorActions.RESET,
    });
    this.set(null);
  }

  loadAttrs () {
    // TODO: it actually makes for sense in the long run to use (id, key) for attrs which
    //       will allow name updates as well as better payload to event mapping.
    this.attrNames = {};
    if ((this.device === undefined) || (this.device === null)) {
      return;
    }

    if (this.device.hasOwnProperty('attrs')){
      this.device.attrs.map((attr) => this.attrNames[attr.name] = attr.name);
    }

    if (this.device.hasOwnProperty('static_attrs')){
      this.device.static_attrs.map((attr) => this.attrNames[attr.name] = attr.name);
    }
  }

  fetch(id) {}

  set(device) {
    if (device === null || device === undefined) {
      this.device = {
        label: "",
        id: "",
        protocol: "MQTT",
        templates: [],
        tags: [],
        attrs: [],
        static_attrs: []
      };
    } else {
      if (device.attrs == null || device.attrs == undefined) {
        device.attrs = []
      }

      if (device.static_attrs == null || device.static_attrs == undefined) {
        device.static_attrs = []
      }

      this.device = device;
    }

    this.loadAttrs();
  }

  updateDevice(diff) {
    this.device[diff.f] = diff.v;
  }

  addTag(tag) {
    this.device.tags.push(tag);
  }

  removeTag(tag) {
    this.device.tags = this.device.tags.filter((i) => {return i !== tag});
  }

  setAttr(attr) {
    if (attr) {
      this.newAttr = attr;
    } else {
      this.newAttr = {
        object_id: '',
        name: '',
        type: 'string',
        value: ''
      };
    }

    this.attrError = "";
  }

  updAttr(diff) {
    this.newAttr[diff.f] = diff.v;
  }

  errorAttr(error) {
    if (typeof error === 'string') {
      this.attrError = error;
    } else if (typeof error === 'object') {
      this.fieldError[error.field] = error.message;
    }
  }

  errorReset() {
    this.fieldError = {};
  }

  addAttr() {
    // check for duplicate names. Do check loadAttrs() for further details.
    if (this.attrNames.hasOwnProperty(this.newAttr.name)) {
      this.errorAttr({
        field: 'name',
        message: "There's already an attribute named '" + this.newAttr.name + "'"
      });
      return;
    } else {
      this.attrNames[this.newAttr.name] = this.newAttr.name;
    }

    this.newAttr.object_id = util.sid();
    if (this.newAttr.type === "") { this.newAttr.type = 'string'; }
    if (this.newAttr.value.length > 0) {
      this.device.static_attrs.push(JSON.parse(JSON.stringify(this.newAttr)));
    } else {
      delete this.newAttr.value;
      this.device.attrs.push(JSON.parse(JSON.stringify(this.newAttr)));
    }
    this.setAttr();
    this.loadAttrs();
  }

  removeAttr(attribute) {
    if (attribute.value != undefined && attribute.value.length > 0) {
      this.device.static_attrs = this.device.static_attrs.filter((i) => {return i.object_id !== attribute.object_id});
    } else {
      this.device.attrs = this.device.attrs.filter((i) => {return i.object_id !== attribute.object_id});
    }
    this.loadAttrs();
  }
}
var DeviceFormStore = alt.createStore(FStore, 'DeviceFormStore');

class CreateDeviceActions extends Component {
  constructor(props) {
    super(props);

    this.save = this.save.bind(this);
  }

  save(e) {
    e.preventDefault();
    const ongoingOps = DeviceStore.getState().loading;
    if (ongoingOps == false) {
      this.props.operator(JSON.parse(JSON.stringify(DeviceFormStore.getState().device)));
    }
  }

  render() {
    return (
      <div>
        <a className="waves-effect waves-light btn-flat btn-ciano" onClick={this.save} tabIndex="-1">save</a>
        <Link to="/device/list" className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1">dismiss</Link>
      </div>
    )
  }
}


class AttrCard extends Component {
  constructor(props) {
    super(props);

    this.handleRemove = this.handleRemove.bind(this);

  }

  handleRemove(event) {
    event.preventDefault();
    AttrActions.remove(this.props);
  }

  render() {
    const hasValue = (this.props.value && this.props.value.length > 0);
    const splitSize = "col " + (hasValue ? " s4" : " s12");

    return (
      <div className="col s12 m6 l4">
        <div className="card z-depth-2">
          <div className="card-content row">
            <div className="col s10 main">
              <div className="value title truncate">{this.props.name}</div>
              <div className="label">Name</div>
            </div>
            <div className="col s2">
              <i className="clickable fa fa-trash btn-remove-attr-card right" title="Remove attribute" onClick={this.handleRemove}/>
            </div>
            <div className={splitSize}>
              <div className="value">{attrType.translate(this.props.type)}</div>
              <div className="label">Type</div>
            </div>
            {(hasValue > 0) && (
              <div className="col s8">
                <div className="value full-width truncate">{this.props.value}</div>
                <div className="label">Static value</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

class TypeDisplay {
  constructor() {
    this.availableTypes = {
      'geo:point': 'Geo',
      'float':'Float',
      'integer':'Integer',
      'string':'Text',
      'boolean':'Boolean',
    }
  }

  getTypes() {
    let list = []
    for (let k in this.availableTypes) {
      list.push({'value': k, 'label': this.availableTypes[k]})
    }
    return list;

  }

  translate(value) {
    if (this.availableTypes.hasOwnProperty(value)) {
      return this.availableTypes[value];
    }
    return undefined;
  }
}

var attrType = new TypeDisplay();

class NewAttr extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.dismiss = this.dismiss.bind(this);
    this.submit = this.submit.bind(this);
    this.cleanBuffer = this.cleanBuffer.bind(this);
    this.isNameValid = this.isNameValid.bind(this);
    this.isTypeValid = this.isTypeValid.bind(this);
    this.availableTypes = attrType.getTypes();
  }

  componentDidMount() {
    // materialize jquery makes me sad
    try {
      let modalElement = ReactDOM.findDOMNode(this.refs.modal);
      $(modalElement).modal();
      // $(modalElement).ready(function() {
      //   $('.modal').modal();
      // })
    } catch (e) {
      console.error(e);
    }
  }

  isNameValid(name) {
    if (name.length == 0) {
      ErrorActions.setField('name', "You can't leave this empty");
      return false;
    }

    if (name.match(/^\w+$/) == null) {
      ErrorActions.setField('name', "Please use only letters (a-z), numbers (0-9) and underscores (_).");
      return false;
    } if (this.props.attrNames.hasOwnProperty(name)) {
      ErrorActions.setField('name', "There is already an attribute named '" + name + "'");
      return false;
    } else {
      ErrorActions.setField('name', "");
      return true;
    }
  }

  isTypeValid(value){
    const validator = {
      'string': function (value) {
        return value.trim().length > 0;
      },
      'geo:point': function (value) {
        const re = /^([+-]?\d+(\.\d+)?)([,]\s*)([+-]?\d+(\.\d+)?)$/
        const result = re.test(value);
        if (result == false) {
          ErrorActions.setField('value', 'This is not a valid coordinate')
        }
        return result;
      },
      'integer': function (value) {
        const re = /^[+-]?\d+$/
        const result = re.test(value);
        if (result == false) {
          ErrorActions.setField('value', 'This is not an integer')
        }
        return result;
      },
      'float': function (value) {
        const re = /^[+-]?\d+(\.\d+)?$/
        const result = re.test(value);
        if (result == false) {
          ErrorActions.setField('value', 'This is not a float')
        }
        return result;
      },
      'boolean': function (value) {
        const re = /^0|1|true|false$/
        const result = re.test(value);
        if (result == false) {
          ErrorActions.setField('value', 'This is not a boolean')
        }
        return result;
      },
    };

    if (validator.hasOwnProperty(this.props.newAttr.type)) {
      const result = validator[this.props.newAttr.type](value)
      if (result) { ErrorActions.setField('value', ''); }
      return result;
    }

    return true;
  }

  handleChange(event) {
    const handler = {
      'label':  this.isNameValid,
      // 'type':  this.isTypeValid
      'value':  this.isTypeValid
    }

    event.preventDefault();
    AttrActions.update({f: event.target.name, v: event.target.value});
    if (handler.hasOwnProperty(event.target.name)) {
      handler[event.target.name](event.target.value);
    }
  }

  dismiss(event) {
    event.preventDefault();
    AttrActions.set();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).modal('close');
  }

  submit(event) {
    event.preventDefault();

    if (!this.isNameValid(this.props.newAttr.name)) {
      return;
    }

    if(!this.isTypeValid(this.props.newAttr.value) && (this.props.newAttr.value.length > 0)){
      return;
    }

    AttrActions.add();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).modal('close');
  }

  cleanBuffer(event){
    ErrorActions.reset();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).modal('open');
  }

  render() {
    return (
      <span>
        <button data-target="newAttrsForm" className="btn-flat waves waves-light" onClick={this.cleanBuffer}>
          new
        </button>
        <div className="modal visible-overflow-y" id="newAttrsForm" ref="modal">
          <div className="modal-content full">
            <div className="title row">New Attribute</div>
            <form className="row" onSubmit={this.submit}>
              <div className="row">
                <MaterialInput id="fld_name" value={this.props.newAttr.name} className="col s12"
                               error={this.props.fieldError['name']}
                               name="name" onChange={this.handleChange}>
                  Name
                </MaterialInput>
                <MaterialSelect id="fld_type" name="type" key="protocol" className="col s4"
                                value={this.props.newAttr.type} onChange={this.handleChange}
                                label="Type" >
                  {this.availableTypes.map((opt) =>
                    <option value={opt.value} key={opt.label}>{opt.label}</option>
                  )}
                </MaterialSelect>
                <MaterialInput id="fld_value" value={this.props.newAttr.value} className="col s8"
                               error={this.props.fieldError['value']}
                               name="value" onChange={this.handleChange}>
                  Static value
                </MaterialInput>
              </div>
              <div className="row right">
                <div className="col">
                  <button type="submit" className="btn waves waves-light">save</button>
                </div>
                <div className="col">
                  <button type="button" className="btn waves waves-light" onClick={this.dismiss}>dismiss</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </span>
    )
  }
}

class DeviceForm extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  componentWillUnmount() {
    FormActions.set(null);
  }

  handleChange(event) {
    event.preventDefault();
    const f = event.target.name;
    const v = event.target.value;
    FormActions.update({f: f, v: v});
  }

  render() {
    return (
      <div className={"row device" + " " + (this.props.className ? this.props.className : "")}>
        <div className="row detail-header">
          <div className="col s12 m10 offset-m1 valign-wrapper">
            <div className="col s3">
              {/* TODO clickable, file upload */}
              <div className="img">
                <img src="images/ciShadow.svg" />
              </div>
            </div>
            <div className="col s9 pt20px">
              <div>
                <div className="input-field large col s12 ">
                  <MaterialInput id="fld_label" value={this.props.device.label}
                                 name="label" onChange={this.handleChange}>
                    Name
                  </MaterialInput>
                </div>

                <div className="col s12">
                  <MaterialSelect id="fld_prot" name="protocol" className="col s4"
                                  label="Device type"
                                  value={this.props.device.protocol}
                                  onChange={this.handleChange} >
                    <option value="MQTT">MQTT</option>
                    <option value="virtual">Virtual</option>
                  </MaterialSelect>
                  <div className="col s8" >
                    <TagForm tags={this.props.device.tags}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col s10 offset-s1">
            <div className="title col s11">Attributes</div>
            <div className="col s1">
              <NewAttr {...this.props}/>
            </div>
          </div>
        </div>
        <div className="list row">
          <div className="col s10 offset-s1">
            { ((this.props.device.attrs.length > 0) || (this.props.device.static_attrs.length > 0) ) ? (
              <span>
                {this.props.device.attrs.map((attr) =>
                  <AttrCard key={attr.object_id} {...attr}/>
                )}
                {this.props.device.static_attrs.map((attr) =>
                  <AttrCard key={attr.object_id} {...attr}/>
                )}
              </span>
            ) : (
              <div className="padding10 background-info">
                No attributes set
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

class NewDevice extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const edit = this.props.params.device;
    if (edit) {
      FormActions.fetch(edit);
    }
  }

  render() {
    let title = "New device";
    let ops = function(device) {
      DeviceActions.addDevice(device, (device) => {
        FormActions.set(device);
        hashHistory.push('/device/id/' + device.id + '/edit')
        Materialize.toast('Device created', 4000);
      });
    }
    if (this.props.params.device) {
      title = "Edit device";
      ops = function(device) {
        DeviceActions.triggerUpdate(device, () => {
          Materialize.toast('Device updated', 4000);
        });
      }
    }

    return (
      <div className="full-width full-height">
        <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true} transitionAppearTimeout={500}
          transitionEnterTimeout={500} transitionLeaveTimeout={500} >
          <AltContainer store={DeviceStore} >
          <NewPageHeader title="Devices" subtitle="device manager" icon="device">
            <CreateDeviceActions operator={ops} />
            </NewPageHeader>
          </AltContainer>
            <AltContainer store={DeviceFormStore} >
            <DeviceForm />
          </AltContainer>
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}

export { NewDevice };
