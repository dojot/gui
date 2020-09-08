/* eslint-disable */
import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import AltContainer from 'alt-container';
import FlowStore from '../../stores/FlowStore';
import FlowActions from '../../actions/FlowActions';
import { NewPageHeader } from '../../containers/full/PageHeader';
import {
    Trans, withNamespaces
} from 'react-i18next';
import util from '../../comms/util/util';
import { DojotBtnLink } from '../../components/DojotButton';
import Can from '../../components/permissions/Can';


function SummaryItem(props) {
    return (
        <div className="card-size card-hover lst-entry-wrapper z-depth-2 mg0px pointer">
            <div className="lst-entry-title col s12 bg-gradient-dark-blue">
                <img className="title-icon" src="images/icons/graph-wt.png"/>
                <div className="title-text truncate">
                    <span className="text" title={props.flow.name}>
                        {props.flow.name}
                    </span>
                </div>
            </div>
            <div className="attr-list">
                <div className="attr-area light-background">
                    <div className="attr-row">
                        <div className="icon">
                            <img src="images/tag.png"/>
                        </div>
                        <div className="attr-content">
                            <input type="text" value={props.flow.flow.length - 1} disabled/>
                            <span><Trans i18nKey="flows:nodes"/></span>
                        </div>
                        <div className="center-text-parent material-btn right-side"/>
                    </div>
                    <div className="attr-row">
                        <div className="icon">
                            <img src="images/update.png"/>
                        </div>
                        <div className="attr-content">
                            <input type="text" value={util.iso_to_date(props.flow.updated)}
                                   disabled/>
                            <span><Trans i18nKey="flows:last_update"/></span>
                        </div>
                        <div className="center-text-parent material-btn right-side"/>
                    </div>
                </div>
            </div>
        </div>
    );
}

class ListRender extends Component {
    constructor(props) {
        super(props);

        this.state = {
            filter: '',
            loaded: false
        };

        this.filteredList = [];

        this.applyFiltering = this.applyFiltering.bind(this);
        this.filterListByName = this.filterListByName.bind(this);
        this.clearInputField = this.clearInputField.bind(this);
    }

    componentDidUpdate() {
        if ((!this.state.loaded) && (this.props.flows !== undefined) && (Object.keys(this.props.flows).length)) {
            this.setState({ loaded: true });
        }
    }

    filterListByName(event) {
        event.preventDefault();
        // if (event.target.value === "") {
        // DeviceActions.fetchDevices.defer();
        // the flicker is being caused by this so let's try remove it
        // }
        this.setState({ filter: event.target.value });
    }

    convertFlowList(list) {
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }

    applyFiltering(list) {
        return Object.values(list);
    }

    clearInputField() {
        this.state.filter = '';
    }

    render() {
        this.filteredList = this.convertFlowList(this.applyFiltering(this.props.flows));
        const { i18n } = this.props;

        const header = null;
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
                <div className="full-height flex-container pos-relative overflow-x-hidden">
                    <ReactCSSTransitionGroup
                        transitionName="flowsSubHeader"
                        transitionAppear
                        transitionAppearTimeout={300}
                        transitionEnterTimeout={300}
                        transitionLeaveTimeout={300}
                    >
                        {header}
                    </ReactCSSTransitionGroup>
                    <div className="col s12 lst-wrapper w100 hei-100-over-scroll flex-container">
                        {this.filteredList.map((flow, id) => (
                            <div className="mg20px fl flex-order-2">
                                <Link to={`/flows/id/${flow.id}`} key={flow.id}>
                                    <SummaryItem flow={flow} key={flow.id}/>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return (
            <div className="full-height flex-container pos-relative overflow-x-hidden">
                <ReactCSSTransitionGroup
                    transitionName="flowsSubHeader"
                    transitionAppear
                    transitionAppearTimeout={300}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={300}
                >
                    {header}
                </ReactCSSTransitionGroup>
                <div className="background-info valign-wrapper full-height">
                    <span className="horizontal-center">{i18n('flows:alerts.no_configured')}</span>
                </div>
            </div>
        );
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
        this.setState({ isDisplayList: !this.state.isDisplayList });
    }

    detailedTemplate(id) {
        const temp = this.state;

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
            const temp = this.state;
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

        return flowList.filter((e) => {
            let result = false;
            if (idFilter && idFilter[1]) {
                result = result || e.id.toUpperCase()
                    .includes(idFilter[1].toUpperCase());
            }

            return result || e.label.toUpperCase()
                .includes(filter.toUpperCase());
        });
    }

    render() {
        const filteredList = this.applyFiltering(this.props.flows);

        return (
            <div className="col m10 s12 offset-m1 full-height relative">
                <ReactCSSTransitionGroup transitionName="flowsSubHeader">
                    {this.props.showSearchBox ? header : null}
                </ReactCSSTransitionGroup>
                <ListRender
                    flows={filteredList}
                    detail={this.state.detail}
                    detailedTemplate={this.detailedTemplate}
                    edit={this.state.edit}
                    editTemplate={this.editTemplate}
                />

                {/* <!-- footer --> */}
                <div className="col s12"/>
                <div className="col s12">&nbsp;</div>
            </div>
        );
    }
}

class FlowsComponent extends Component {
    constructor(props) {
        super(props);

        this.state = { showFilter: false };

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
        const { t } = this.props;

        return (
            <div className="full-device-area">
                <div>
                <NewPageHeader title={t('flows:title')} subtitle={t('flows:title')} icon="flow">
                    <OperationsHeader {...this.props} />
                </NewPageHeader>
                    <AltContainer store={FlowStore}>
                        <ListRender showSearchBox={this.state.showFilter} i18n={t}/>
                    </AltContainer>
                </div>
            </div>
        );
    }
}


function OperationsHeader(props) {
    const { t } = props;
    return <div className="col s12 pull-right pt10">
        <Can do="modifier" on="flows">
            <DojotBtnLink responsive="true" linkTo="/flows/new"
                          label={t('flows:header.new.label')}
                          alt={t('flows:header.new.alt')} icon="fa fa-plus" className="w130px"/>
        </Can>
    </div>;
}

export const Flows = (withNamespaces()(FlowsComponent));
