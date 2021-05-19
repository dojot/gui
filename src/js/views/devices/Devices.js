/* eslint-disable */
import React, { Component } from 'react';
import AltContainer from 'alt-container';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Toggle from 'material-ui/Toggle';
import DeviceStore from '../../stores/DeviceStore';
import ConfigStore from '../../stores/ConfigStore';
import MeasureStore from '../../stores/MeasureStore';
import MapPositionStore from '../../stores/MapPositionStore';
import MapPositionActions from '../../actions/MapPositionActions';
import DeviceActions from '../../actions/DeviceActions';
import { NewPageHeader } from '../../containers/full/PageHeader';
import { DojotBtnLink } from '../../components/DojotButton';
import { DeviceMapWrapper } from './DeviceMap';
import { DeviceCardList } from './DeviceCard';
import {
    Pagination, FilterLabel, GenericOperations,
} from '../utils/Manipulation';
import { FormActions } from './Actions';
import Can from '../../components/permissions/Can';
import { withNamespaces } from 'react-i18next';


// UI elements


function ToggleWidget(props) {
    function checkAndToggle(currentState) {
        if (props.toggleState === currentState) props.toggle();
    }

    return (
        <div className="box-sh">
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
        </div>
    );
}

class MapWrapper extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <AltContainer stores={{
            positions: MapPositionStore,
            measures: MeasureStore,
            configs: ConfigStore
        }}>
            <DeviceMapWrapper showFilter={this.props.showFilter} dev_opex={this.props.dev_opex} />
        </AltContainer>;
    }
}


class DeviceOperations extends GenericOperations {
    constructor() {
        super();
        this.filterParams = { sortBy: 'label' };
        this.paginationParams = {};
        this.setDefaultPaginationParams();
    }

    whenUpdatePagination(config) {
        for (const key in config) {
            this.paginationParams[key] = config[key];
        }
        this._fetch();
    }

    setDefaultFilter() {
        this.filterParams = { sortBy: 'label' };
        this.setDefaultPaginationParams();
    }

    // @TODO: I think we need create a state variable to khow when is in the map mode;
    setFilterToMap() {
        this.paginationParams = {
            page_size: 5000,
            page_num: 1,
        };
    }

    whenRemoveItemFromLastPage() {
        if (this.paginationParams.page_num > 1) {
            this.paginationParams.page_num = this.paginationParams.page_num - 1;
        }
    }

    setFilterToCard() {
        if (this.paginationParams.page_size === 5000) {
            this.setDefaultPaginationParams();
        }
    }

    whenUpdateFilter(config) {
        this.filterParams = config;
        this._fetch();
    }

    _fetch(cb = null) {
        const res = Object.assign({}, this.paginationParams, this.filterParams);

        if (this.filterParams.templates) {
            delete res.templates;
            res.template = this.filterParams.templates;
        }

        if (this.paginationParams.page_size !== 5000) {
            DeviceActions.fetchDevices.defer(res, cb);
        } else {
            MapPositionActions.fetchDevices.defer(res, cb);
        }
    }
}


// TODO: this is an awful quick hack - this should be better scoped.
let device_list_socket = null;

class DevicesComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            displayList: true,
            showFilter: false
        };

        this.toggleSearchBar = this.toggleSearchBar.bind(this);
        this.toggleDisplay = this.toggleDisplay.bind(this);
        this.dev_opex = new DeviceOperations();
    }


    componentDidMount() {
        console.log("DevicesComponent");
        this.dev_opex._fetch();
        FormActions.toggleSidebarDevice.defer(false);
    }

    componentWillUnmount() {
        if (device_list_socket !== null) device_list_socket.close();
    }


    toggleSearchBar() {
        this.setState({ showFilter: !this.state.showFilter });
    }


    toggleDisplay() {
        const newDisplay = !this.state.displayList;
        // reload devices for maps
        this.dev_opex.setDefaultFilter();
        if (!newDisplay)
            this.dev_opex.setFilterToMap();

        this.dev_opex._fetch(() => {
            this.setState({ displayList: newDisplay });
        });
    }

    render() {
        console.log("DevicesComponent render");


        const detail = 'detail' in this.props.location.query
            ? this.props.location.query.detail
            : null;
        const displayToggle = (
            <ToggleWidget
                toggleState={this.state.displayList}
                toggle={this.toggleDisplay}
            />
        );

        const show_pagination = this.state.displayList;
        const { t } = this.props;
        return (
            <div className="full-device-area">
                <AltContainer store={DeviceStore}>
                    <NewPageHeader title={t('devices:title')} subtitle="" icon="device">
                        <FilterLabel ops={this.dev_opex} text={t('devices:header.filter.alt2')} />
                        <Pagination show_pagination={show_pagination} ops={this.dev_opex} />
                        <OperationsHeader displayToggle={displayToggle}
                            toggleSearchBar={this.toggleSearchBar.bind(this)} t={t} />
                    </NewPageHeader>
                    {this.state.displayList
                        ? <DeviceCardList deviceid={detail} toggle={displayToggle}
                            dev_opex={this.dev_opex}
                            showFilter={this.state.showFilter} />
                        : <MapWrapper toggle={displayToggle} showFilter={this.state.showFilter}
                            dev_opex={this.dev_opex} />}
                </AltContainer>
            </div>
        );
    }
}

function OperationsHeader(props) {
    return (
        <div className="col s5 pull-right pt10">
            <div
                className="searchBtn"
                title={props.t('devices:header.filter.alt')}
                onClick={props.toggleSearchBar}
            >
                <i className="fa fa-search" />
            </div>
            {props.displayToggle}
            <Can do="modifier" on="device">
                <DojotBtnLink
                    responsive="true"
                    onClick={() => FormActions.set(null)}
                    label={props.t('devices:header.new.label')}
                    alt={props.t('devices:header.new.alt')}
                    icon="fa fa-plus"
                    className="w130px"
                />
            </Can>
        </div>
    );
}

const Devices = withNamespaces()(DevicesComponent);
export { Devices };
