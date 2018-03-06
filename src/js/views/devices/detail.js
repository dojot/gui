import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { NewPageHeader } from "../../containers/full/PageHeader";
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link, hashHistory } from 'react-router'

import alt from '../../alt';
import AltContainer from 'alt-container';
import MeasureStore from '../../stores/MeasureStore';
import MeasureActions from '../../actions/MeasureActions';
import DeviceActions from '../../actions/DeviceActions';
import DeviceStore from '../../stores/DeviceStore';
import deviceManager from '../../comms/devices/DeviceManager';
import util from "../../comms/util/util";

import DeviceMeta from '../../stores/DeviceMeta';
import { Loading } from "../../components/Loading";
import { Attr } from "../../components/HistoryElements";
import { Line } from 'react-chartjs-2';
import { PositionRenderer } from './DeviceMap.js'
import { MapWrapper } from './Devices.js'
import { DojotBtnRedCircle } from "../../components/DojotButton";
import MaterialSelect from "../../components/MaterialSelect";

import io from 'socket.io-client';


class DeviceHeader extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div className="row devicesSubHeader p0 device-details-header">
        <div className="col s4 m4">
          <label className="col s12 device-label"> {this.props.device.label}</label>
          <div className="col s12 device-label-name">Name</div>
        </div>
        {/* <div className="col s8 m8 infos">
          <div className="title">Created at</div>
          <div className="value">{this.props.device.created}</div>
        </div> */}
      </div>;
  }
}



class Attribute extends Component {
  constructor(props) {
    super(props);
      this.state = {
      opened: false,
    };
    this.toogleExpand = this.toogleExpand.bind(this);
  }

  componentDidMount(){
     console.log("componentDidMount",this.props);
    //  MeasureActions.fetchMeasure(this.props.device, this.props.device.id, this.props.device.templates, this.props.attr.id, 250);
  }

  toogleExpand(state) {
    console.log("state", state);
    this.setState({opened: state});
  }

  render() {
    console.log("attrs", this.props.attr,this.props.expand);

    return <div className={"attributeBox " + (this.state.opened ? "expanded" : "compressed")}>
        <div className="header">
          <label>{this.props.attr.label}</label>
          {!this.state.opened ? <i onClick={this.toogleExpand.bind(this, true)} className="fa fa-expand" /> : <i onClick={this.toogleExpand.bind(this, false)} className="fa fa-compress" />}
        </div>

        {/* <AttributeBox attrs={this.state.selected_attributes} /> */}
        <div className="body">
          <AttrHistory device={this.props.device} type={this.props.attr.value_type} attr={this.props.attr.label} />
        </div>
      </div>;
  }
}



class Configurations extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <div>
        <GenericList img="images/gear-dark.png" attrs={this.props.attrs} box_title="Configurations" />
      </div>;
  }
}

class StaticAttributes extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <div>
        <GenericList img="images/tag.png" attrs={this.props.attrs} box_title="Static Attributes" />
      </div>;
  }
}

class GenericList extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div className="row stt-attributes">
        <div className="col s12 header">
          <div className="icon">
            <img src={this.props.img} />
          </div>
          <label>{this.props.box_title}</label>
        </div>
        <div className="col s12 body">
          {this.props.attrs.map(attr => (
            <div key={attr.label} className="line">
              <div className="col s4">
                <div className="name-value">{attr.label}</div>
                <div className="value-label">Name</div>
              </div>
              <div className="col s8">
                  <div className="value-value">{attr.static_value}</div>
                  <div className="value-label">{attr.value_type}</div>
              </div>
                {/* <div className="col s4">
                <div className="template-value">Template</div>
                <div className="template-label">Template</div>
              </div> */}
             </div>
          ))}
        </div>
      </div>;
  }
}



class DyAttributeArea extends Component {
  constructor(props) {
    super(props);
    this.state = { selected_attributes: [], visible_attributes: {} };
    this.toggleAttribute = this.toggleAttribute.bind(this);
  }

  toggleAttribute(attr)
  {
    let sa = this.state.selected_attributes;
    let current_attrs = this.state.visible_attributes;
    if (current_attrs[attr.id])
    {
      sa = sa.filter(i => {
        return i.id != attr.id;
      });
      delete current_attrs[attr.id];
    }
    else
    {
       sa.push(attr);
       current_attrs[attr.id] = true;
    }

    // iterate over attrs
    this.setState({
        selected_attributes: sa,
        visible_attributes: current_attrs
      });
  }

    // onChange(attrs) {
  //   MeasureActions.fetchMeasure.defer(this.props.deviceid,this.props.device.templates, attrs, 1);
  //   this.setState({ selected_attrs: attrs });
  // }

  render() {
    let lista = this.props.attrs;
    for (let index in lista)
    {
      if (this.state.visible_attributes[lista[index].id])
        lista[index].visible = true;
      else
        lista[index].visible = false;
    }

     return <div className="" >
         <div className="second-col">
           {this.state.selected_attributes.map(at => (
            <Attribute key={at.id} device={this.props.device} attr={at} />
           ))}
         </div>
         <div className="third-col">
           <DynamicAttributeList device={this.props.device} attrs={lista} change_attr={this.toggleAttribute} />
         </div>
       </div>;
  }
}


class DynamicAttributeList extends Component {
  constructor(props) {
    super(props);
    this.clickAttr = this.clickAttr.bind(this);
  }

  clickAttr(attr)
  {
      console.log("clickAttr");
      this.props.change_attr(attr);
  }

  render() {
    console.log("attrs -> ", this.props.attrs);

    return <div className=" dy_attributes">
        <div className="col s12 header">
          <div className="col s2 filter-icon">
            {/* <i className="fa fa-filter" /> */}
          </div>
          <label className="col s8">Dynamic Attributes</label>
          <div className="col s2 search-icon">
            <i className="fa fa-search" />
          </div>
        </div>
        <div className="col s12 body">
          {this.props.attrs.map(attr => (
            <div key={attr.label} className="line">
              <div className="col offset-s2 s8">
                <div className="label">{attr.label}</div>
                {/* <div className="value-label">{attr.value_type}</div> */}
              </div>
              <div className="col s2">
                <div className="star" onClick={this.clickAttr.bind(this, attr)}>
                    <i className={"fa " + (attr.visible ? "fa-star" : "fa-star-o")} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>;
  }
}



class RemoveDialog extends Component {
  constructor(props) {
    super(props);

    this.dismiss = this.dismiss.bind(this);
    this.remove = this.remove.bind(this);
  }

  componentDidMount() {
    // materialize jquery makes me sad
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).ready(function() {
      $('.modal').modal();
    })
  }

  dismiss(event) {
    event.preventDefault();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).modal('close');
  }

  remove(event) {
    event.preventDefault();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    this.props.callback(event);
    $(modalElement).modal('close');
  }

  render() {
    return (
      <div className="modal" id={this.props.target} ref="modal">
        <div className="modal-content full">
          <div className="row center background-info">
            <div><i className="fa fa-exclamation-triangle fa-4x" /></div>
            <div>You are about to remove this device.</div>
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

class DeviceUserActions extends Component {
  constructor(props) {
    super(props);
    this.removeDevice = this.removeDevice.bind(this);
  }

  removeDevice(event) {
      event.preventDefault();
      $("#" + this.props.confirmTarget).modal("open");
    // };
  }


  render() {
    return (
      <div>
        <DojotBtnRedCircle
          to={"/device/id/" + this.props.deviceid + "/edit"}
          icon="fa fa-pencil"
          tooltip="Edit device"
        />
        <DojotBtnRedCircle
          icon=" fa fa-trash"
          tooltip="Remove device"
          click={this.removeDevice}
        />
        <DojotBtnRedCircle
          to={"/device/list"}
          icon="fa fa-arrow-left"
          tooltip="Return to device list"
        />
      </div>
    );
  }
}


// class AttributeSelector extends Component {
//   render() {
//     const outerClass = this.props.active ? " active" : "";
//     return (
//       <div className={"col s12 p0 attr-line" + outerClass}>
//         <a className="waves-effect waves-light"
//            onClick={() => {this.props.onClick(this.props.label)}} >
//           <span className="attr-name">{this.props.label}</span>
//           {this.props.currentValue ? (
//             <span>Last received value: {this.props.currentValue}</span>
//           ) : (
//             <span>No data available to display</span>
//           )}
//         </a>
//       </div>
//     )
//   }
// }

class AttrHistory extends Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div className="graphLarge">
        {/* <div className="refresh-btn-history"
                onClick={() => {
                  MeasureActions.fetchMeasure(this.props.device, [this.props.attr], 250);
                }} >
            <i className="fa fa-refresh" />
        </div> */}
        <div className="contents no-padding">
          <AltContainer store={MeasureStore}>
            <Attr device={this.props.device} type={this.props.type} attr={this.props.attr}/>
          </AltContainer>
        </div>
      </div>
    );
  }
}

// class AttrHistoryWrapper extends Component {
//   constructor(props) {
//     super(props);
//   }

//   componentDidMount() {
//     // this.setState({ selected: attr_id });
//     MeasureActions.fetchMeasure(
//       this.props.device,
//       this.props.device.id,
//       this.props.device.templates,
//       this.props.attr.id,
//       250
//     );
//   }

//   render() {
//     // let device = this.props.device;
//     // let attr = [];

//     // if (this.state.selected !== null) {
//     //   attr = device.attrs[device.templates].filter(k => {
//     //     return k.label.toUpperCase() == this.state.selected.toUpperCase();
//     //   });
//     // }

//     // let timeRange = undefined;

//     /*
//     * Maybe it's better to talk about time range. Think about the best way to show this value
//     * or even if it's necessary to show this value.
//     */
//     console.log("this.props.data.attrs", this.props.data.attrs);
//     // if (attr[0]) {
//     //   for (let k in this.props.data.attrs[device.templates]) {
//     //     if (
//     //       this.props.data.attrs[device.templates][k].label ==
//     //       this.state.selected
//     //     ) {
//     //       if (this.props.data.value.length !== 0) {
//     //         let length = this.props.data.value.length;
//     //         const from = util.iso_to_date(
//     //           this.props.data.value[length - 1]["ts"]
//     //         );
//     //         timeRange = "Data from " + from;
//     //         //const to = util.iso_to_date(this.props.data.value['ts']);
//     //       }
//     //     }
//     //   }
//     // }

//     return (
//       <div className="col s12 p0 full-height">
//         {/* <div className="col s5 card-box">
//           <div className="detail-box-header">Attributes</div>
//           <div className="col s12 attr-box-body">
//             {this.props.attrs.map(attr => {
//               let data = undefined;
//               let active =
//                 this.state.selected &&
//                 attr.toUpperCase() === this.state.selected.toUpperCase();
//               if (this.props.data && this.props.data.hasOwnProperty("value")) {
//                 if (this.props.data.value.length > 0) {
//                   data = this.props.data.value[
//                     this.props.data.value.length - 1
//                   ];
//                 }
//               }
//               return (
//                 <AttributeSelector
//                   label={attr}
//                   key={attr}
//                   currentValue={data}
//                   active={active}
//                   onClick={this.changeAttribute}
//                 />
//               );
//             })}
//           </div>
//         </div> */}
//         {/* <div className="col s12 legend">{timeRange}</div> */}
//         <div className="col s7 graph-box">
//           {attr[0] !== undefined ? (
//               <AttrHistory
//                 device={this.props.device}
//                 type={attr[0].value_type}
//                 attr={attr[0].label}
//               />
//           ) : null}
//         </div>
//       </div>
//     );
//   }
// }


function getAttrsLength(attrs){
  let length = 0;
  for(let k in attrs){
    length = length + attrs[k].length;
  }
  return length;
}

function StatusDisplay(props) {
  const numAttributes = getAttrsLength(props.device.attrs);
  return (
    <div className="detail-box-body">
      <div className="metric">
          <span className="label">Attributes</span>
          <span className="value">{numAttributes}</span>
      </div>
      <div className="metric">
          <span className="label">Last update</span>
          <span className="value">{util.iso_to_date(props.device.ts)}</span>
      </div>
      <div className="metric">
          <span className="label">Location</span>
          <span className="value">{props.location}</span>
      </div>
      <div className="metric">
          <span className="label">Protocol</span>
          <span className="value">{props.device.protocol ? props.device.protocol : "MQTT"}</span>
      </div>
    </div>
  )
}

// class AttrSelector extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {attributes: [], new_attr: ""};
//     this.handleSelectedAttribute = this.handleSelectedAttribute.bind(this);
//     this.handleAddAttribute = this.handleAddAttribute.bind(this);
//     this.handleClear = this.handleClear.bind(this);
//     this.getAttrList = this.getAttrList.bind(this);
//   }

//   componentWillMount(){
//     let attrs = [];
//     console.log("this.props.device", this.props.device);
//     for (let index in this.props.device.attrs) {
//       attrs = attrs.concat(this.props.device.attrs[index]);
//     }
//      this.setState({ attributes: attrs });
//     console.log("Attr list", attrs);
//   }

//   handleSelectedAttribute(event) {
//     event.preventDefault();
//     this.setState({new_attr: event.target.value});
//   }

//   handleAddAttribute(event) {
//     event.preventDefault();
//     this.setState({new_attr: ""});
//     if (this.state.new_attr === ""){ return; }
//     if (this.props.selected.includes(this.state.new_attr)) { return; }

//     const attrList = this.props.selected.concat([this.state.new_attr]);
//     this.props.onChange(attrList);
//   }

//   handleClear(event) {
//     event.preventDefault();
//     this.props.onChange([]);
//   }

//   getAttrList(attributes) {
//     let attrList = [];
//     for (let templateID in attributes) {
//       for (let attributeID in attributes[templateID]) {
//         attrList.push(attributes[templateID][attributeID]);
//       }
//     }
//     return attrList;
//   }

//   render() {

//     console.log("Checking props ",this.props);
//     return (
//       <div className="col 12 attribute-box">
//         <div className="col 12 attribute-header">All Attributes</div>
//         <span className="highlight">
//           Showing <b> {this.props.selected.length} </b>
//           of <b> {this.state.attributes.length} </b> attributes
//         </span>
//         <div className="col s12 p16">
//           <div className="input-field col s12">
//             <MaterialSelect id="attributes-select" style="color: #D23F3F;" name="attribute"
//                             value={this.state.new_attr}
//                             onChange={this.handleSelectedAttribute}>
//               <option value="">Select attribute to display</option>
//                 {this.getAttrList(this.props.attrs).map((attr) => (
//                     <option value={attr.label} key={attr.id}>{attr.label}</option>
//                 ))}

//             </MaterialSelect>
//           </div>
//           <div className="col s12 actions-buttons">
//             <div className="col s6 button ta-center">
//               <a className="waves-effect waves-light btn btn-light" id="btn-clear" tabIndex="-1"
//                  title="Clear" onClick={this.handleClear}>
//                 Clear
//               </a>
//             </div>
//             <div className="col s6 button ta-center" type="submit" onClick={this.handleAddAttribute}>
//               <a className="waves-effect waves-light btn red lighten-1" id="btn-add" tabIndex="-1" title="Add">
//                 <i className="clickable fa fa-plus"/>
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }
// }


class PositionWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
      hasPosition: false,
      pos: []
    };
    this.getDevicesWithPosition = this.getDevicesWithPosition.bind(this);
    this.toogleExpand = this.toogleExpand.bind(this);
  }

  toogleExpand(state) {
    console.log("state", state);
    this.setState({opened: state});
  }


  getDevicesWithPosition(device){
    function parserPosition(position){
      let parsedPosition = position.split(", ");
      return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
    }

    let validDevices = [];
       for(let j in device.attrs){
         for(let i in device.attrs[j]){
           if(device.attrs[j][i].type == "static"){
             if(device.attrs[j][i].value_type == "geo:point"){
               device.position = parserPosition(device.attrs[j][i].static_value);
             }
           }
         }
       }

      device.select = true;
      if(device.position !== null && device.position !== undefined){
        validDevices.push(device);
      }
    return validDevices;
  }

  render() {
    function NoData() {
        return (
          <div className="valign-wrapper full-height background-info">
            <div className="full-width center">No position <br />available</div>
          </div>
        )
    }

    console.log("Position Renderer ", this.props.device);
    if (this.props.device === undefined)
    {
      return (<NoData />);
    }

    let validDevices = this.getDevicesWithPosition(this.props.device);
    console.log("validDevices", validDevices);
    if (validDevices.length == 0) {
      return <NoData />;
    } else {
      return <div className={"PositionRendererDiv " + (this.state.opened ? "expanded" : "compressed")}>
          <div className="floating-icon">
            {!this.state.opened ? <i onClick={this.toogleExpand.bind(this, true)} className="fa fa-expand" /> : <i onClick={this.toogleExpand.bind(this, false)} className="fa fa-compress" />}
          </div>
          <PositionRenderer devices={validDevices} allowContextMenu={false} center={validDevices[0].position} />
        </div>
    }
  }
}

// // TODO do this properly, using props.children
// function HeaderWrapper(props) {
//   const device = props.device;

//   let location = "";
//   if (device.position !== undefined && device.position !== null) {
//      location = "Lat: "+device.position[0].toFixed(4)+", Lng: "+device.position[1].toFixed(4);
//   }

//   return (
//     <StatusDisplay location={location} device={device} />
//   )
// }

class DeviceDetail extends Component {
  constructor(props) {
    super(props);
  }

  //  componentWillMount(){
  //    const device = this.props.device;
  //    if (device == undefined)
  //      return; //not ready
   //
  //    for (let i in device.attrs) {
  //      for (let j in device.attrs[i]) {
  //        if(device.attrs[i][j].value_type == "geo:point"){
  //          MeasureActions.fetchPosition.defer(device, device.id, device.attrs[i][j].label);
  //        }
  //      }
  //    }
  //  }

  render() {
     console.log("device : ",this.props.device);
     let attr_list = [];
     let dal = [];
     let config_list = [];
     for (let index in this.props.device.attrs)
     {
       let tmp = this.props.device.attrs[index];
       attr_list = attr_list.concat(tmp.filter(i => {
         return String(i.type) == "static";
       }));
       dal = dal.concat(tmp.filter(i => {
           i.visible = false;
           return String(i.type) == "dynamic";
         }));
      config_list = config_list.concat(tmp.filter(i => {
           return String(i.type) == "meta";
         }));
     };

     return <div className="row detail-body">
         <div className="first-col full-height">
           <div className="col s12 device-map-box">
             <AltContainer store={MeasureStore}>
               <PositionWrapper device={this.props.device} />
             </AltContainer>
           </div>
           <Configurations device={this.props.device} attrs={config_list} />
           <StaticAttributes device={this.props.device} attrs={attr_list} />
         </div>
        <DyAttributeArea device={this.props.device} attrs={dal}/>
       </div>;

       // <div className="row detail-body">
       //   <div className="col s3 detail-box full-height">
       //     <div className="detail-box-header">General</div>
       //       <HeaderWrapper device={device} />
       //     <AttrSelector device = {device}
       //                   attrs={device.attrs}
       //                   selected={this.state.selected_attributes}
       //                   onChange={this.onChange} />
       //   </div>
       //   <div className="col s9 device-map full-height">
       //     <div className="col s12 device-map-box">
       //       <AltContainer store={DeviceStore} >
       //         <PositionWrapper device={device}/>
       //       </AltContainer>
       //     </div>
       //     <div className="col s12 p0 data-box full-height">
       //       <AltContainer store={MeasureStore} inject={{device: device}}>
       //         <AttributeBox attrs={this.state.selected_attributes}/>
       //       </AltContainer>
       //     </div>
       //   </div>
       //  </div> */}
  }
}

// function ConnectivityStatus(props) {
//   const status = props.devices[props.device_id]['_status'];
//   if (status === "online") {
//     return (
//       <span className='status-on-off clr-green'><i className="fa fa-info-circle" />Online</span>
//     )
//   }

//   return (
//     <span className='status-on-off clr-red'><i className="fa fa-info-circle" />Offline</span>
//   )
// }




class ViewDeviceImpl extends Component {
  constructor(props) {
    super(props);

    this.remove = this.remove.bind(this);
  }

  componentWillMount(){
    const device = this.props.devices[this.props.device_id];
    if (device == undefined)
      return; //not ready

    for (let i in device.attrs) {
      for (let j in device.attrs[i]) {
          MeasureActions.fetchMeasure.defer(device, device.id, device.attrs[i][j].label, 10);
      }
    }
  }

  componentDidMount(){
    // Realtime
    var socketio = require('socket.io-client');

    const target = 'http://' + window.location.host;
    const token_url = target + "/stream/socketio";

    const url = token_url;
    const config = {}

    util._runFetch(url, config)
      .then((reply) => {
        init(reply.token);
      })
      .catch((error) => {console.log("Failed!", error);
    });

    function init(token){
      var socket = socketio(target, {query: "token=" + token, transports: ['websocket']});

      socket.on('all', function(data){
        let device_data = {device_id: data.metadata.deviceid}
        let label = Object.keys(data.attrs);
        MeasureActions.appendMeasures(data)
      });
    }
    //------------------------------------------------------------------------
  }

  remove(e) {
    // This should be on DeviceUserActions -
    // this is not good, but will have to make do because of z-index on the action header
    e.preventDefault();
      DeviceActions.triggerRemoval({id: this.props.devices[this.props.device_id].id}, (device) => {
      hashHistory.push('/device/list');
      Materialize.toast('Device removed', 4000);
    });
  }

  render() {
    let title = "View device";

    let device = undefined;
    let teste = DeviceMeta.getState();


    if (this.props.devices !== undefined){
      if (this.props.devices.hasOwnProperty(this.props.device_id)) {
        device = this.props.devices[this.props.device_id];
      }
    }

    if (device === undefined) {
      return (<Loading />);
    }

     return (
      <div className="full-height bg-light-gray">
      <NewPageHeader title="Devices" subtitle="device manager" icon="device">
          <div className="box-sh">
            <DeviceUserActions devices={this.props.devices} deviceid={device.id} confirmTarget="confirmDiag"/>
          </div>
          <RemoveDialog callback={this.remove} target="confirmDiag" />
        </NewPageHeader>
        <DeviceHeader device={device}>
        </DeviceHeader>
        <DeviceDetail deviceid={device.id} device={device}/>
      </div>
    )
  }
}


class ViewDevice extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
      DeviceActions.fetchSingle.defer(this.props.params.device);
  }

  componentDidUpdate() {
    // const options = { transports: ["websocket"] };
    // this.io = io(window.location.host, options);
    // this.io.on(this.props.params.device, function(data) {
    //   MeasureActions.appendMeasures(data);
    //
    //   const fields = ["ts", "temperature", "sinr"];
    //   let device_data = { device_id: data.device_id };
    //   device_data.position = [data.lat.value, data.lng.value];
    //   fields.map(field => {
    //     if (data.hasOwnProperty(field)) {
    //       if (field === "ts") {
    //         device_data[field] = util.timestamp_to_date(Date.now());
    //       } else {
    //         device_data[field] = data[field].value;
    //       }
    //     }
    //   });
    //   MeasureActions.updatePosition(device_data);
    // });
  }

  // componentWillUnmount() {
  //   this.io.close();
  // }

  render() {
    return (
      <div className="full-width full-height">
        <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true}
          transitionAppearTimeout={500}
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}
        >
          <AltContainer store={DeviceStore}>
            <ViewDeviceImpl device_id={this.props.params.device} />
          </AltContainer>
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

export { ViewDevice };
