import React, { Component } from 'react';
import DeviceStore from '../../stores/DeviceStore';
import MeasureStore from '../../stores/MeasureStore';
import DeviceActions from '../../actions/DeviceActions';
import MeasureActions from '../../actions/MeasureActions';
import { NewPageHeader } from "../../containers/full/PageHeader";
import AltContainer from 'alt-container';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { DojotBtnLink } from "../../components/DojotButton";
import { DeviceMapSmall, DeviceMapBig} from "./DeviceMap";
import {DeviceCardList} from './DeviceCard';
import util from '../../comms/util';
import { Filter, Pagination, FilterLabel, GenericOperations } from "../utils/Manipulation";


// UI elements
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Toggle from 'material-ui/Toggle';


function ToggleWidget(props) {

  function checkAndToggle(currentState) {
    if (props.toggleState == currentState) props.toggle();
  }

  return <div className="box-sh">
    <div className="toggle-icon" onClick={checkAndToggle.bind(this, true)}>
        <img src="images/icons/pin.png" />
      </div>
      <div className="toggle-map">
        <MuiThemeProvider>
          <Toggle label="" defaultToggled={props.toggleState} onToggle={props.toggle} />
        </MuiThemeProvider>
      </div>
    <div className="toggle-icon" onClick={checkAndToggle.bind(this, false)}>
        <i className="fa fa-th-large" aria-hidden="true" />
      </div>
    </div>;
}

class MapWrapper extends Component {
  constructor(props){
    super(props)
  }

  componentDidMount(){
    let devices = this.props.devices;
    for(let deviceID in devices){
      for(let templateID in devices[deviceID].attrs){
        for(let attrID in devices[deviceID].attrs[templateID]){
          if(devices[deviceID].attrs[templateID][attrID].type === "dynamic"){
            if(devices[deviceID].attrs[templateID][attrID].value_type === "geo:point"){
                MeasureActions.fetchPosition.defer(devices[deviceID], devices[deviceID].id, devices[deviceID].attrs[templateID][attrID].label);
            }
          }
        }
      }
    }
  }

  render(){
    console.log("this.props.deviceList", this.props.deviceList);
    if (this.props.deviceList.length < 1000)
    return <AltContainer store={MeasureStore}>
        <DeviceMapSmall devices={this.props.devices} showFilter={this.props.showFilter} dev_opex={this.props.dev_opex} />
      </AltContainer>;
    else
    return <AltContainer store={MeasureStore}>
        <DeviceMapBig devices={this.props.devices} showFilter={this.props.showFilter} dev_opex={this.props.dev_opex} />
      </AltContainer>;
  }
}


class DeviceOperations extends GenericOperations {
  constructor() {
    super();
    this.filterParams = { "sortBy": "label" };
    this.paginationParams = {};
    this.setDefaultPaginationParams();
  }
  
  whenUpdatePagination(config) {
    for (let key in config) this.paginationParams[key] = config[key];
    this._fetch();
  }

  setDefaultFilter()
  {
    this.filterParams = { "sortBy": "label" };
    this.setDefaultPaginationParams();
  }

  setFilterToMap() {
    this.paginationParams = {
      page_size: 100,
      page_num: 1
    };
    this.filterParams = {};
  }

  whenUpdateFilter(config) {
    this.setDefaultPageNumber();
    this.filterParams = config;
    this._fetch();
  }

  _fetch(cb = null) {
    let res = Object.assign({}, this.paginationParams, this.filterParams);
    if (this.filterParams.templates) {
      delete res.templates;
      res.template = this.filterParams.templates;
    }
      console.log("fetching: ", res, "all templates ");
      DeviceActions.fetchDevices.defer(res, cb);
    // }
  }
}


// TODO: this is an awful quick hack - this should be better scoped.
var device_list_socket = null;

class Devices extends Component {
  constructor(props) {
    super(props);
    this.state = { displayList: true, showFilter: false };

    this.toggleSearchBar = this.toggleSearchBar.bind(this);
    this.toggleDisplay = this.toggleDisplay.bind(this);
    this.setDisplay = this.setDisplay.bind(this);
    this.dev_opex = new DeviceOperations();
  }

  componentDidMount() {
    // DeviceActions.fetchDevices.defer();
    console.log("devices: componentDidMount");
    this.dev_opex._fetch();
    // Realtime
    let socketio = require('socket.io-client');

    const target = `${window.location.protocol}//${window.location.host}`;
    const token_url = target + "/stream/socketio";

    function _getWsToken() {
      util._runFetch(token_url)
        .then((reply) => {
          init(reply.token);
        })
        .catch((error) => {
          console.log("Failed!", error);
        });
    }

    function init(token){
      device_list_socket = socketio(target, { query: "token=" + token, transports: ['polling'] });

      device_list_socket.on('all', function(data){
        console.log("received socket information:", data);
        MeasureActions.appendMeasures(data);
        DeviceActions.updateStatus(data);
      });

      device_list_socket.on('error', (data) => {
        console.log("socket error", data);
        if (device_list_socket !== null)
          device_list_socket.close();
        // getWsToken();
      })
    }

    _getWsToken();
  }

  componentWillUnmount(){
    if (device_list_socket !== null)
      device_list_socket.close();
  }


  toggleSearchBar() {
    this.setState({ showFilter: !this.state.showFilter });
  }

  setDisplay(state) {
    this.setState({ displayList: state });
  }

  toggleDisplay() {
    let newDisplay = !this.state.displayList;
    console.log(" toggleDisplay",newDisplay);
    // reload devices for maps
    if (!newDisplay) 
      this.dev_opex.setFilterToMap();
    else
      this.dev_opex.setDefaultFilter();

      this.dev_opex._fetch(() => {
         this.setState({ displayList: newDisplay });
    });
  }

  
    render() {
        console.log("Loading Devices Component.");

        const detail =
            "detail" in this.props.location.query
                ? this.props.location.query.detail
                : null;
        const displayToggle = (
            <ToggleWidget
                toggleState={this.state.displayList}
                toggle={this.toggleDisplay}
                setState={this.setDisplay}
            />
        );

        let show_pagination = this.state.displayList; 
        return <div className="full-device-area">
            <AltContainer store={DeviceStore}>
              <NewPageHeader title="Devices" subtitle="" icon="device">
                <FilterLabel ops={this.dev_opex} text="Filtering Devices" />
                <Pagination show_pagination={show_pagination} ops={this.dev_opex} />
                <OperationsHeader displayToggle={displayToggle} toggleSearchBar={this.toggleSearchBar.bind(this)} />
              </NewPageHeader>
              {this.state.displayList ? <DeviceCardList deviceid={detail} toggle={displayToggle} dev_opex={this.dev_opex} showFilter={this.state.showFilter} /> : <MapWrapper deviceid={detail} toggle={displayToggle} showFilter={this.state.showFilter} dev_opex={this.dev_opex} />}
            </AltContainer>
          </div>;
    }
}

function OperationsHeader(props) {
  return (
    <div className="col s5 pull-right pt10">
      <div
        className="searchBtn"
        title="Show search bar"
        onClick={props.toggleSearchBar}>
        <i className="fa fa-search" />
      </div>
      {props.displayToggle}
      <DojotBtnLink
        linkto="/device/new"
        label="New Device"
        alt="Create a new device"
        icon="fa fa-plus"
        className="w130px"
      />
    </div>
  )
}

export { Devices };
