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
import {Loading} from "../../components/Loading";

import {ConfirmModal} from "../../components/ConfirmModal";

import { Line } from 'react-chartjs-2';
import { PositionRenderer } from './DeviceMap.js'
import { MapWrapper } from './Devices.js'
import MaterialSelect from "../../components/MaterialSelect";

import io from 'socket.io-client';

class DeviceUserActions extends Component {
  constructor(props) {
    super(props);

    this.handleModal = this.handleModal.bind(this);
  }

  handleModal(){
    this.props.openModal(true);
  }
  render() {
    return (
      <div>
        <Link to={"/device/id/" + this.props.deviceid + "/edit"} className="waves-effect waves-light btn-flat edit-btn-flat" tabIndex="-1" title="Edit device">
          <i className="clickable fa fa-pencil" />
        </Link>
        <a className="waves-effect waves-light btn-flat remove-btn-flat" tabIndex="-1" title="Remove device" onClick={this.handleModal}>
          <i className="clickable fa fa-trash"/>
        </a>
        <Link to={"/device/list"} className="waves-effect waves-light btn-flat return-btn-flat" tabIndex="-1" title="Return to device list" >
          <i className="clickable fa fa-arrow-left" />
        </Link>
      </div>
    )
  }
}

// TODO move this to its own component
class Graph extends Component{
  constructor(props) {
    super(props);
  }

  render() {
    let labels = [];
    let values = [];

    function getValue(tuple) {
      let val_type = typeof tuple.attrValue;
      if (val_type === "string" && tuple.attrType !== "string") {
        if (tuple.attrValue.trim().length > 0) {
          if (tuple.attrType.toLowerCase() === 'integer') {
            return parseInt(tuple.attrValue);
          } else if (tuple.attrType.toLowerCase() === 'float'){
            return parseFloat(tuple.attrValue);
          }
        }
      } else if (val_type === "number") {
        return tuple.attrValue;
      }

      return undefined;
    }

    this.props.data.value.map((i) => {
      labels.push(util.iso_to_date(i.ts));
      values.push(i.trim());
    })

    if (values.length === 0) {
      return (
        <div className="valign-wrapper full-height background-info no-data-av">
          <div className="full-width center">No data available</div>
        </div>
      )
    }

    let filteredLabels = labels.map((i,k) => {
      if ((k === 0) || (k === values.length - 1)) {
        return i;
      } else {
        return "";
      }
    });

    const data = {
      labels: labels,
      xLabels: filteredLabels,
      datasets: [
        {
          label: 'Device data',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(235,87,87,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(235,87,87,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(235,87,87,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: values
        }
      ]
    };

    const options = {
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        xAxes: [{ display: false }]
      },
      layout: {
        padding: { left: 10, right: 10 }
      }
    };

    return (
      <Line data={data} options={options}/>
    )
  }
}


// TODO move this to its own component
function HistoryList(props) {
  const empty = (
    <div className="full-height background-info valign-wrapper no-data-av">
      <div className="center full-width">No data available</div>
    </div>
  );

  // handle values
  let value = []
  for(let k in props.device.value){
     value[k] = props.device.value[k];
  }


  if (value){
    let data = value;
    let trimmedList = data.filter((i) => {
      return i.trim().length > 0
    })

    trimmedList.reverse();

    if (trimmedList.length > 0) {
      return (
        <div className="relative full-height" >
          <div className="full-height full-width scrollable history-list">
            {trimmedList.map((i,k) => {
              return (<div className={"row " + (k % 2 ? "alt-row" : "")} key={i.ts}>
                <div className="col s7 value">{i}</div>
                <div className="col s5 label">{util.iso_to_date(i.ts)}</div>
              </div>
            )})}
          </div>
        </div>
      )
    }
  }
  return empty;
}


// TODO move this to its own component
function Attr(props) {
  const known = {
    'integer': Graph,
    'float': Graph,
    'string': HistoryList,
    'geo': HistoryList,
    'default': HistoryList
  };

  const Renderer = props.type in known ? known[props.type] : known['default'];
  return (
    <Renderer {...props} />
  )
}


class AttributeSelector extends Component {
  render() {
    const outerClass = this.props.active ? " active" : "";
    return (
      <div className={"col s12 p0 attr-line" + outerClass}>
        <a className="waves-effect waves-light"
           onClick={() => {this.props.onClick(this.props.label)}} >
          <span className="attr-name">{this.props.label}</span>
          {this.props.currentValue ? (
            <span>Last received value: {this.props.currentValue}</span>
          ) : (
            <span>No data available to display</span>
          )}
        </a>
      </div>
    )
  }
}

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

class AttributeBox extends Component {
  constructor(props) {
    super(props);
    this.state = {selected: null};
    this.changeAttribute = this.changeAttribute.bind(this);
  }

  changeAttribute(attr_id) {
    this.setState({selected: attr_id});
    MeasureActions.fetchMeasure(this.props.device, this.props.device.id, this.props.device.templates, attr_id, 250);
  }

  render() {
    let device = this.props.device;
    let attr = [];

    if (this.state.selected !== null) {
      attr = device.attrs[device.templates].filter((k) => {
        return k.label.toUpperCase() == this.state.selected.toUpperCase();
      });
    }

    let timeRange = undefined;

    /*
    * Maybe it's better to talk about time range. Think about the best way to show this value
    * or even if it's necessary to show this value.
    */
    if(attr[0]){
      for(let k in this.props.data.attrs[device.templates]){
        if(this.props.data.attrs[device.templates][k].label == this.state.selected){
          if(this.props.data.value.length !== 0){
            let length = this.props.data.value.length;
            const from = util.iso_to_date(this.props.data.value[length - 1]['ts']);
            timeRange = "Data from " + from;
            //const to = util.iso_to_date(this.props.data.value['ts']);
          }
        }
      }
    }


    return (
      <div className="col s12 p0 full-height">
        <div className="col s5 card-box">
          <div className="detail-box-header">Attributes</div>
          <div className='col s12 attr-box-body'>
          {this.props.attrs.map((attr) => {
            let data = undefined;
            let active = this.state.selected && (attr.toUpperCase() === this.state.selected.toUpperCase());
            if (this.props.data && this.props.data.hasOwnProperty('value')) {
                if (this.props.data.value.length > 0){
                  data = this.props.data.value[this.props.data.value.length - 1];
                }
            }
            return (
              <AttributeSelector label={attr} key={attr}
                                 currentValue={data}
                                 active={active}
                                 onClick={this.changeAttribute} />
          )})}
          </div>
        </div>
        <div className="col s7 graph-box">
          {attr[0] !== undefined ? (
            <span>
              <div className='col s12 legend'>{timeRange}</div>
              <AttrHistory device={device} type={attr[0].value_type} attr={attr[0].label}/>
            </span>
          ) : (
            null
          )}
        </div>
      </div>
    )
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

class AttrSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {attributes: [], new_attr: ""};
    this.handleSelectedAttribute = this.handleSelectedAttribute.bind(this);
    this.handleAddAttribute = this.handleAddAttribute.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.getAttrList = this.getAttrList.bind(this);
  }

  componentWillMount(){
    let attrs = [];
    console.log("this.props.device", this.props.device);
    for (let index in this.props.device.attrs) {
      attrs = attrs.concat(this.props.device.attrs[index]);
    }
     this.setState({ attributes: attrs });
    console.log("Attr list", attrs);
  }

  handleSelectedAttribute(event) {
    event.preventDefault();
    this.setState({new_attr: event.target.value});
  }

  handleAddAttribute(event) {
    event.preventDefault();
    this.setState({new_attr: ""});
    if (this.state.new_attr === ""){ return; }
    if (this.props.selected.includes(this.state.new_attr)) { return; }

    const attrList = this.props.selected.concat([this.state.new_attr]);
    this.props.onChange(attrList);
  }

  handleClear(event) {
    event.preventDefault();
    this.props.onChange([]);
  }

  getAttrList(attributes) {
    let attrList = [];
    for (let templateID in attributes) {
      for (let attributeID in attributes[templateID]) {
        attrList.push(attributes[templateID][attributeID]);
      }
    }
    return attrList;
  }

  render() {

    console.log("Checking props ",this.props);
    return (
      <div className="col 12 attribute-box">
        <div className="col 12 attribute-header">All Attributes</div>
        <span className="highlight">
          Showing <b> {this.props.selected.length} </b>
          of <b> {this.state.attributes.length} </b> attributes
        </span>
        <div className="col s12 p16">
          <div className="input-field col s12">
            <MaterialSelect id="attributes-select" style="color: #D23F3F;" name="attribute"
                            value={this.state.new_attr}
                            onChange={this.handleSelectedAttribute}>
              <option value="">Select attribute to display</option>
                {this.getAttrList(this.props.attrs).map((attr) => (
                    <option value={attr.label} key={attr.id}>{attr.label}</option>
                ))}

            </MaterialSelect>
          </div>
          <div className="col s12 actions-buttons">
            <div className="col s6 button ta-center">
              <a className="waves-effect waves-light btn btn-light" id="btn-clear" tabIndex="-1"
                 title="Clear" onClick={this.handleClear}>
                Clear
              </a>
            </div>
            <div className="col s6 button ta-center" type="submit" onClick={this.handleAddAttribute}>
              <a className="waves-effect waves-light btn red lighten-1" id="btn-add" tabIndex="-1" title="Add">
                <i className="clickable fa fa-plus"/>
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}


class PositionWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasPosition: false,
      pos: []
    };
  }

  render() {
    function NoData() {
        return (
          <div className="valign-wrapper full-height background-info">
            <div className="full-width center">No position available</div>
          </div>
        )
    }

    let device = this.props.device;

    for (let k in device.attrs){
      if(device.attrs[k][0].type == 'static'){
        device.position = device.attrs[k][0].static_value.split(", ");
      }
    }

    if (!device.hasOwnProperty('position') || device.position == null)
    {
      return (<NoData />);
    } else {
      return (<PositionRenderer devices={[device]} allowContextMenu={false} center={device.position} />)
    }
  }
}


class HeaderWrapper extends Component {
  constructor(props){
    super(props);

    this.state = {
      device: [],
    };
  }

  componentWillMount(){
    this.setState({device: this.props.device});
  }

  componentWillUnmount(){
    delete this.state.device;
  }

  render(){
    const device = this.state.device;
    let location = "";

    if (this.state,device.position !== undefined && this.state.device.position !== null) {
          location = "Lat: "+this.state.device.position[0]+", Lng: "+this.state.device.position[1];
      }

    return (
      <StatusDisplay location={location} device={device} />
    )
  }
}

class DeviceDetail extends Component {
  constructor(props) {
    super(props);

    this.state = {
      device: [0],
      selected_attributes: [
        //"ts",
        //"temperature",
        //'sinr'
      ]
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(attrs) {
    MeasureActions.fetchMeasure.defer(this.props.deviceid,this.props.devices[this.props.deviceid].templates, attrs, 1);
    this.setState({selected_attributes: attrs});
  }

  componentWillMount(){
    this.setState({device: this.props.devices[this.props.deviceid]});
  }

  componentWillUnmount(){
    delete this.state.device;
  }

  render() {
    const device = this.state.device;

     return (
      <div className="row detail-body">
        <div className="col s3 detail-box full-height">
          <div className="detail-box-header">General</div>
            <HeaderWrapper device={device} />
          <AttrSelector device = {device}
                        attrs={device.attrs}
                        selected={this.state.selected_attributes}
                        onChange={this.onChange} />
        </div>
        <div className="col s9 device-map full-height">
          <div className="col s12 device-map-box">
            <AltContainer store={MeasureStore} >
              <PositionWrapper device={device}/>
            </AltContainer>
          </div>
          <div className="col s12 p0 data-box full-height">
            <AltContainer store={MeasureStore} inject={{device: device}}>
              <AttributeBox attrs={this.state.selected_attributes}/>
            </AltContainer>
          </div>
        </div>
      </div>
    )
  }
}

function ConnectivityStatus(props) {
  const status = props.devices[props.device_id]['_status'];
  if (status === "online") {
    return (
      <span className='status-on-off clr-green'><i className="fa fa-info-circle" />Online</span>
    )
  }

  return (
    <span className='status-on-off clr-red'><i className="fa fa-info-circle" />Offline</span>
  )
}

class ViewDeviceImpl extends Component {
  constructor(props) {
    super(props);
    this.state={show_modal: false};

    this.remove = this.remove.bind(this);
    this.openModal = this.openModal.bind(this);
  }

  componentDidMount(){
    const device = this.props.devices[this.props.device_id];
    if (device == undefined)
      return; //not ready

    for (let i in device.attrs) {
      for (let j in device.attrs[i]) {
        if (device.attrs[i][j].value_type == "geo:point") {
          MeasureActions.fetchPosition.defer(device, device.id, device.templates, device.attrs[i][j].label);
        }
      }
    }

    let devices = this.props.devices;
    for(let k in devices){
      for(let j in devices[k].attrs){
        for(let i in devices[k].attrs[j]){
          MeasureActions.fetchMeasure.defer(devices[k], devices[k].id, devices[k].templates, devices[k].attrs[j][i].label, 10);
        }
      }
    }
  }

  openModal(status){
    this.setState({show_modal: status});
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
          <div className="box-sh box-sh-2">
            <label> Viewing Device </label> <div className="device_name">{device.label}</div>
          </div>
          <div className="box-sh">
            <DeviceUserActions devices={this.props.devices} deviceid={device.id} confirmTarget="confirmDiag" openModal={this.openModal}/>
          </div>
          <div className="box-sh">
            <AltContainer store={DeviceStore}>
              <ConnectivityStatus device_id={device.id} />
            </AltContainer>
          </div>
          {(this.state.show_modal) ? (
            <ConfirmModal openModal={this.openModal} name={"device"} remove={this.remove}/>
          ) : (
            <div></div>
          )}
        </NewPageHeader>
        <DeviceDetail deviceid={device.id} devices={this.props.devices}/>
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

  componentDidMount() {
    const options = { transports: ["websocket"] };
    this.io = io(window.location.host, options);
    this.io.on(this.props.params.device, function(data) {
      MeasureActions.appendMeasures(data);

      const fields = ["ts", "temperature", "sinr"];
      let device_data = { device_id: data.device_id };
      device_data.position = [data.lat.value, data.lng.value];
      fields.map(field => {
        if (data.hasOwnProperty(field)) {
          if (field === "ts") {
            device_data[field] = util.timestamp_to_date(Date.now());
          } else {
            device_data[field] = data[field].value;
          }
        }
      });
      MeasureActions.updatePosition(device_data);
    });
  }

  componentWillUnmount() {
    this.io.close();
  }

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
