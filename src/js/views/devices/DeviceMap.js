import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import deviceManager from '../../comms/devices/DeviceManager';
import util from "../../comms/util/util";
import DeviceStore from '../../stores/DeviceStore';
import DeviceActions from '../../actions/DeviceActions';
import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';
import MeasureStore from '../../stores/MeasureStore';
import MeasureActions from '../../actions/MeasureActions';

import AltContainer from 'alt-container';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'
import { Line } from 'react-chartjs-2';
import { Map, Marker, Popup, TileLayer, Tooltip, ScaleControl } from 'react-leaflet';
import ReactResizeDetector from 'react-resize-detector';
import Sidebar from '../../components/DeviceRightSidebar';


class PositionRenderer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,  // is ctxMenu visible?
      selected_device_id : -1,
      isTerrain: true,
      selectedPin: true,
      center: (this.props.center ? this.props.center : [-21.277057924195354, -47.9590129852295]),
      zoom: (this.props.zoom ? this.props.zoom : 13)
    }

    this.setTiles = this.setTiles.bind(this);
  }

  setTiles(isMap) {
    this.setState({isTerrain: isMap});
  }

  render() {

    var selectedPin = L.icon({
      iconUrl: 'images/mapMarker.png',
      iconSize: [40, 40]
    });

    var defaultPin = L.icon({
      iconUrl: 'images/defaultMapMarker.png',
      iconSize: [30, 30]
    });

    function getPin(device){
      if(device.select == true){
        return selectedPin;
      } else {
        return defaultPin;
      }
    }

    let parsedEntries = this.props.devices.reduce((result,k) => {
      console.log("device : ", k.static_attrs[0].value, k.position);
      if(!k.hide){
        result.push({
          id: k.id,
          type: k.static_attrs[0].type,
          pos: (k.position != undefined ? k.position : k.static_attrs[0].value.split(",") ),
          name: k.label,
          pin: getPin(k),
          key: (k.unique_key ? k.unique_key : k.id)
        });
      }
      return result;
    }, []);


    const mapCenter = [-23.5420, -46.6370];

    const tileURL = this.state.isTerrain ? (
      'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY2ZyYW5jaXNjbyIsImEiOiJjajhrN3VlYmowYXNpMndzN2o2OWY1MGEwIn0.xPCJwpMTrID9uOgPGK8ntg'
    ) : (
      'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZm1lc3NpYXMiLCJhIjoiY2o4dnZ1ZHdhMWg5azMycDhncjdqMTg1eiJ9.Y75W4n6dTd9DOpctpizPrQ'
    )
    const attribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> and Mapbox contributors';

    return (
      <Map center={mapCenter} zoom={7}>
        <TileLayer
          url={tileURL}
          attribution={attribution}
        />
        <div className="mapOptions col s12">
          <div className="mapView" onClick = {() => this.setTiles(true)}>Terrain</div>
          <div className="satelliteView" onClick = {() => this.setTiles(false)}>Satellite</div>
        </div>
        {parsedEntries.map((k) => {
        return (
          <Marker
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

class DeviceList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDisplayList: true,
      filter: '',
      displayMap:{},
      selectedDevice:{},
      listOfDevices:[]
    };

    this.handleViewChange = this.handleViewChange.bind(this);
    this.applyFiltering = this.applyFiltering.bind(this);
    this.shouldShow = this.shouldShow.bind(this);
    this.showSelected = this.showSelected.bind(this);

    this.showAll = this.showAll.bind(this);
    this.hideAll = this.hideAll.bind(this);

    this.selectedDevice = this.selectedDevice.bind(this);

    this.toggleDisplay = this.toggleDisplay.bind(this);
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
    let displayMap = this.state.displayMap;
    for(let k in this.props.devices){
      let device = this.props.devices[k];
      displayMap[device.id] = true;
    }
    this.setState({displayMap:displayMap});
  }

  applyFiltering(deviceMap) {
    // turns the stored device map into a list
    let list = [];
    for (let k in deviceMap) {
      if(deviceMap[k].static_attrs[0] !== undefined){
          if(deviceMap[k].static_attrs[0].type == "geo:point"){
            deviceMap[k].hide = !this.shouldShow(k);
            deviceMap[k].select = this.showSelected(k);
            list.push(deviceMap[k]);
          }
        }
    }

    // TODO ordering should be defined by the user
    list.sort((a,b) => {
      if (a.updated > b.updated) {
        return 1;
      } else {
        return -1;
      }
    })

    return list;
  }

  shouldShow(device) {
    if (this.state.displayMap.hasOwnProperty(device)) {
      return this.state.displayMap[device];
    }
    return true;
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

  render() {
    const filteredList = this.applyFiltering(this.props.devices);
    const device_icon  = (<img src='images/icons/chip.png' />)


    return (
        <div className = "flex-wrapper">
          <div className="row z-depth-2 devicesSubHeader p0" id="inner-header">
            <div className="col s4 m4 main-title">List of Devices</div>
            <div className= "col s2 m2 header-info hide-on-small-only">
              <div className= "title"># Devices</div>
              <div className= "subtitle">{filteredList.length}</div>
            </div>
            <Link to="/device/new" title="Create a new device" className="waves-effect waves-light btn-flat">
              New Device
            </Link>
            {this.props.toggle}
          </div>
          <div className="deviceMapCanvas deviceMapCanvas-map col m12 s12 relative">
            <PositionRenderer devices={filteredList} listOfDevices={this.state.listOfDevices}/>
            <Sidebar devices={filteredList} hideAll={this.hideAll} showAll={this.showAll} selectedDevice={this.selectedDevice}
                      toggleDisplay={this.toggleDisplay}/>
          </div>
        </div>
    )
  }
}

export { DeviceList, PositionRenderer };
