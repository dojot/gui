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
    <div className={"card-size card-hover lst-entry-wrapper z-depth-2 fullHeight"}>
          <div className="lst-entry-title col s12">
        <img className="title-icon" src={"images/icons/graph-wt.png"}/>
              <div className="title-text truncate">
                  <span className="text" title={props.flow.name}> {props.flow.name} </span>
              </div>
          </div>
          <div className="attr-list">
              <div className={"attr-area light-background"}>
                  <div className="attr-row">
                      <div className="icon">
                          <img src={"images/tag.png"}/>
                      </div>
                      <div className={"attr-content"}>
                          <input type="text" value={props.flow.flow.length - 1} disabled={true}/>
                          <span>Nodes</span>
                      </div>
                      <div className="center-text-parent material-btn right-side">
                      </div>
                  </div>
                  <div className="attr-row">
                      <div className="icon">
                          <img src={"images/update.png"}/>
                      </div>
                      <div className={"attr-content"}>
                          <input type="text" value={util.printTime(props.flow.updated / 1000)} disabled={true}/>
                          <span>Last update</span>
                      </div>
                      <div className="center-text-parent material-btn right-side">
                      </div>
                  </div>
              </div>
          </div>
      </div>
  )
}

class ListRender extends Component {
  constructor(props) {
    super(props);

    this.state = {filter: "", loaded: false };

    this.filteredList = [];

    this.applyFiltering = this.applyFiltering.bind(this);
    this.filterListByName = this.filterListByName.bind(this);
    this.clearInputField = this.clearInputField.bind(this);
  }

  componentDidUpdate() {
    if ((!this.state.loaded) && (this.props.flows !== undefined) && (Object.keys(this.props.flows).length)) {
        this.convertFlowList();
        this.setState({loaded: true});
    }
  }

  filterListByName (event){
    event.preventDefault();
    // if (event.target.value === "") {
      // DeviceActions.fetchDevices.defer();
      // the flicker is being caused by this so let's try remove it
    // }
    this.setState({filter: event.target.value});
  }

  convertFlowList() {
    if (this.state.filter != "") {
      var updatedList = this.filteredList.filter(function(flow) {
        return flow.name.includes(event.target.value);
      });
      this.filteredList = updatedList;
    } else {
      this.filteredList = [];
      for (let k in this.props.flows) {
        if (this.props.flows.hasOwnProperty(k)){
          this.filteredList.push(this.props.flows[k]);
        }
      }
    }
  }

  applyFiltering(list){
    return Object.values(list);
  }

  clearInputField(){
    this.state.filter = "";
  }

  render () {
    this.filteredList = this.applyFiltering(this.props.flows);

    this.convertFlowList();

    let header = null;
    // if (this.props.showSearchBox){
    //   header = <div className={"row z-depth-2 flowsSubHeader " + (this.props.showSearchBox ? "show-dy" : "hide-dy")} id="inner-header">
    //       <div className="col s3 m3 main-title">
    //         Showing {this.filteredList.length} flow(s)
    //       </div>
    //       <div className="col s1 m1 header-info hide-on-small-only">
    //         {/* <div className="title"># Devices</div> */}
    //         {/* <div className="subtitle"> */}
    //         {/* Showing {this.filteredList.length} device(s) */}
    //         {/* </div> */}
    //       </div>
    //       <div className="col s4 m4">
    //         <label htmlFor="fld_flow_name">Flow Name</label>
    //         <input id="fld_flow_name" type="text" name="Flow Name" className="form-control form-control-lg" placeholder="Search" value={this.state.filter} onChange={this.filterListByName} />
    //       </div>
    //     </div>;
    // } else{
    //   this.filteredList = this.applyFiltering(this.props.flows);
    //   this.clearInputField();
    // }


    if (this.filteredList.length > 0) {
      return (
        <div className="row">
          <ReactCSSTransitionGroup transitionName="flowsSubHeader"
                                   transitionAppear={true}
                                   transitionAppearTimeout={300}
                                   transitionEnterTimeout={300}
                                   transitionLeaveTimeout={300}>
            {header}
          </ReactCSSTransitionGroup>
          <div className="col s12 lst-wrapper scroll-bar">
            { this.filteredList.map((flow, id) =>
              <Link to={"/flows/id/" + flow.id} key={flow.id} >
                <div className="s12 m6 l4 mt20">
                  <SummaryItem flow={flow} key={flow.id} />
                </div>
              </Link>
            )}
          </div>
        </div>
      )
    } else {
      return  (
        <div className="row full-height relative">
          <ReactCSSTransitionGroup transitionName="flowsSubHeader"
                                   transitionAppear={true}
                                   transitionAppearTimeout={300}
                                   transitionEnterTimeout={300}
                                   transitionLeaveTimeout={300}>
            {header}
          </ReactCSSTransitionGroup>
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
        <ReactCSSTransitionGroup transitionName="flowsSubHeader">
          {this.props.showSearchBox ? header: null}
        </ReactCSSTransitionGroup>
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

    this.state = {showFilter: false};

    this.toggleSearchBar = this.toggleSearchBar.bind(this);
  }

  componentDidMount() {
    FlowActions.fetch.defer();
  }

  toggleSearchBar() {
    const last = this.state.showFilter;
    this.setState({ showFilter: !last });
  }

  render() {
    return (
      <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true} transitionAppearTimeout={100}
          transitionEnterTimeout={100} transitionLeaveTimeout={100} >
        <NewPageHeader title="Data flows" subtitle="" icon="flow">
          <OperationsHeader />
        </NewPageHeader>
        <AltContainer store={FlowStore}>
          <ListRender showSearchBox={this.state.showFilter}/>
        </AltContainer>
      </ReactCSSTransitionGroup>
    );
  }
}

function OperationsHeader(props) {
  return (
    <div className="col s12 pull-right pt10">
      <Link to="/flows/new" className="new-btn-flat red waves-effect waves-light " title="Create a new data flow">
        New Flow <i className="fa fa-plus" />
      </Link>
    </div>
  )
}

export { Flows };
