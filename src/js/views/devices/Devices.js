import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import deviceManager from '../../comms/devices/DeviceManager';
import DeviceStore from '../../stores/DeviceStore';
import MeasureStore from '../../stores/MeasureStore';
import DeviceActions from '../../actions/DeviceActions';

import MeasureActions from '../../actions/MeasureActions';

import { PageHeader } from "../../containers/full/PageHeader";
import { NewPageHeader } from "../../containers/full/PageHeader";
import AltContainer from 'alt-container';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'
import { DojotBtnLink } from "../../components/DojotButton";
import {DeviceMap, PositionRenderer} from './DeviceMap';
import {DeviceCard} from './DeviceCard';

import util from '../../comms/util';

import LoginStore from '../../stores/LoginStore';

// UI elements
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Toggle from 'material-ui/Toggle';


function ToggleWidget(props) {
  return <div className="box-sh">
      <div className="toggle-icon" onClick={props.setState.bind(this,false)}>
        <img src="images/icons/pin.png" />
      </div>
      <div className="toggle-map">
        <MuiThemeProvider>
          <Toggle label="" defaultToggled={props.toggleState} onToggle={props.toggle} />
        </MuiThemeProvider>
      </div>
      <div className="toggle-icon" onClick={props.setState.bind(this,true)}>
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
    for(let k in devices){
      for(let j in devices[k].attrs){
        for(let i in devices[k].attrs[j]){
          if(devices[k].attrs[j][i].type == "dynamic"){
            if(devices[k].attrs[j][i].value_type == "geo:point"){
                MeasureActions.fetchPosition.defer(devices[k], devices[k].id, devices[k].attrs[j][i].label);
            }
          }
        }
      }
    }
  }

  render(){
    return(
      <AltContainer store={MeasureStore}>
        <DeviceMap devices={this.props.devices}/>
      </AltContainer>
    )
  }
}

class Devices extends Component {
  constructor(props) {
    super(props);
    this.state = { displayList: true, showFilter: false };

    this.toggleSearchBar = this.toggleSearchBar.bind(this);
    this.filterChange = this.filterChange.bind(this);
    this.toggleDisplay = this.toggleDisplay.bind(this);
    this.setDisplay = this.setDisplay.bind(this);
  }

  componentDidMount() {
    DeviceActions.fetchDevices.defer();

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
        MeasureActions.updatePosition.defer(data);
      });
    }

  }

  filterChange(newFilter) {}

  toggleSearchBar() {
    const last = this.state.showFilter;
    this.setState({ showFilter: !last });
  }

  setDisplay(state) {
    this.setState({ displayList: state });
  }

  toggleDisplay() {
    const last = this.state.displayList;
    this.setState({ displayList: !last });
  }

  render() {
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

    return <ReactCSSTransitionGroup transitionName="first" transitionAppear={true} transitionAppearTimeout={500} transitionEnterTimeout={500} transitionLeaveTimeout={500}>
        <NewPageHeader title="Devices" subtitle="" icon="device">
          {/* <Filter onChange={this.filterChange} /> */}
          {/*<Link to="/device/new" title="Create a new device" className="btn-item btn-floating waves-effect waves-light cyan darken-2">
            <i className="fa fa-plus"/>
          </Link> */}

          <div className="pt10">
            <div className="searchBtn" title="Show search bar" onClick={this.toggleSearchBar.bind(this)}>
              <i className="fa fa-search" />
            </div>
            {displayToggle}
            <DojotBtnLink linkto="/device/new" label="New Device" alt="Create a new device" icon="fa fa-plus" />
          </div>
        </NewPageHeader>
        <AltContainer store={DeviceStore}>
          {this.state.displayList ? (
            <DeviceCard deviceid={detail} toggle={displayToggle} showSearchBox={this.state.showFilter} />
          ) : (
            <MapWrapper deviceid={detail} toggle={displayToggle} showSearchBox={this.state.showFilter}/>
          )}
        </AltContainer>
      </ReactCSSTransitionGroup>;
  }
}

export { Devices };
