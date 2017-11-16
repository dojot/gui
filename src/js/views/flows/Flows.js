import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import AltContainer from 'alt-container';

import FlowStore from '../../stores/FlowStore';
import FlowActions from '../../actions/FlowActions';

import {PageHeader, NewPageHeader} from "../../containers/full/PageHeader";
import util from "../../comms/util/util";

function SummaryItem(props) {
  return (
    <div className={"lst-entry-wrapper z-depth-2 col s12"}>
      <div className="lst-entry-title col s12">

        <div className="app-icon img">
          <i className="material-icons mi-device-hub shadow" />
        </div>

        <div className="user-label truncate">{props.flow.name}</div>
        <div className="label">flow name</div>
        <span className={"badge " + status}>{status}</span>
      </div>

      <div className="lst-entry-body col s12">
        <div className="col s3 metric">
          <div className="metric-value">{props.flow.flow.length - 1}</div>
          <div className="metric-label">Nodes</div>
        </div>
        <div className="col s9 metric last">
          <div className="metric-value">{util.printTime(props.flow.updated / 1000)}</div>
          <div className="metric-label">Last update</div>
        </div>
      </div>
    </div>
  )
}

class ListRender extends Component {
  constructor(props) {
    super(props);
  }

  render () {
    const flowList = this.props.flows;
    if (Object.keys(flowList).length > 0) {
      return (
        <div className="row">
          <div className="col s12  lst-wrapper">
            { Object.keys(flowList).map((flowid) =>
              <Link to={"/flows/id/" + flowid} key={flowid} >
                <div className="lst-entry col s12 m6 l4">
                  <SummaryItem flow={flowList[flowid]} />
                </div>
              </Link>
            )}
          </div>
        </div>
      )
    } else {
      return  (
        <div className="row full-height relative">
          <div className="background-info valign-wrapper full-height">
            <span className="horizontal-center">No configured flows</span>
          </div>
        </div>
      )
    }
  }
}

class FlowList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter: '',
    };

    this.handleViewChange = this.handleViewChange.bind(this);
    this.applyFiltering = this.applyFiltering.bind(this);
    this.detailedTemplate = this.detailedTemplate.bind(this);
    this.editTemplate = this.editTemplate.bind(this);
  }

  handleViewChange(event) {
    this.setState({isDisplayList: ! this.state.isDisplayList})
  }

  detailedTemplate(id) {
    let temp = this.state;

    if (this.state.detail && this.state.edit) {
      if (id === undefined) {
        temp.edit = undefined;
      }
    }

    temp.detail = id;
    this.setState(temp);
    return true;
  }

  editTemplate(id) {
    if (this.state.detail === id) {
      let temp = this.state;
      temp.edit = id;
      this.setState(temp);
      return true;
    }

    return false;
  }

  // handleSearchChange(event) {
  //   const filter = event.target.value;
  //   let state = this.state;
  //   state.filter = filter;
  //   state.detail = undefined;
  //   this.setState(state);
  // }

  applyFiltering(flowList) {
    return flowList;

    const filter = this.state.filter;
    const idFilter = filter.match(/id:\W*([-a-fA-F0-9]+)\W?/);

    return flowList.filter(function(e) {
      let result = false;
      if (idFilter && idFilter[1]) {
        result = result || e.id.toUpperCase().includes(idFilter[1].toUpperCase());
      }

      return result || e.label.toUpperCase().includes(filter.toUpperCase());
    });
  }

  render() {
    const filteredList = this.applyFiltering(this.props.flows);

    return (
      <div className="col m10 s12 offset-m1 full-height relative" >

        <ListRender flows={filteredList}
                    detail={this.state.detail}
                    detailedTemplate={this.detailedTemplate}
                    edit={this.state.edit}
                    editTemplate={this.editTemplate} />

        {/* <!-- footer --> */}
        <div className="col s12"></div>
        <div className="col s12">&nbsp;</div>
      </div>
    )
  }
}

class Flows extends Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    FlowActions.fetch.defer();
  }

  render() {
    return (
      <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true} transitionAppearTimeout={500}
          transitionEnterTimeout={500} transitionLeaveTimeout={500} >
        <NewPageHeader title="data flows" subtitle="" icon="flow">
          <Link to="/flows/new" className="new-btn-flat red waves-effect waves-light " title="Create a new data flow">
            New Flow <i className="fa fa-plus"/>
          </Link>
        </NewPageHeader>

        <AltContainer store={FlowStore}>
          <ListRender />
        </AltContainer>
      </ReactCSSTransitionGroup>
    );
  }
}

export { Flows };
