import PropTypes from "prop-types";
import React, { Component } from 'react';
import AltContainer from 'alt-container';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Toggle from 'material-ui/Toggle';
import { withNamespaces } from 'react-i18next';
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
} from '../maps/Manipulation';
import { FormActions } from './Actions';
import Can from '../../components/permissions/Can';


// UI elements


const ToggleWidget = ({ toggleState, toggle }) => {

    const checkAndToggle = (currentState) => {
        if (toggleState === currentState)
            toggle();
    }

    return (
        <div className="box-sh">
            <div
                className="toggle-icon"
                tabIndex="0"
                role="button"
                onKeyPress={() => checkAndToggle(true)}
                onClick={() => checkAndToggle(true)}
            >
                <img alt="" src="images/icons/pin.png" />
            </div>
            <div className="toggle-map">
                <MuiThemeProvider>
                    <Toggle
                        label=""
                        defaultToggled={toggleState}
                        onToggle={toggle}
                    />
                </MuiThemeProvider>
            </div>
            <div
                className="toggle-icon"
                tabIndex="0"
                role="button"
                onKeyPress={() => checkAndToggle(false)}
                onClick={() => checkAndToggle(false)}
            >
                <i className="fa fa-th-large" aria-hidden="true" />
            </div>
        </div>
    );
}

ToggleWidget.propTypes = {
    toggle: PropTypes.func.isRequired,
    toggleState: PropTypes.bool.isRequired,
}


const MapWrapper = ({ showFilter, dev_opex }) => (
    <AltContainer stores={{
    positions: MapPositionStore,
    measures: MeasureStore,
    configs: ConfigStore,
}}
    >
        <DeviceMapWrapper
            showFilter={showFilter}
            dev_opex={dev_opex}
        />
    </AltContainer>
)

MapWrapper.propTypes = {
    dev_opex: PropTypes.shape({}).isRequired,
    showFilter: PropTypes.shape({}).isRequired,
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
            if (Object.prototype.hasOwnProperty.call(config, key)) {
                this.paginationParams[key] = config[key];
            }
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
        const res = { ...this.paginationParams, ...this.filterParams};

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
const device_list_socket = null;

class DevicesComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            displayList: true,
            showFilter: false,
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
        const { showFilter } = this.state;
        this.setState({ showFilter: !showFilter });
    }


    toggleDisplay() {
        const { displayList } = this.state;
        const newDisplay = !displayList;
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
        const { showFilter, displayList } = this.state;
        const { t, location: { query } } = this.props;

        const deviceId = 'detail' in query ? query.detail : null;
        const displayToggle = (
            <ToggleWidget
                toggleState={displayList}
                toggle={this.toggleDisplay}
            />
        );

        const show_pagination = displayList;
        return (
            <div className="full-device-area">
                <AltContainer store={DeviceStore}>
                    <NewPageHeader title={t('devices:title')} subtitle="" icon="device">
                        <FilterLabel ops={this.dev_opex} text={t('devices:header.filter.alt2')} />
                        <Pagination show_pagination={show_pagination} ops={this.dev_opex} />
                        <OperationsHeader
                            displayToggle={displayToggle}
                            toggleSearchBar={this.toggleSearchBar.bind(this)}
                            t={t}
                        />
                    </NewPageHeader>
                    {displayList ? (
                        <DeviceCardList
                            deviceid={deviceId}
                            toggle={displayToggle}
                            dev_opex={this.dev_opex}
                            showFilter={showFilter}
                        />
                      ) : (
                          <MapWrapper
                              toggle={displayToggle}
                              showFilter={showFilter}
                              dev_opex={this.dev_opex}
                          />
                      )}
                </AltContainer>
            </div>
        );
    }
}

function OperationsHeader({ toggleSearchBar, t, displayToggle }) {
    return (
        <div className="col s5 pull-right pt10">
            <div
                className="searchBtn"
                title={t('devices:header.filter.alt')}
                tabIndex="0"
                role="button"
                onKeyPress={toggleSearchBar}
                onClick={toggleSearchBar}
            >
                <i className="fa fa-search" />
            </div>
            {displayToggle}
            <Can do="modifier" on="device-manager-devices">
                <DojotBtnLink
                    responsive="true"
                    onClick={() => FormActions.set(null)}
                    label={t('devices:header.new.label')}
                    alt={t('devices:header.new.alt')}
                    icon="fa fa-plus"
                    className="w130px"
                />
            </Can>
        </div>
    );
}

OperationsHeader.defaultProps = {
    displayToggle: null,
}

OperationsHeader.propTypes = {
    displayToggle: PropTypes.shape({}),
    t: PropTypes.func.isRequired,
    toggleSearchBar: PropTypes.func.isRequired,
}


const Devices = withNamespaces()(DevicesComponent);
export { Devices };
