import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ReactResizeDetector from 'react-resize-detector';

class ListItem extends Component {
  constructor(props){
    super(props);
    this.state = {
      selectedDevice: null,
    }
    this.selectedDevice = this.selectedDevice.bind(this);
  }

  selectedDevice(event){
    this.props.selectedDevice(this.props.devices.id)
  }

  render(){
    const name = this.props.devices.label;
    const protocol = this.props.devices.protocol;

    return(
      <div className="lst-entry-title col s12" id={this.props.devices.id} title="See details" onClick={this.selectedDevice}>
        <div className="img col s3" id="img-chip">
          <img src="images/chip.png" />
        </div>
        <div className="user-label truncate col s6">{name}</div>
        <div className="col s3 img" id="device-view">
        </div>
      </div>
    )
  }
}


class ListRender extends Component {
  constructor(props){
    super(props);

    this.applyFiltering = this.applyFiltering.bind(this);
  }

  applyFiltering(devices) {
    let list = [];
    for (let k in devices) {
      list.push(devices[k]);
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

  render(){

    const deviceList = this.applyFiltering(this.props.devices);

    if (deviceList.length > 0) {
      return (
        <div className="row">
        { deviceList.map((device, idx) =>
        <ListItem devices={device} key={device.id} selectedDevice={this.props.selectedDevice}/>
      )}
        </div>
      )
    } else {
      return  (
        <div className="background-info valign-wrapper full-height">
          <span className="horizontal-center">No configured devices</span>
        </div>
      )
    }
  }
}


class List extends Component {
  constructor(props){
    super(props);
    this.state = {
      selectedDevice: false
    };
    this.hideDevices = this.hideDevices.bind(this);
    this.showDevices = this.showDevices.bind(this);
  }

  hideDevices(){
    this.props.hideAll();
  }

  showDevices(){
    this.props.showAll();
  }

  render(){

    return(
      <div className="list-of-devices">
        <div className="row device-list">
          <div className="col s12 info-header">
            <div className="col s1 " />
            <div className="col s5 subtitle">{this.props.deviceInfo}</div>
            <div className="col s6 device-list-actions">
              <div className="col s6 action-hide">
                <a className="waves-effect waves-light" onClick={this.hideDevices}>
                  HIDE ALL
                </a>
              </div>
              <div className="col s6 action-show">
                <a className="waves-effect waves-light" onClick={this.showDevices}>
                  SHOW ALL
                </a>
              </div>
            </div>
          </div>
          <div className="deviceCanvas">
            <ListRender toggleVisibility={this.props.toggleVisibility} devices={this.props.devices} displayMap={this.props.displayMap} />
          </div>
        </div>
      </div>

    )
  }
}

class Sidebar extends Component {
  constructor(props){
    super(props);
    this.state = {
      click: false,
      sideBarOpened: false,
    };

    this.toggleSideBar = this.toggleSideBar.bind(this);
  }

  toggleSideBar() {
    const last = this.state.sideBarOpened;
    this.setState({sideBarOpened: !last});
  }

  render(){
    const btnSideBarClass = "fa fa-chevron-" + (this.state.sideBarOpened ? "right" : "left");

    return(
      <div className="col m12">
        <div className={"col m12 div-btn-side-painel " + (this.state.sideBarOpened ? 'push-left' : 'no-left')} >
          <button type="button" className='btn btn-circle sideBarToggle' onClick={this.toggleSideBar}>
            <i className={btnSideBarClass} aria-hidden="true"></i>
          </button>
        </div>
        { this.state.sideBarOpened ? (
          <div className="col device-painel full-height">
            <div className="col device-painel-body relative">
              <List deviceInfo={this.props.deviceInfo} toggleVisibility={this.props.toggleVisibility} devices={this.props.devices} hideAll={this.props.hideAll} showAll={this.props.showAll} displayMap={this.props.displayMap} />
            </div>
          </div>
        ) : (
          null
        )}
      </div>
    )
  }
}

export default Sidebar;
