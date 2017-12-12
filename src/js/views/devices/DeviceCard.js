import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import util from "../../comms/util/util";

import { Link } from 'react-router'

import { PageHeader } from "../../containers/full/PageHeader";

import SideBar from "../../components/DeviceRightSidebar";


function SummaryItem(props) {
  let attrs = 0;
  if (props.device.attrs) attrs += props.device.attrs.length
  if (props.device.static_attrs) attrs += props.device.static_attrs.length

  return (
    <Link to={"/device/id/" + props.device.id + "/detail"}>
      <div className="lst-entry col s12 m6 l4">
        <div className={"clickable lst-entry-wrapper z-depth-2 col s12 " + props.device._status}  title="View details">
          <div className="lst-entry-title col s12">
            <div className="img">
              <img src="images/ciShadow.svg" />
            </div>
            <div className="user-label truncate">{props.device.label}</div>
            <span className={"badge " + status}>{props.device._status}</span>
          </div>

          <div className="lst-entry-body col s12">
            {/* TODO fill those with actual metrics */}
            <div className="col s3 metric">
              <div className="metric-value">{attrs}</div>
              <div className="metric-label">Attributes</div>
            </div>
            <div className="col s9 metric last">
              <div className="metric-value">{util.printTime(props.device.updated)}</div>
              <div className="metric-label">Last update</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}


class DeviceCardList extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.loading) {
      return (<Loading />);
    }

    // TODO refactor this away
    let filteredList = []
    if ((this.props.devices !== undefined) && (this.props.devices !== null)) {
      for (let k in this.props.devices) {
        if (this.props.devices.hasOwnProperty(k)){
          filteredList.push(this.props.devices[k]);
        }
      }
    }

    const device_icon  = (<img src='images/icons/chip.png' />)
    if (filteredList.length > 0) {
      return (
        <div className = "flex-wrapper bg-light-gray">
          {/* TODO refactor this to a different file */}
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

          <div className="deviceMapCanvas col m12 s12 relative">
            <div className="row">
              <div className="col s12  lst-wrapper extra-padding">
                { filteredList.map((device, idx) => <SummaryItem device={device} key={device.id}/>) }
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return  (
        <div className="background-info valign-wrapper full-height relative">
          <span className="horizontal-center">No configured devices</span>
        </div>
      )
    }
  }
}

export { DeviceCardList };
