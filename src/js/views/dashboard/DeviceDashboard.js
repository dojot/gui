import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'

import alt from '../../alt';
import AltContainer from 'alt-container';
import LoginStore from '../../stores/LoginStore';
import util from '../../comms/util/util';

var DeviceDashboardStore = require('../../stores/DeviceDashboardStore');
var DeviceDashboardActions = require('../../actions/DeviceDashboardActions');

class DeviceItem extends Component {
  constructor (props) {
    super(props);
  }

  render() {
    // TODO IOTMID-511
    let uptime = '-';

    return (
      <Link className='main-div' to={'/device/list?detail=' + this.props.data.id}>
        <div className="item">
          <div className="col s12 name-info">
                {this.props.data.label}
          </div>
          <div className={'item-hovered no-padding color-'+this.props.data._status}>
          <div className="col s8 name-info">
                {this.props.data.label}
          </div>
          <div className="col s4 time-info upper">
                <title>{this.props.data._status}</title>
                <span>STATUS</span>
          </div>
          </div>
        </div>
      </Link>
    )
  }
}


class TemplateItem extends Component {
  constructor (props) {
    super(props);
  }

  render() {
    let used_by = this.props.data.attrs.used_by;
    if (used_by == undefined)
      used_by = '0';

    return (
      <div className='main-div'>
        <div className="item">
          <div className="col s12 name-info">
                {this.props.data.label}
          </div>
          <div className="col s6 time-info hide-on-small-only">
                <title>{util.timestamp_to_date(this.props.data.created)}</title>
                <span>CREATED AT</span>
          </div>
          <div className={'item-hovered no-padding bg-black'}>
          <div className="col s6 name-info">
                {this.props.data.label}
          </div>
          <div className="col s6 time-info upper">
                <title>{used_by} device(s)</title>
                <span>Used by</span>
          </div>
          </div>
        </div>
      </div>
    )
  }
}

class ElementList extends Component {
  constructor(props) {
    super(props);
  }

  //@TODO this is like a dict, I think would be better isolate it
  getInfoByType(type) {
    if (type == "devices"){
      return {
          img_url: 'images/chip-shadow-material.png',
          color: 'pink',
          subtitle: 'Last added',
          title: 'Devices'
      }
    } else {
      return {
        img_url: 'images/templates-shadow-material.png',
        color: 'ciano',
        subtitle: 'Created',
        title: 'Templates'
      }
    }
  }

  listItems(type){
    if (this.props.list.length > 0) {
      if (type == "devices") {
        return (
          <div className="col s12 no-padding">
              {
                this.props.list.map((it) =>
                  <DeviceItem key={it.id} data={it} />)
              }
          </div>
        )
      }
      else {
        return (
          <div className="col s12 no-padding">
            {
              this.props.list.map((it) =>
                <TemplateItem key={it.id} data={it} />)
            }
          </div>
        )
      }
    }
    else {
      return (
          <div className="col s12 valign-wrapper full-height">
            <div className="background-info no-items-box full-width">No items</div>
          </div>
      )
    }
  }

  render() {
    const info = this.getInfoByType(this.props.type);
    let tam = 0;
    if (this.props.list)
      tam = this.props.list.length;

    return (
        <div className="col box">
            <div className={"box-title bg-"+info.color}>
              <img className="icon hide-on-small-only" src={info.img_url}/>
              <label className='number hide-on-small-only'>{tam}</label>
              <label className='subtitle'>{info.subtitle}</label>
              <label className='title'>{info.title}</label>
              <i className="fa fa-menu"></i>
            </div>
            <div className="box-content full-height">
              { this.listItems(this.props.type) }
            </div>
        </div>
    )
  }
  }




class MainPainel extends Component {
    constructor(props) {
      super(props);
    }

    render() {
      return (
        <div className="right-painel-info col s12 m12 l8 xl9">
          <ElementList type='devices' list={this.props.devices} />
          <ElementList type='templates' list={this.props.templates} />
        </div>
      )
  }
}

class LeftPainel extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let main_stats = [];
    let side_stats = [];
    if (this.props.stats.mainStats)
      main_stats = this.props.stats.mainStats;
    if (this.props.stats.sideStats)
      side_stats = this.props.stats.sideStats;

    return (
      <div className="left-painel-info col s12 m12 l4 xl3" >
          <div className="main-header">
            <div className="photo-big" >
              <div className="circle-after">
                <img className="w100p h100p" src="images/big-chip.png"/>
              </div>
            </div>
            <label className='col s12 title'> {this.props.mainTitle} </label>
            <label className='col s12 subtitle'> {this.props.subtitle} </label>
          </div>

          <div className="box-stats col s12">
            <p className='main-title'><label>{this.props.stats.title}</label></p>
            <div className='stats'>
            <div className="main-stats col s12 m6 l12">
              { main_stats.map((stat) =>
                <div key={stat.key} className="lst-item">
                  <p className="key"> {stat.key}</p>
                  <p className="value"> {stat.value}</p>
                </div>
              )}
              </div>
              <div className="side-stats col s12 m6 l12">
              { side_stats.map((stat) =>
                <div key={stat.key} className="lst-item sub">
                  <p className="key"> {stat.key}</p>
                  <p className="value"> {stat.value}</p>
                </div>
              )}
              </div>
            </div>
          </div>
      </div>
    )
  }
}


class DeviceDashboard extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <AltContainer stores={{devices: DeviceDashboardStore, user: LoginStore}} >
        <DeviceDashboardImpl {...this.props} />
      </AltContainer>
    )
  }
}


class DeviceDashboardImpl extends Component {
  componentDidMount() {
    DeviceDashboardActions.fetchDevices(() => {
      DeviceDashboardActions.fetchTemplates(() => {
        DeviceDashboardActions.fetchStats(this.props.user.user.service);
      })
    })
  }

  render() {
    return (
      <ReactCSSTransitionGroup
      transitionName="first"
      transitionAppear={true}
      transitionAppearTimeout={500}
      transitionEnterTimeout={500}
      transitionLeaveTimeout={500} >
      <div className="row main-painel">
         <LeftPainel id='div_devices' mainTitle="Devices" subtitle="Dashboard" stats={this.props.devices.stats} />
         <MainPainel devices={this.props.devices.last_devices} templates={this.props.devices.last_templates} />
      </div>
      </ReactCSSTransitionGroup>
    );
  }
}

export default DeviceDashboard;
