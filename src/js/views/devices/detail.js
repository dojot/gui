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

import { Line } from 'react-chartjs-2';
import { PositionRenderer } from './DeviceMap.js'
import MaterialSelect from "../../components/MaterialSelect";

import io from 'socket.io-client';

class DeviceUserActions extends Component {
  render() {
    return (
      <div>
        <Link to={"/device/id/" + this.props.deviceid + "/edit"} className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1" title="Edit device">
          <i className="clickable fa fa-pencil" />
        </Link>
        <a className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1" title="Remove device"
           onClick={(e) => {e.preventDefault(); $('#' + this.props.confirmTarget).modal('open');}}>
          <i className="clickable fa fa-trash"/>
        </a>
        <Link to={"/device/list"} className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1" title="Return to device list">
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
      if (val_type == "string" && tuple.attrType != "string") {
        if (tuple.attrValue.trim().length > 0) {
          if (tuple.attrType.toLowerCase() == 'integer') {
            return parseInt(tuple.attrValue);
          } else if (tuple.attrType.toLowerCase() == 'float'){
            return parseFloat(tuple.attrValue);
          }
        }
      } else if (val_type == "number") {
        return tuple.attrValue;
      }

      return undefined;
    }
    //
    // if (this.props.data == undefined) {
    //   return (<NoData />);
    // }
    this.props.data.data[this.props.attr].map((i) => {
      labels.push(util.iso_to_date(i.ts));
      values.push(i.value);
    })

    if (values.length == 0) {
      return (
        <div className="valign-wrapper full-height background-info no-data-av">
          <div className="full-width center">No data available</div>
        </div>
      )
    }

    let filteredLabels = labels.map((i,k) => {
      if ((k == 0) || (k == values.length - 1)) {
        return i;
      } else {
        return "";
      }
    })

    const data = {
      labels: labels,
      xLabels: filteredLabels,
      datasets: [
        {
          label: 'Device data',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: values
        }
      ]
    }

    const options = {
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        xAxes: [{ display: false }]
      },
      layout: {
        padding: { left: 10, right: 10 }
      }
    }

    return (
      <Line data={data} options={options}/>
    )
  }
}


// TODO move this to its own component
function HistoryList(props) {
  const empty = (
    <div className="full-height background-info valign-wrapper center">
      <div className="center full-width">No data available</div>
    </div>
  );

  if (props.data && props.data.data && props.data.data[props.attr]){
    let data = props.data.data[props.attr];
    let trimmedList = data.filter((i) => {
      return i.value.trim().length > 0
    })
    trimmedList.reverse();

    if (trimmedList.length > 0) {
      return (
        <div className="relative full-height" >
          <div className="full-height full-width scrollable history-list">
            {trimmedList.map((i,k) => {
              return (<div className={"row " + (k % 2 ? "alt-row" : "")} key={i.ts}>
                <div className="col s7 value">{i.value}</div>
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
    'geo:point': HistoryList,
    'default': HistoryList
  }

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

  componentDidMount() {
    MeasureActions.fetchMeasure(this.props.device, [this.props.attr], 250);
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
    MeasureActions.fetchMeasure(this.props.device.id, [attr_id], 250);
  }

  render() {
    let device = this.props.device;
    let attr = []
    if (this.state.selected !== null) {
      attr = device.attrs.filter((k) => {
        return k.name.toUpperCase() == this.state.selected.toUpperCase();
      });
    }

    let timeRange = undefined;
    if (attr[0]) {
      if (this.props.data.data.hasOwnProperty(this.state.selected)){
        if (this.props.data.data[this.state.selected].length > 0){
          const to = util.iso_to_date(this.props.data.data[this.state.selected][0]['ts']);
          let length = this.props.data.data[this.state.selected].length
          const from = util.iso_to_date(this.props.data.data[this.state.selected][length - 1]['ts']);
          timeRange = "Data from " + from + " to " + to;
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
            let active = this.state.selected && (attr.toUpperCase() == this.state.selected.toUpperCase());
            if (this.props.data && this.props.data.hasOwnProperty('data')) {
              if (this.props.data.data.hasOwnProperty(attr)){
                if (this.props.data.data[attr].length > 0){
                  data = this.props.data.data[attr][0].value;
                }
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
              <AttrHistory device={device.id} type={attr[0].type} attr={attr[0].name}/>
            </span>
          ) : (
            null
          )}
        </div>
      </div>
    )
  }
}



function StatusDisplay(props) {
  return (
    <div className="detail-box-body">
      <div className="metric">
          <span className="label">Attributes</span>
          <span className="value">{props.device.attrs.length + props.device.static_attrs.length}</span>
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
    this.state = {new_attr: ""};
    this.handleSelectedAttribute = this.handleSelectedAttribute.bind(this);
    this.handleAddAttribute = this.handleAddAttribute.bind(this);
    this.handleClear = this.handleClear.bind(this);
  }

  handleSelectedAttribute(event) {
    event.preventDefault();
    this.setState({new_attr: event.target.value});
  }

  handleAddAttribute(event) {
    event.preventDefault();
    this.setState({new_attr: ""});
    if (this.state.new_attr == ""){ return; }
    if (this.props.selected.includes(this.state.new_attr)) { return; }

    const attrList = this.props.selected.concat([this.state.new_attr]);
    this.props.onChange(attrList);
  }

  handleClear(event) {
    event.preventDefault();
    this.props.onChange([]);
  }

  render() {
    return (
      <div className="col 12 attribute-box">
        <div className="col 12 attribute-header">All Attributes</div>
        <span className="highlight">
          Showing <b>{this.props.selected.length}</b>
          of <b>{this.props.attrs.length}</b> attributes
        </span>
        <div className="col s12 p16">
          <div className="input-field col s12">
            <MaterialSelect id="attributes-select" name="attribute"
                            value={this.state.new_attr}
                            onChange={this.handleSelectedAttribute}>
              <option value="">Select attribute to display</option>
              {this.props.attrs.map((attr) => (
                <option value={attr.name} key={attr.object_id} >{attr.name}</option>
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
              <a className="waves-effect waves-light btn" id="btn-add" tabIndex="-1" title="Add">
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
      wasChecked: false,
      hasPosition: false,
      pos: []
    };

    this.hasPosition = this.hasPosition.bind(this);
  }

  hasPosition(device)
  {
      if (this.state.wasChecked)
        return;
      let position = [];
      let hasPosition = device.hasOwnProperty('position');

      if (!hasPosition) // check in static attrs
      {
        for (let j in device.static_attrs) {
          if (device.static_attrs[j].type == "geo:point"){
            let hasPosition = true;
            position = device.static_attrs[j].value.split(",");
          }
        }
      }
      else {
        position = device.position;
      }
      this.setState({wasChecked: true, hasPosition: hasPosition, pos: position});
  }


  render() {
    function NoData() {
        return (
          <div className="valign-wrapper full-height background-info">
            <div className="full-width center">No position available</div>
          </div>
        )
    }

    console.log("PositionWrapper:", device);
    let device = this.props.devices[this.props.device_id];
    this.hasPosition(device);
    if (!this.state.hasPosition)
    {
      return (<NoData />);
    }
    device.position = this.state.pos;

    // let pos = this.props.value.attrValue;
    // let parsed = pos.match(/^([+-]?\d+(\.\d+)?)\s*[,]\s*([+-]?\d+(\.\d+)?)$/)
    // const position = [parseFloat(parsed[1]),parseFloat(parsed[3])];
    // if (position[0] == 0 && position[1] == 0) {
      // return (<NoData />)
    // }
    return (
      <PositionRenderer devices={[device]} allowContextMenu={false} center={this.state.pos}/>
    )
  }
}

// TODO do this properly, using props.children
function HeaderWrapper(props) {
  const device = props.devices[props.device_id];
  let location = "";
  if (device.position !== undefined) {
    // location = "Lat: "+device.position[0].toFixed(6)+" Lng: "+device.position[1].toFixed(6);
    location = device.position;
  }
  return (
    <StatusDisplay location={location} device={device} />
  )
}

class DeviceDetail extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selected_attributes: [
        "ts",
        "temperature",
        'sinr'
      ]
    }

    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    MeasureActions.fetchMeasure.defer(this.props.deviceid,this.state.selected_attributes,1);
  }

  onChange(attrs) {
    MeasureActions.fetchMeasure.defer(this.props.deviceid,attrs,1);
    this.setState({selected_attributes: attrs});
  }

  render() {
    const device = this.props.devices[this.props.deviceid];

    return (
      <div className="row detail-body">
        <div className="col s3 detail-box full-height">
          <div className="detail-box-header">General</div>
          <AltContainer store={DeviceStore} >
            <HeaderWrapper device_id={this.props.deviceid} />
          </AltContainer>
          <AttrSelector attrs={device.attrs}
                        selected={this.state.selected_attributes}
                        onChange={this.onChange} />
        </div>
        <div className="col s9 device-map full-height">
          <div className="col s12 device-map-box">
            <AltContainer store={DeviceStore} >
              <PositionWrapper device_id={this.props.deviceid}/>
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
  if (status == "online") {
    return (
      <span className='status-on-off clr-green'><i className="fa fa-info-circle" />Online</span>
    )
  }

  return (
    <span className='status-on-off clr-red'><i className="fa fa-info-circle" />Offline</span>
  )
}

class ViewDeviceImpl extends Component {
  render() {
    let title = "View device";

    let device = undefined;
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
            <DeviceUserActions deviceid={device.id} confirmTarget="confirmDiag"/>
          </div>
          <div className="box-sh">
            <AltContainer store={DeviceStore}>
              <ConnectivityStatus device_id={device.id} />
            </AltContainer>
          </div>
        </NewPageHeader>
        <DeviceDetail deviceid={device.id} devices={this.props.devices}/>
      </div>
    )
  }
}

class ViewDevice extends Component {
  constructor(props) {
    super(props);
    this.remove = this.remove.bind(this);
  }

  componentDidMount() {
    DeviceActions.fetchSingle.defer(this.props.params.device);

    const options = {transports: ['websocket']};
    this.io = io(window.location.host, options);
    this.io.on(this.props.params.device, function(data) {
      MeasureActions.appendMeasures(data);

      const fields = ['ts', 'temperature', 'sinr'];
      let device_data = {device_id: data.device_id};
      device_data.position = [data.lat.value, data.lng.value]
      fields.map((field) => {
        if (data.hasOwnProperty(field)){
          if (field == 'ts') {
            device_data[field] = util.timestamp_to_date(Date.now());
          } else {
            device_data[field] = data[field].value;
          }
        }
      })
      MeasureActions.updatePosition(device_data);
    });
  }

  componentWillUnmount() {
    this.io.close();
  }

  remove(e) {
    // This should be on DeviceUserActions -
    // this is not good, but will have to make do because of z-index on the action header
    e.preventDefault();
      DeviceActions.triggerRemoval({id: this.props.params.device}, (device) => {
      hashHistory.push('/device/list');
      Materialize.toast('Device removed', 4000);
    });
  }

  render() {
    return (
      <div className="full-width full-height">
        <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true} transitionAppearTimeout={500}
          transitionEnterTimeout={500} transitionLeaveTimeout={500} >
          <AltContainer store={DeviceMeta} >
            <ViewDeviceImpl device_id={this.props.params.device}/>
          </AltContainer>
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}

export { ViewDevice };
