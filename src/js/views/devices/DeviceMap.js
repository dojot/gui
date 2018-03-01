import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import deviceManager from '../../comms/devices/DeviceManager';

import util from "../../comms/util/util";
import DeviceStore from '../../stores/DeviceStore';
// import DeviceActions from '../../actions/DeviceActions';
// import TemplateStore from '../../stores/TemplateStore';
// import TemplateActions from '../../actions/TemplateActions';
import MeasureStore from '../../stores/MeasureStore';
import MeasureActions from '../../actions/MeasureActions';
import TrackingActions from '../../actions/TrackingActions';

import AltContainer from 'alt-container';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'
import { Line } from 'react-chartjs-2';
import { Map, Marker, Popup, TileLayer, Tooltip, ScaleControl, Polyline } from 'react-leaflet';
import Script from 'react-load-script';

import ReactResizeDetector from 'react-resize-detector';
import Sidebar from '../../components/DeviceRightSidebar';
import { DojotBtnLink } from "../../components/DojotButton";

import io from 'socket.io-client';


var redPin = L.divIcon({className: 'icon-marker bg-red'});
var selectedPin = L.icon({
  iconUrl: 'images/mapMarker.png',
  iconSize: [40, 40]
});

class PositionRenderer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,  // is ctxMenu visible?
      selected_device_id : -1,
      isTerrain: true,
      selectedPin: true,
      center: (this.props.center ? this.props.center : [-21.277057, -47.9590129]),
      zoom: (this.props.zoom ? this.props.zoom :7.2)
    }

    this.setTiles = this.setTiles.bind(this);
    this.handleTracking = this.handleTracking.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
  }

  componentDidMount() {
  if (this.leafletMap !== undefined) {

    console.log('will attempt to add layer', MQ.mapLayer, this.leafletMap);
    // mq = require('..//../external/mq-map.js');

    let mapLayer = MQ.mapLayer();
    mapLayer.addTo(this.leafletMap.leafletElement);

    L.control.layers({
      'Map': MQ.mapLayer(),
      'Hibrid': MQ.hybridLayer(),
      'Satellite': MQ.satelliteLayer()
    }).addTo(this.leafletMap.leafletElement);
  }
}

  handleTracking(device_id) {
    this.props.toggleTracking(device_id);

    // closing ctxMenu
    this.setState({ visible: false });
  }

  // context menu based at
  // https://codepen.io/devhamsters/pen/yMProm
  handleContextMenu(e, device_id) {
    if (!this.props.allowContextMenu){
      return false;
    }
    let event = e.originalEvent;
    event.preventDefault();
    this.setState({ visible: true , selected_device_id: device_id});

    // this.refs.map.leafletElement.locate()
    const clickX = event.clientX;
    const clickY = event.clientY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const rootW = this.root.offsetWidth;
    const rootH = this.root.offsetHeight;

    const right = (screenW - clickX) > rootW;
    const left = !right;
    const top = (screenH - clickY) > rootH;
    const bottom = !top;
    if (right)
      this.root.style.left = `${clickX + 5}px`;
    if (left)
        this.root.style.left = `${clickX - rootW - 5}px`;
    if (top)
        this.root.style.top = `${clickY + 5}px`;
    if (bottom)
        this.root.style.top = `${clickY - rootH - 5}px`;

  };

  resize() {
    if (this.leafletMap !== undefined) {
      this.leafletMap.leafletElement.invalidateSize();
    }
  }

  setTiles(isMap) {
    this.setState({isTerrain: isMap});
  }

  render() {
    function getPin(device){
      if(!device.select == true){
        return redPin;
      } else {
        return selectedPin;
      }
    }

    let parsedEntries = this.props.devices.reduce((result,k) => {
        if (k.position !== undefined){
          result.push({
            id: k.id,
            pos: k.position,
            name: k.label,
            pin: getPin(k),
            key: (k.unique_key ? k.unique_key : k.id)
          });
        }

      return result;
    }, []);

    const contextMenu = this.state.visible ? (
      <div ref={ref => {this.root = ref}} className="contextMenu">
          <Link to={"/device/id/" + this.state.selected_device_id + "/detail"} title="View details">
            <div className="contextMenu--option cmenu">
              <i className="fa fa-info-circle" />Details
            </div>
          </Link>
          <div className="contextMenu--option cmenu"
               onClick={() => {this.handleTracking(this.state.selected_device_id)}}>
            <img src='images/icons/location.png' />Toggle tracking
          </div>
      </div>
    ) : (
      null
    )

    //const tileURL = this.state.isTerrain ? (
    //  'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY2ZyYW5jaXNjbyIsImEiOiJjajhrN3VlYmowYXNpMndzN2o2OWY1MGEwIn0.xPCJwpMTrID9uOgPGK8ntg'
    //) : (
    //  'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZm1lc3NpYXMiLCJhIjoiY2o4dnZ1ZHdhMWg5azMycDhncjdqMTg1eiJ9.Y75W4n6dTd9DOpctpizPrQ'
    //)
    //const attribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> and Mapbox contributors';

    return (
      <Map center={this.state.center}
           zoom={this.state.zoom}
           ref={m => {this.leafletMap = m;}}>

        {contextMenu}
        <ReactResizeDetector handleWidth onResize={this.resize.bind(this)} />
        <div className="mapOptions col s12">
          {/*<div className="mapView" onClick = {() => this.setTiles(true)}>Terrain</div>
          <div className="satelliteView" onClick = {() => this.setTiles(false)}>Satellite</div>*/}
        </div>
        {parsedEntries.map((k) => {
        return (
          <Marker
            onContextMenu={(e) => { this.handleContextMenu(e, k.id); }}
            onClick={(e) => { this.handleContextMenu(e, k.id); }}
            position={k.pos} key={k.key} icon={k.pin}>
            <Tooltip>
              <span>{k.id} : {k.name}</span>
            </Tooltip>
          </Marker>
        )})}
        <ScaleControl />
      </Map>
    )
  }
}

class DeviceMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDisplayList: true,
      filter: '',
      displayMap:{},
      selectedDevice:{},
      templates_id: {},
      listOfDevices: [],
      mapquest: false
    };

    this.handleViewChange = this.handleViewChange.bind(this);
    this.applyFiltering = this.applyFiltering.bind(this);
    //this.shouldShow = this.shouldShow.bind(this);
    this.showSelected = this.showSelected.bind(this);
    this.selectedDevice = this.selectedDevice.bind(this);
    this.getDevicesWithPosition = this.getDevicesWithPosition.bind(this);

    this.toggleTracking = this.toggleTracking.bind(this);

    this.showAll = this.showAll.bind(this);
    this.hideAll = this.hideAll.bind(this);
    this.toggleDisplay = this.toggleDisplay.bind(this);

    this.mqLoaded = this.mqLoaded.bind(this);
    //this.setDisplay = this.setDisplay.bind(this);
    //this.setDisplayMap = this.setDisplayMap.bind(this);
  }

  //setDisplay(device, status) {
  //  let displayMap = this.state.displayMap;
  //  displayMap[device] = status;
  //  this.setState({displayMap: displayMap});
  //}

  //setDisplayMap(displayMap) {
  //  this.setState({displayMap: displayMap});
  //}

  componentDidMount() {
    const options = {
      transports: ['websocket']
    }
    this.io = io(window.location.host, options);
    this.io.on('gps', function(data) {
      data.position = [data.lat, data.lng]
      delete data.lat;
      delete data.lng;
      MeasureActions.updatePosition(data);
    });

    // initially, shows all devices;
    this.showAll();
   }

  componentWillUnmount() {
    this.io.close();
  }

  mqLoaded(){
    this.setState({mapquest: true});
  }

  handleViewChange(event) {
    this.setState({isDisplayList: ! this.state.isDisplayList})
  }

  selectedDevice(device){
    let selectedDevice = this.state.selectedDevice;
    if (selectedDevice.hasOwnProperty(device)) {
      selectedDevice[device] = !selectedDevice[device];
    } else {
      selectedDevice[device] = true;
    }
    this.setState({selectedDevice: selectedDevice});
  }

  hideAll(){
    let displayMap = this.state.displayMap;
    for(let k in this.props.devices){
      let device = this.props.devices[k];
      displayMap[device.id] = false;
    }
    this.setState({displayMap:displayMap});
  }

  showAll(){
  // TODO filter using user queries
    let displayMap = this.state.displayMap;
    for(let k in this.props.devices){
      let device = this.props.devices[k];
      displayMap[device.id] = true;
    }
    this.setState({displayMap:displayMap});
  }

  applyFiltering(devices) {
    let list = [];
    for (let k in devices) {
      if (this.state.displayMap[devices[k].id]){
        list.push(devices[k]);
      }
    }
    list.sort((a,b) => {
      if (a.updated > b.updated) {
        return 1;
      } else {
        return -1;
      }
    })
    return list;
  }

  //shouldShow(device) {
  //  if (this.state.displayMap.hasOwnProperty(device)) {
  //    return this.state.displayMap[device];
  //  }
  //  return true;
  //}

  toggleTracking(device_id) {
    if(!this.props.tracking.hasOwnProperty(device_id)){
      for(let k in this.props.devices[device_id].attrs){
        for(let j in this.props.devices[device_id].attrs[k]){
          if(this.props.devices[device_id].attrs[k][j].value_type == "geo:point"){
            TrackingActions.fetch(device_id, this.props.devices[device_id].attrs[k][j].label);
          }
        }
      }
    } else{
      TrackingActions.dismiss(device_id);
    }
  }

  showSelected(device){
    if(this.state.selectedDevice.hasOwnProperty(device)){
      return this.state.selectedDevice[device];
    }
    return false;
  }

  toggleDisplay(device){
    let displayMap = this.state.displayMap;
    if (displayMap.hasOwnProperty(device)) {
      displayMap[device] = !displayMap[device];
    } else {
      displayMap[device] = false;
    }
    this.setState({displayMap: displayMap});
  }

  getDevicesWithPosition(devices){
    function parserPosition(position){
      let parsedPosition = position.split(", ");
      return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
    }

    let validDevices = [];
    //console.log("deviceS: ", devices);
    for(let k in devices){
      for(let j in devices[k].attrs){
        for(let i in devices[k].attrs[j]){
          if(devices[k].attrs[j][i].type == "static"){
            if(devices[k].attrs[j][i].value_type == "geo:point"){
              devices[k].position = parserPosition(devices[k].attrs[j][i].static_value);
            }
          }
        }
      }

      devices[k].select = this.showSelected(k);
      if(devices[k].position !== null && devices[k].position !== undefined){
        validDevices.push(devices[k]);
      }
    }
    return validDevices;
  }

  render() {

    let validDevices = this.getDevicesWithPosition(this.props.devices);
    let filteredList = this.applyFiltering(validDevices);

    const device_icon  = (<img src='images/icons/chip.png' />);
    const displayDevicesCount = "Showing " +  validDevices.length + " device(s)";

    let pointList = [];
    if(filteredList !== undefined && filteredList !== null){
      for(let k in filteredList){
        if(filteredList.hasOwnProperty(k)){
          let device = filteredList[k];
          device.hasPosition = device.hasOwnProperty('position');
          if(this.props.tracking.hasOwnProperty(filteredList[k].id) && (!device.hide)){
            pointList = pointList.concat(this.props.tracking[filteredList[k].id].map((e,k) => {
              let updated = e;
              updated.id = device.id;
              updated.unique_key = device.id + "_" + k;
              updated.label = device.label;
              return updated;
            }));
          }
          pointList.push(device);
        }
      }
    }

    return <div className="fix-map-bug">
        <div className="row z-depth-2 devicesSubHeader p0" id="inner-header">
          <div className="col s4 m4 main-title">Map Visualization</div>
          <div className="col s8 m8 header-info hide-on-small-only">
            <div className="title"># Devices</div>
            <div className="subtitle">{displayDevicesCount}</div>
          </div>
        </div>
      <div className="flex-wrapper">
        <div className="deviceMapCanvas deviceMapCanvas-map col m12 s12 relative">
          <Script url="https://www.mapquestapi.com/sdk/leaflet/v2.s/mq-map.js?key=zvpeonXbjGkoRqVMtyQYCGVn4JQG8rd9"
                  onLoad={this.mqLoaded}>
          </Script>
          {this.state.mapquest ? (
            <PositionRenderer devices={pointList} toggleTracking={this.toggleTracking} allowContextMenu={true}/>
          ) : (
            <div>loading</div>
          )}
          <Sidebar devices={validDevices} hideAll={this.hideAll} showAll={this.showAll} selectedDevice={this.selectedDevice} toggleDisplay={this.toggleDisplay} />
        </div>
      </div>
      </div>;
  }
}

export { DeviceMap, PositionRenderer };
