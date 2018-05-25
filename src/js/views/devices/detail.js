import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { NewPageHeader } from "../../containers/full/PageHeader";
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {  hashHistory } from 'react-router'
import AltContainer from 'alt-container';
import MeasureStore from '../../stores/MeasureStore';
import MeasureActions from '../../actions/MeasureActions';
import DeviceActions from '../../actions/DeviceActions';
import DeviceStore from '../../stores/DeviceStore';
import util from "../../comms/util/util";
import DeviceMeta from '../../stores/DeviceMeta';
import { Loading } from "../../components/Loading";
import { Attr } from "../../components/HistoryElements";
import { PositionRenderer } from './DeviceMap.js'
import { MapWrapper } from './Devices.js'
import { DojotBtnRedCircle } from "../../components/DojotButton";
import Script from 'react-load-script';



class Tooltip extends Component{
  constructor(props) {
      super(props);
  }

  render(){
    console.log("TooltipValue: ", this.props.tooltipValue)
      return(
          <div className="div-tooltip">
              <span>{this.props.tooltipValue}</span>
          </div>
      )
  }
}

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
    //  MeasureActions.fetchMeasure(this.props.device, this.props.device.id, this.props.device.templates, this.props.attr.id, 250);
  }

  toogleExpand(state) {
    this.setState({opened: state});
  }

  render() {
    // check the current window, if less then 1024px, blocks compressed state
    let width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;
    let opened = this.state.opened; 
      if (width < 1168 )
      opened = true;

    return <div className={"attributeBox " + (opened ? "expanded" : "compressed")}>
        <div className="header">
          <label>{this.props.attr.label}</label>
          {!opened ? <i onClick={this.toogleExpand.bind(this, true)} className="fa fa-expand" /> : <i onClick={this.toogleExpand.bind(this, false)} className="fa fa-compress" />}
        </div>

        {/* <AttributeBox attrs={this.state.selected_attributes} /> */}
        <div className="details-card-content">
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
        <GenericList img="images/gear-dark.png" attrs={this.props.attrs} box_title="Configurations" device={this.props.device}/>
      </div>;
  }
}

class StaticAttributes extends Component {
  constructor(props) {
    super(props);

    this.openStaticMap = this.openStaticMap.bind(this);
  }

  openStaticMap(state){
    this.props.openStaticMap(state);
  }

  render() {
    return <div>
        <GenericList img="images/tag.png" attrs={this.props.attrs} box_title="Static Attributes" device={this.props.device} openStaticMap={this.openStaticMap}/>
      </div>;
  }
}

class GenericList extends Component {
  constructor(props) {
    super(props);
    this.state = {openStaticMap: true, visible_static_map: false, truncate: false}

    this.openMap = this.openMap.bind(this);
    this.verifyIsGeo = this.verifyIsGeo.bind(this);
    this.limitSizeField = this.limitSizeField.bind(this);
  }

  componentWillMount(){
    this.limitSizeField(this.props.attrs);
  }

  openMap(visible){
    const device = this.props.device;
    for(let k in device.attrs){
      for(let j in device.attrs[k]){
        if(device.attrs[k][j].value_type === "geo:point"){
          if(device.attrs[k][j].static_value !== ""){
            this.setState({
              openStaticMap: !this.state.openStaticMap,
              visible_static_map: !this.state.visible_static_map
            });
            this.props.openStaticMap(this.state.openStaticMap);
          }
        }
      }
    }
  }

  verifyIsGeo(attrs){
    for(let k in attrs){
      if(attrs[k].value_type === 'geo:point' || attrs[k].value_type === 'geo'){
        attrs[k].isGeo = true;
      } else {
        attrs[k].isGeo = false;
      }
    }
  }

  limitSizeField(attrs){
    attrs.map(attr => {
      if(attr.type == "meta"){
        // values of configurations
        if(attr.static_value.length > 20){
          this.setState({truncate: true});
        }
      } else {
        if(attr.label.length > 20 || attr.value_type > 20){
          this.setState({truncate: true});
        }
        // Values of static attributes
        if(attr.static_value.length > 20){
          this.setState({truncate: true});
        }
      }
    })
  }

  render() {
    this.verifyIsGeo(this.props.attrs);
    return <div className="row stt-attributes">
        <div className="col s12 header">
          <div className="icon">
            <img src={this.props.img} />
          </div>
          <label>{this.props.box_title}</label>
        </div>
        <div className="col s12 body">
          {this.props.box_title == "Configurations" ? (
            <div key="id" className="line col s12">
              <div className="col s12">
                <div className="col s5">
                  <div className="name-value">device id</div>
                  <div className="value-label">Name</div>
                </div>
                <div className="col s7" >
                  <div className="value-value">{this.props.device.id}</div>
                  <div className="value-label">STRING</div>
                </div>              
              </div>
            </div>
          ):("")}
          {this.props.attrs.map(attr => (
            <div key={attr.label} className="line col s12">
              {/*<div className="col s4">
                <div className="name-value">{attr.label}</div>
                <div className="value-label">Name</div>
              </div>*/}
              <div className="col s12" >
                <div className={this.state.truncate ? "name-value col s10 truncate": "name-value col s10"} title={attr.label}>{attr.label}</div>
                <div className={this.state.truncate ? "value-value col s10 truncate": "value-value col s10"} title={attr.static_value}>{attr.static_value}</div>
                <div className="value-label col s2" title={attr.value_type} >{attr.value_type}</div>
                  {/*<div className="name-value col s12">{attr.label}</div>
                  <div className="value-label">Name</div>*/}
              </div>
              {attr.isGeo ?
                <div className="star" onClick={this.openMap}>
                    <i className={"fa " + (this.state.visible_static_map ? "fa-star" : "fa-star-o")} />
                </div> :
                null
              }
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
        return i.id !== attr.id;
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

  render() {
    console.log("Props: ", this.props);
    let lista = this.props.attrs;
    for (let index in lista)
    {
      if (this.state.visible_attributes[lista[index].id])
        lista[index].visible = true;
      else
        lista[index].visible = false;
    }

    return <div className="content-row" >
      <div className="second-col">
        {this.state.selected_attributes.length == 0 && this.props.openStaticMap == false ?
          (<div className="second-col-label center-align">Select an attribute to be displayed.</div>)
          : null
        }
        {this.props.openStaticMap ? <PositionStaticWrapper device={this.props.device} /> : null}
        {this.state.selected_attributes.map(at => (
          <Attribute key={at.id} device={this.props.device} attr={at} />
        ))}
      </div>
      <div className="third-col">
        <div className="row">
          <DynamicAttributeList device={this.props.device} attrs={lista} change_attr={this.toggleAttribute} />        
        </div>
        <div className="row">
          <ActuatorsArea actuators={this.props.actuators} />        
        </div>
      </div>
    </div>
  }
}

class ActuatorsArea extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div className=" dy_attributes">
        <div className="col s12 header">
          <div className="col s2"></div>
          <label className="col s8">Actuators</label>
        </div>
        <div className="col s12 body">
          {this.props.actuators.map(actuator => (
            <div key={actuator.label} className="line" >
              <div className="col offset-s2 s8">
                <div className="label truncate" title={actuator.label}>{actuator.label}</div>
                {/* <div className="value-label">{attr.value_type}</div> */}
              </div>
            </div>
          ))}
        </div>
      </div>;
  }
}

class DynamicAttributeList extends Component {
  constructor(props) {
    super(props);
    this.state = {truncate: false};
    this.clickAttr = this.clickAttr.bind(this);
    this.limitSizeField = this.limitSizeField.bind(this);
  }

  componentWillMount(){
    const device = this.props.device;
    for (let i in device.attrs) {
      for (let j in device.attrs[i]) {
        if(device.attrs[i][j].type !== "meta"){
          if(device.attrs[i][j].type === "dynamic"){
            if(device.attrs[i][j].value_type === "geo:point"){
                MeasureActions.fetchPosition.defer(device, device.id, device.attrs[i][j].label);
            }
          }
          MeasureActions.fetchMeasure.defer(device, device.attrs[i][j].label, 10);
        }
      }
    }

    this.limitSizeField(this.props.attrs);
  }

  clickAttr(attr)
  {
      this.props.change_attr(attr);
  }

  limitSizeField(dyAttrs){
    dyAttrs.map((dyAttr) => {
      if(dyAttr.label.length > 20){
        this.setState({truncate: true});
      }
    });
  }

  render() {

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
            <div key={attr.label} className="line" onClick={this.clickAttr.bind(this, attr)}>
              <div className="col offset-s2 s8">
                <div className={this.state.truncate ? "label truncate" : "label"} title={attr.label}>{attr.label}</div>
                {/* <div className="value-label">{attr.value_type}</div> */}
              </div>
              <div className="col s2">
                <div className="star" >
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


class AttrHistory extends Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div className="graphLarge">
        <div className="contents no-padding">
          <AltContainer store={MeasureStore}>
            <Attr device={this.props.device} type={this.props.type} attr={this.props.attr} />
          </AltContainer>
        </div>
      </div>
    );
  }
}


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

class PositionStaticWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
      hasPosition: false,
      pos: [],
      mapquest: false
    };
    this.getDevicesWithPosition = this.getDevicesWithPosition.bind(this);
    this.toogleExpand = this.toogleExpand.bind(this);
    this.mqLoaded = this.mqLoaded.bind(this);
  }

  mqLoaded(){
    this.setState({mapquest: true});
  }

  toogleExpand(state) {
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
           if(device.attrs[j][i].type === "static"){
             if(device.attrs[j][i].value_type === "geo:point"){
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

    if (this.props.device === undefined)
    {
      return (<NoData />);
    }

    let validDevices = this.getDevicesWithPosition(this.props.device);
    if (validDevices.length === 0) {
      return <NoData />;
    } else {
      return <div className={"PositionRendererDiv " + (this.state.opened ? "expanded" : "compressed")}>
          <div>
            <Script url="https://www.mapquestapi.com/sdk/leaflet/v2.s/mq-map.js?key=zvpeonXbjGkoRqVMtyQYCGVn4JQG8rd9"
                    onLoad={this.mqLoaded}>
            </Script>
          </div>
          {this.state.mapquest ?(
            <PositionRenderer devices={validDevices} allowContextMenu={false} center={validDevices[0].position} />
          ) : (
            <Loading/>
          )}
        </div>
    }
  }
}

class DeviceDetail extends Component {
  constructor(props) {
    super(props);
    this.state={openStaticMap: false}

    this.openStaticMap = this.openStaticMap.bind(this);
  }

  openStaticMap(state){
    this.setState({openStaticMap:state})
  }

  render() {
     let attr_list = [];
     let dal = [];
     let actuators = [];
     let config_list = [];
     for (let index in this.props.device.attrs)
     {
       let tmp = this.props.device.attrs[index];
       attr_list = attr_list.concat(tmp.filter(i => {
         return String(i.type) === "static";
       }));
       dal = dal.concat(tmp.filter(i => {
           i.visible = false;
           return String(i.type) === "dynamic";
         }));
        actuators = actuators.concat(tmp.filter(i => {
          i.visible = false;
          return String(i.type) === "actuator";
        }));
      config_list = config_list.concat(tmp.filter(i => {
           return String(i.type) === "meta";
         }));
     }

     for (let index in config_list) {
        if (config_list[index].label === "protocol") {
          config_list[index].static_value = config_list[index].static_value.toUpperCase();
        }
     }

     console.log("attrs: ", dal);
     return <div className="row detail-body">
         <div className="first-col">
           <Configurations device={this.props.device} attrs={config_list} />
           <StaticAttributes device={this.props.device} attrs={attr_list} openStaticMap={this.openStaticMap}/>
         </div>
        <DyAttributeArea device={this.props.device} actuators={actuators} attrs={dal} openStaticMap={this.state.openStaticMap}/>
       </div>;
  }
}


class ViewDeviceImpl extends Component {
  constructor(props) {
    super(props);

    this.remove = this.remove.bind(this);
  }

  componentWillMount(){
    const device = this.props.devices[this.props.device_id];
    if (device === undefined)
      return; //not ready

    for (let i in device.attrs) {
      for (let j in device.attrs[i]) {
        if(device.attrs[i][j].type !== "meta"){
          MeasureActions.fetchMeasure.defer(device, device.attrs[i][j].label, 10);
        }
      }
    }
  }

  remove(e) {
    // This should be on DeviceUserActions -
    // this is not good, but will have to make do because of z-index on the action header
    e.preventDefault();
    //console.log("Id: ", id);
      DeviceActions.triggerRemoval({id: this.props.device_id}, (device) => {
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

// TODO: this is an awful quick hack - this should be better scoped.
let device_detail_socket = null;

class ViewDevice extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
      DeviceActions.fetchSingle.defer(this.props.params.device);
  }

  componentDidMount(){
      // Realtime
      var socketio = require('socket.io-client');

      const target = `${window.location.protocol}//${window.location.host}`;
      const token_url = target + "/stream/socketio";

      function getWsToken() {
        util._runFetch(token_url)
          .then((reply) => {
            init(reply.token);
          })
          .catch((error) => {console.log("Failed!", error);
        });
      }

      function init(token){
        device_detail_socket = socketio(target, { query: "token=" + token, transports: ['polling'] });

        device_detail_socket.on('all', function(data){
          MeasureActions.appendMeasures(data);
        });

        device_detail_socket.on('error', (data) => {
          console.log("socket error", data);
          device_detail_socket.close();
          getWsToken();
        })
      }

      getWsToken();
  }

  componentWillUnmount(){
    device_detail_socket.close();
  }

  render() {
    return (
      <div className="full-width full-height">
        <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true}
          transitionAppearTimeout={500}
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500} >
          <AltContainer store={DeviceStore}>
            <ViewDeviceImpl device_id={this.props.params.device} />
          </AltContainer>
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

export { ViewDevice };
