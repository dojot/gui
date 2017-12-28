import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { NewPageHeader, PageHeader, ActionHeader } from "../../containers/full/PageHeader";
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link, hashHistory } from 'react-router'
import alt from '../../alt';
import AltContainer from 'alt-container';
import DeviceActions from '../../actions/DeviceActions';
import deviceManager from '../../comms/devices/DeviceManager';
import DeviceStore from '../../stores/DeviceStore';
import TagForm from '../../components/TagForm';
import util from "../../comms/util/util";
import { DojotBtnFlat, DojotButton } from "../../components/DojotButton";

import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';

import MaterialSelect from "../../components/MaterialSelect";
import MaterialInput from "../../components/MaterialInput";


/*
 Below begins the React Flux's hell
*/

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
// const AttrActions = alt.generateActions('set', 'update', 'add', 'remove');
const AttrActions = alt.generateActions('update');

class FStore {
  constructor() {
    this.device = {}; this.set();
    // this.newAttr = {};
    // this.setAttr();

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
      // setAttr: AttrActions.SET,
      setAllAttrs : AttrActions.UPDATE,
      // updAttr: AttrActions.UPDATE,
      // addAttr: AttrActions.ADD,
      // removeAttr: AttrActions.REMOVE,
    });
    this.set(null);
  }

  //
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
    console.log("loading attributes to store");
    console.log("Device was updated in Store: ",this.device);
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
      console.log("Device was updated in Store: ",this.device);
    }

    this.loadAttrs();
  }

  updateDevice(diff) {
    this.device[diff.f] = diff.v;
  }

  setAllAttrs(attr_list){
    console.log(attr_list);
    this.device.static_attrs = [];
    this.device.attrs = [];
    for(let k in attr_list){
      if (String(attr_list[k].type) == "static") {
        this.device.static_attrs.push(JSON.parse(JSON.stringify(attr_list[k])));
      } else {
        delete attr_list[k].static_value;
        this.device.attrs.push(JSON.parse(JSON.stringify(attr_list[k])));
      }
    }
    console.log("set all attr", this.device);
  }

  // setAttr(attr) {
  //   if (attr) {
  //     this.newAttr = attr;
  //   } else {
  //     this.newAttr = {
  //       object_id: '',
  //       name: '',
  //       type: 'string',
  //       value: ''
  //     };
  //   }
  // }

  // updAttr(diff) {
  //   this.newAttr[diff.f] = diff.v;
  // }
  //
  // addAttr() {
  //   // check for duplicate names. Do check loadAttrs() for further details.
  //   // if (this.attrNames.hasOwnProperty(this.newAttr.name)) {
  //   //   this.errorAttr({
  //   //     field: 'name',
  //   //     message: "There's already an attribute named '" + this.newAttr.name + "'"
  //   //   });
  //   //   return;
  //   // } else {
  //   //   this.attrNames[this.newAttr.name] = this.newAttr.name;
  //   // }
  //
  //   this.newAttr.object_id = util.sid();
  //   if (this.newAttr.type === "") { this.newAttr.type = 'string'; }
  //   if (this.newAttr.value.length > 0) {
  //     this.device.static_attrs.push(JSON.parse(JSON.stringify(this.newAttr)));
  //   } else {
  //     delete this.newAttr.value;
  //     this.device.attrs.push(JSON.parse(JSON.stringify(this.newAttr)));
  //   }
  //   this.setAttr(); // clean attr slot
  //   this.loadAttrs();
  // }

  // removeAttr(attribute) {
  //   if (attribute.value != undefined && attribute.value.length > 0) {
  //     this.device.static_attrs = this.device.static_attrs.filter((i) => {return i.object_id !== attribute.object_id});
  //   } else {
  //     this.device.attrs = this.device.attrs.filter((i) => {return i.object_id !== attribute.object_id});
  //   }
  //   this.loadAttrs();
  // }
}

var DeviceFormStore = alt.createStore(FStore, 'DeviceFormStore');

// class AttrCard extends Component {
//   constructor(props) {
//     super(props);
//
//     this.handleRemove = this.handleRemove.bind(this);
//
//   }
//
//   handleRemove(event) {
//     event.preventDefault();
//     AttrActions.remove(this.props);
//   }
//
//   render() {
//     const hasValue = (this.props.value && this.props.value.length > 0);
//     const splitSize = "col " + (hasValue ? " s4" : " s12");
//
//     return (
//       <div className="col s12 m6 l4">
//         <div className="card z-depth-2">
//           <div className="card-content row">
//             <div className="col s10 main">
//               <div className="value title truncate">{this.props.name}</div>
//               <div className="label">Name</div>
//             </div>
//             <div className="col s2">
//               <i className="clickable fa fa-trash btn-remove-attr-card right" title="Remove attribute" onClick={this.handleRemove}/>
//             </div>
//             <div className={splitSize}>
//               <div className="value">{attrType.translate(this.props.type)}</div>
//               <div className="label">Type</div>
//             </div>
//             {(hasValue > 0) && (
//               <div className="col s8">
//                 <div className="value full-width truncate">{this.props.value}</div>
//                 <div className="label">Static value</div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     )
//   }
// }


// var attrType = new TypeDisplay();

/* Below stuffs that makes sense */

class SpecificAttrs extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
      event.preventDefault();
      const f = event.target.name;
      const v = event.target.value;
      this.props.changeAttr(f,v);
  }

  render() {
    return (
      <div className="attr-box specific-attr">
        <div className="col s12">
            <div className="attr-title">Specific Attributes</div>
        </div>
          {( this.props.attrs.length > 0) ? (
            <div className="col s12">
              {
                this.props.attrs.map((attr) =>
                      <div key={attr.label} className="col s4 attr-fields">
                        <div className="attr-name">{attr.label}</div>
                        <div className="attr-type">{attr.value_type}</div>
                        <div className="attr-name input-field fix-inputs">
                          <MaterialInput className='mt0px' id="fld_label" value={attr.static_value} name="label" onChange={this.handleChange}></MaterialInput>
                        </div>
                        <div className="attr-type fix-value ">Value</div>
                      </div>
                )
              }
            </div>
          ) : (
            <div className="col s12">
                <div className="no-data-notification">No attributes.</div>
            </div>
      )}

      </div>
    )
  }
}


class AttrBox extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="attr-box">
        <div className="col s12">
            <div className="attr-title">{this.props.label}</div>
        </div>
        {( this.props.attrs.length > 0) ? (
          <div className="col s12">
            {
              this.props.attrs.map((attr) =>
                    <div className="col s4">
                    { String(attr.type) != 'static' ? (
                        <div>
                      <div className="attr-name">{attr.label}</div>
                      <div className="attr-type">{attr.value_type}</div>
                      </div>) : ( null ) }
                    </div>
              )
            }
            </div>
          ) : (
            <div className="col s12">
                <div className="no-data-notification">No attributes.</div>
            </div>
          )}

      </div>
    )
  }
}







class DeviceForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      templateState: 0,
      templates: [],
      selectedTemplates: [],
      loaded:false,
    };
    // templateState = 0 - Removal painel
    // templateState = 1 - Addition painel
    this.handleChange = this.handleChange.bind(this);
    this.toggleTemplate = this.toggleTemplate.bind(this);
    this.setTemplateState = this.setTemplateState.bind(this);
    this.save = this.save.bind(this);
    this.changeAttr = this.changeAttr.bind(this);
    this.createStaticAttrs = this.createStaticAttrs.bind(this);
  }

  componentDidMount() {
      console.log("Edition mode: ", this.props.edition);
  }

  componentDidUpdate() {
      console.log("componentDidUpdate,",DeviceStore.getState().loading);
      // @TODO probably not the best way to do it
      if (this.props.edition && !this.state.loaded && DeviceFormStore.getState().device.id  != "" )
      {
          console.log("device", this.device, DeviceFormStore.getState().device);
          let dev = DeviceFormStore.getState().device;
          console.log("templates", dev.templates);

          // let selectedTemplates = [];
          // for(let k in this.state.selectedTemplates){
          //   template_list.push(this.state.selectedTemplates[k].id);
          // }
          // this.state.selectedTemplates
          this.setState({selectedTemplates: dev.templates,loaded:true});
      }
  }

  save(e) {
    e.preventDefault();

    // First at all, checks all static values

    // @TODO we should show the errors
    let to_be_checked = DeviceFormStore.getState().device;
    if (!util.isNameValid(to_be_checked.label)) {
      Materialize.toast("Missing label.", 4000);
      return;
    }
    // if(!util.isTypeValid(this.props.newAttr.value,this.props.newAttr.type)){
    //   return;
    // }

    // set all static attributes on device
    AttrActions.update(this.state.staticAttrs);
    // set dynamic attributes if necessary
    // AttrActions.update(this.state.attrs);
    let template_list = [];
    for(let k in this.state.selectedTemplates){
      template_list.push(this.state.selectedTemplates[k].id);
    }

    FormActions.update({f:"templates", v:template_list});
    console.log("Object to go: ",JSON.parse(JSON.stringify(DeviceFormStore.getState().device)));

    // Now, saves the device;
    const ongoingOps = DeviceStore.getState().loading;
    if (ongoingOps == false) {
      this.props.operator(JSON.parse(JSON.stringify(DeviceFormStore.getState().device)));
    }
  }

  componentWillUnmount() {
    FormActions.set(null);
  }

  setTemplateState(state){
      this.setState({templateState: state});
  }

  toggleTemplate(tmpt) {
    // check if template is active
    let selectedTemplate = this.state.selectedTemplates.filter(function(item) {
        return item.id === tmpt.id
    })

    let list = [];
    if (selectedTemplate.length == 0 ) //adding template
    {
      list = this.state.selectedTemplates;
      list.push(tmpt);
    }
    else { //removing template
      list = this.state.selectedTemplates.filter(function(item) {
          return item.id !== tmpt.id
      })
    }

    this.createStaticAttrs();
    // this isn't the better way to do it.

    this.setState({
      selectedTemplates: list
    });
  }

  handleChange(event) {
    event.preventDefault();
    const f = event.target.name;
    const v = event.target.value;
    FormActions.update({f: f, v: v});
  }

  changeAttr(label, val){
    let st = this.state.staticAttrs;
    for(let k in st){
      if (st[k].label == label)
        st[k].value = val;
    }
    this.setState({staticAttrs: st});
  }

  createStaticAttrs()
  {
    let st = this.state.selectedTemplates;
    let static_attrs = [];
    for(let k in st){
      let list = st[k].attrs
        .filter((i) => {return String(i.type) == "static"})
        .map(function(attr){
            attr.value = '';
            attr.id = util.sid();
            attr.template_id = st[k].id;
          return attr;
        });
      static_attrs = static_attrs.concat(list);
    }
    this.setState({staticAttrs: static_attrs});
  }


  render() {

    let templates = this.props.templates.templates;
    for(let k in templates){
      templates[k].active = false;
      for(let j in this.state.selectedTemplates){
        if (templates[k].id == this.state.selectedTemplates[j].id)
        {
            templates[k].active = true;
        }
      }
    }

    return (
      <div className={"row device device-frame mb0 " + (this.props.className ? this.props.className : "")}>
          <div className="col s6 data-frame">
            <div className="col s12">
              <div className="col s3">
                {/* TODO clickable, file upload */}
                <div className="img">
                  <img src="images/big-chip.png" />
                </div>
              </div>
              <div className="col s9 pt20px">
                <div>
                  <div className="input-field large col s12 ">
                    <MaterialInput id="fld_label" value={this.props.device.device.label} name="label" onChange={this.handleChange}> Name </MaterialInput>
                  </div>
                </div>
              </div>
            </div>

            <div className="col s12">
            {
              (this.state.selectedTemplates.length > 0) ? (
                <div className="react-bug-escape">
                {
                  <SpecificAttrs attrs={this.state.staticAttrs} change={this.state.changeAttr} />
                }
                { this.state.selectedTemplates.map((tplt) =>
                  <AttrBox key={tplt.id} {...tplt}/>)
                }
                </div>
              )
              : (
                <div className="padding10 background-info pb160px">
                  Select a template to start
                </div>
              )
            }
            </div>
            {(this.state.selectedTemplates.length > 0) && (

            <div className='col s12 footer text-right'>
            {
              // <button type="button" className="waves-effect waves-dark red btn-flat">
              //   Save
              // <DojotButton color='white' click='' label='Discard' />
              // </button>
            }
              <a className="waves-effect waves-light btn-flat btn-ciano" onClick={this.save} tabIndex="-1">save</a>
              <Link to="/device/list" className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1">dismiss</Link>
            </div>)}

          </div>

          <div className="col s6 p0">
          { this.state.templateState == 0 ? (
            <TemplateFrame setTemplateState={this.setTemplateState} toggleTemplate={this.toggleTemplate} templates={this.state.selectedTemplates} state={this.state.templateState} />
          ) : (
            <TemplateFrame setTemplateState={this.setTemplateState} toggleTemplate={this.toggleTemplate} templates={templates} state={this.state.templateState} />
          )}
          </div>
      </div>
    )
  }
}


class TemplateFrame extends Component {
  constructor(props) {
    super(props);
    // this.handleRemove = this.handleRemove.bind(this);
    this.toggleTemplate = this.toggleTemplate.bind(this);
    this.removeTemplate = this.removeTemplate.bind(this);
    this.setAditionMode = this.setAditionMode.bind(this);
    this.setRemovalMode = this.setRemovalMode.bind(this);
    this.showSearchBox = this.showSearchBox. bind(this);
  }

  // componentDidMount() {
  //     console.log("TemplateFrame = this.props",this.props);
  // }

  removeTemplate(template){
    this.props.toggleTemplate(template);
  }

  toggleTemplate(template){
    this.props.toggleTemplate(template);
  }

  setAditionMode(){
    this.props.setTemplateState(1);
  }

  setRemovalMode(){
    this.props.setTemplateState(0);
  }

  showSearchBox()
  {
      console.log("Not implemented yet");
  }

  // handleRemove(event) {
  //   event.preventDefault();
  //   AttrActions.remove(this.props);
  // }

  render() {
    // const hasValue = (this.props.templates && this.props.templates.length > 0);
    console.log("this", this.props.templates);
    return (
      <div className="col s12 template-frame">
        <div className="col s12 header">
          <label className="col s6 text-left" >All Templates </label>

          <div className="col s6 text-right" >
          { this.props.state == 0 ? (
            <DojotBtnFlat click={this.setAditionMode} icon={'fa fa-plus'} tooltip='Add templates' />
          ) : (
            <div>
              <DojotBtnFlat click={this.setRemovalMode} icon={'fa fa-chevron-left'} tooltip='Remove templates'/>
              <DojotBtnFlat click={this.showSearchBox} icon={'fa fa-search'} />
            </div>
          )}
           </div>
        </div>
        <div className="col s12 body">
          {this.props.templates.map((temp) =>
            <div key={temp.id} className="card template-card">
            { this.props.state == 0 ? (
              <div>
                  <div onClick={this.removeTemplate.bind(this,temp)} className="remove-layer">
                    <i className="fa fa-remove"> </i>
                  </div>
                  <div className="template-name space-p-r">{temp.label}</div>
              </div>
            ) : (
              null
            )}

            { this.props.state == 1 ? (
              <div>
              { temp.active ? (
              <div onClick={this.toggleTemplate.bind(this,temp)} className="active-layer">
                <i className="fa fa-check"> </i>
              </div> ) : (
                <div onClick={this.toggleTemplate.bind(this,temp)} className="empty-layer">
                </div>
              ) }
              <div className="template-name">{temp.label}</div>
            </div>
          ) : (
             null
           )}
        </div>
      )}
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
    FormActions.set(null);
    const edit = this.props.params.device;
    if (edit) {
      FormActions.fetch(edit);
    }
    // DeviceActions.fetchStats(this.props.user.user.service);
    TemplateActions.fetchTemplates.defer();
  }

  render() {
    let title = "New device";
    let edition = false;
    if (this.props.params.device)
      edition = true;

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
          transitionEntattrTypeerTimeout={500} transitionLeaveTimeout={500} >
          <NewPageHeader title="Devices" subtitle="device manager" icon="device">
          </NewPageHeader>
          <AltContainer stores={{device: DeviceFormStore, templates: TemplateStore}} >
          <DeviceForm deviceid={this.props.params.device} edition={edition} operator={ops} />
          </AltContainer>
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}

export { NewDevice };
