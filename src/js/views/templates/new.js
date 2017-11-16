import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { NewPageHeader, PageHeader, ActionHeader } from "../../containers/full/PageHeader";
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link, hashHistory } from 'react-router'

import alt from '../../alt';
import AltContainer from 'alt-container';
import TemplateActions from '../../actions/TemplateActions';
import TagActions from '../../actions/TagActions';
import templateManager from '../../comms/templates/TemplateManager';
import TemplateStore from '../../stores/TemplateStore';
import TagForm from '../../components/TagForm';
import util from "../../comms/util/util";

class FActions {
  set(args) { return args; }
  update(args) { return args; }

  fetch(id) {
    return (dispatch) => {
      dispatch();
      templateManager.getTemplate(id)
      .then((d) => { this.set(d); })
      .catch((error) => { console.error('Failed to get template', error); })
    }
  }
}

const FormActions = alt.createActions(FActions);
const AttrActions = alt.generateActions('set', 'update', 'add', 'remove');
class FStore {
  constructor() {
    this.device = {}; this.set();
    this.newAttr = {}; this.setAttr();
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
    });
    this.set(null);
  }

  fetch(id) {}

  set(device) {
    if (device === null || device === undefined) {
      this.device = {
        label: "",
        id: "",
        protocol: "",
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
        type: '',
        value: ''
      };
    }
  }

  updAttr(diff) {
    this.newAttr[diff.f] = diff.v;
  }

  addAttr() {
    this.newAttr.object_id = util.sid();
    if (this.newAttr.type === "") { this.newAttr.type = 'string'; }
    if (this.newAttr.value.length > 0) {
      this.device.static_attrs.push(JSON.parse(JSON.stringify(this.newAttr)));
    } else {
      delete this.newAttr.value;
      this.device.attrs.push(JSON.parse(JSON.stringify(this.newAttr)));
    }
    this.setAttr();
  }

  removeAttr(attribute) {
    if (attribute.value != undefined && attribute.value.length > 0) {
      this.device.static_attrs = this.device.static_attrs.filter((i) => {return i.object_id !== attribute.object_id});
    } else {
      this.device.attrs = this.device.attrs.filter((i) => {return i.object_id !== attribute.object_id});
    }
  }
}
var TemplateFormStore = alt.createStore(FStore, 'TemplateFormStore');

class ModalPlaceholder extends Component {
  constructor(props) {
    super(props);

    this.remove = this.remove.bind(this);
    this.dismiss = this.dismiss.bind(this);
  }

  componentDidMount() {
    // materialize jquery makes me sad
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).ready(function() {
      $('.modal').modal();
    })
  }

  remove() {
    TemplateActions.triggerRemoval(this.props.id, () => {
      let modalElement = ReactDOM.findDOMNode(this.refs.modal);
      $(modalElement).modal('close');
      hashHistory.push('/template/list');
    })
  }

  dismiss(event) {
    event.preventDefault();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).modal('close');
  }

  render() {
    return (
      <div className="modal" id={this.props.target} ref="modal">
        <div className="modal-content full">
          <div className="row center background-info">
            <div><i className="fa fa-exclamation-triangle fa-4x" /></div>
            <div>You are about to remove this template.</div>
            <div>Are you sure?</div>
          </div>
        </div>
        <div className="modal-footer right">
            <button type="button" className="btn-flat btn-ciano waves-effect waves-light" onClick={this.dismiss}>cancel</button>
            <button type="submit" className="btn-flat btn-red waves-effect waves-light" onClick={this.remove}>remove</button>
        </div>
      </div>
    )
  }
}

class CreateTemplateActions extends Component {
  constructor(props) {
    super(props);

    this.save = this.save.bind(this);
  }

  save(e) {
    e.preventDefault();
    const ongoingOps = TemplateStore.getState().loading;
    if (ongoingOps == false) {
      this.props.operator(JSON.parse(JSON.stringify(TemplateFormStore.getState().device)));
    }
  }

  render() {
    return (
      <div>
        <a className="waves-effect waves-light btn-flat btn-ciano" onClick={this.save} tabIndex="-1">save</a>
        {(this.props.id != undefined && this.props.id != null) && (
          <button className="waves-effect waves-light btn-flat btn-red" data-target="confirmDiag">remove</button>
        )}
        <Link to="/template/list" className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1">dismiss</Link>
      </div>
    )
  }
}

class AttrCard extends Component {
  render() {

    const attr = this.props;
    const hasValue = (attr.value && attr.value.length > 0);
    const splitSize = "col " + (hasValue ? " s6" : " s12");

    return (
      <div className="col s12 m6 l4">
        <div className="card z-depth-2">
          <div className="card-content row">
            <div className="col s10 main">
              <div className="value title">{attr.name}</div>
              <div className="label">Name</div>
            </div>
            <div className="col s2">
              <i className="clickable fa fa-trash btn-remove-attr-card right" onClick={() => {AttrActions.remove(attr);}} title="Remove attribute"/>
            </div>
            <div className={splitSize}>
              <div className="value">{attr.type}</div>
              <div className="label">Type</div>
            </div>
            {(hasValue > 0) && (
              <div className={splitSize}>
                <div className="value">{attr.value}</div>
                <div className="label">Value</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

class NewAttr extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.dismiss = this.dismiss.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    // materialize jquery makes me sad
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).ready(function() {
      $('.modal').modal();
    })
  }

  handleChange(event) {
    event.preventDefault();
    AttrActions.update({f: event.target.name, v: event.target.value});
  }

  dismiss(event) {
    event.preventDefault();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).modal('close');
  }

  submit(event) {
    event.preventDefault();
    AttrActions.add();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).modal('close');
  }

  render() {
    return (
      <span>
        <button data-target="newAttrsForm" className="btn-flat waves waves-light">new</button>
        <div className="modal" id="newAttrsForm" ref="modal">
          <div className="modal-content full">
            <div className="title row">New Attribute</div>
            <form className="row" onSubmit={this.submit}>
              <div className="row">
                <div className="input-field col s12" >
                  <label htmlFor="fld_name">Name</label>
                  <input id="fld_name" type="text"
                          name="name" value={this.props.newAttr.name}
                          key="protocol" onChange={this.handleChange} />
                </div>
                <div className="input-field col s4" >
                  <label htmlFor="fld_type">Type</label>
                  <input id="fld_type" type="text"
                        name="type" value={this.props.newAttr.type}
                        key="protocol" onChange={this.handleChange} />
                </div>
                <div className="input-field col s8" >
                  <label htmlFor="fld_value">Default value</label>
                  <input id="fld_value" type="text"
                        name="value" value={this.props.newAttr.value}
                        key="protocol" onChange={this.handleChange} />
                </div>
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

class TemplateForm extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  componentWillUnmount() {
    FormActions.set();
  }

  componentDidMount() {
    Materialize.updateTextFields();
  }

  componentDidUpdate() {
    Materialize.updateTextFields();
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
                  <label htmlFor="fld_name">Name</label>
                  <input id="fld_name" type="text"
                         name="label" value={this.props.device.label}
                         key="label" onChange={this.handleChange} />
                </div>

                <div className="col s12">
                  <div className="col s8" >
                    <TagForm tags={this.props.device.tags} />
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

class NewTemplate extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const edit = this.props.params.template;
    if (edit) {
      FormActions.fetch(edit);
    }
  }

  render() {
    let title = "New template";
    let ops = function(template) {
      TemplateActions.addTemplate(template, (template) => {
        FormActions.set(template);
        hashHistory.push('/template/id/' + template.id + '/edit')
        Materialize.toast('Template created', 4000);
      });
    }
    if (this.props.params.template) {
      title = "Edit template";
      ops = function(template) {
        TemplateActions.triggerUpdate(template, () => {
          Materialize.toast('Template updated', 4000);
        });
      }
    }

    return (
      <div className="full-width full-height">
        <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true} transitionAppearTimeout={500}
          transitionEnterTimeout={500} transitionLeaveTimeout={500} >
          <NewPageHeader title="Templates" subtitle="Templates" icon='template'>
            <CreateTemplateActions operator={ops} id={this.props.params.template}/>
          </NewPageHeader>
          <AltContainer store={TemplateFormStore} >
            <TemplateForm />
          </AltContainer>
        </ReactCSSTransitionGroup>

        {/* id prop is actually used by the trigger, that is created elsewhere  */}
        <ModalPlaceholder id={this.props.params.template} target='confirmDiag'/>
      </div>
    )
  }
}

export { NewTemplate };
