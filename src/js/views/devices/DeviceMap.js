/* eslint-disable */
import React, { Component } from 'react';
import Sidebar from '../../components/DeviceRightSidebar';
import { Filter } from "../maps/Manipulation";
import { Loading } from '../../components/Loading';
import TrackingActions from '../../actions/TrackingActions';
import MapPositionActions from "../../actions/MapPositionActions";
import { withNamespaces } from 'react-i18next';
import MultipleMapWithSocket from '../maps/MultipleLeafMap.jsx';

let activeTracks = [];

class DeviceMapWrapperComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            didMount: false,
        };
    }

    componentDidMount() {
        let filter = {
            sortBy: 'label',
            page_size: 5000,
            page_num: 1
        };
        MapPositionActions.fetchDevices.defer(filter);
        this.setState({
            didMount: true
        });
    }

    render() {
        if (!this.state.didMount || this.props.positions.loading) {
            return <Loading />
        }

        const { t } = this.props;
        return (
            <DeviceMap Config={this.props.configs}
                trackedDevices={this.props.measures.tracking}
                devices={this.props.positions.devicesPos}
                showFilter={this.props.showFilter}
                dev_opex={this.props.dev_opex} t={t} />
        );
    }
}


class DeviceMap extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isDisplayList: true,
            filter: '',
            displayMap: {},
            didMount: false,
            deviceLabels: {},
            staticDevices: [],
            selectedDevice: {}
        };

        this.handleViewChange = this.handleViewChange.bind(this);
        this.showSelected = this.showSelected.bind(this);
        this.selectedDevice = this.selectedDevice.bind(this);
        this.toggleTracking = this.toggleTracking.bind(this);
        this.countVisibleDevices = this.countVisibleDevices.bind(this);
        this.showAll = this.showAll.bind(this);
        this.hideAll = this.hideAll.bind(this);
        this.toggleVisibility = this.toggleVisibility.bind(this);

        this.dynamicDevices = [];
        this.activeTracks = [];
    }

    countVisibleDevices(devs) {
        let count = 0;
        for (const k in devs) {
            if (this.state.displayMap[this.props.devices[k].id]) count++;
        }
        return count;
    }


    componentDidMount() {
        this.showAll();
        const staticDevices = [];
        this.dynamicDevices = [];
        const deviceLabels = {};

        for (const k in this.props.devices) {
            let device = this.props.devices[k];
            deviceLabels[device.id] = device.label;
            if (device.has_dynamic_position) {
                // request dynamic data and allow tracking
                device.allow_tracking = false;
                this.dynamicDevices.push(device);
                TrackingActions.fetch.defer(device.dp_metadata.id,
                    device.dp_metadata.attr_label, 1);
            }
            if (device.has_static_position) {
                device.allow_tracking = false;
                staticDevices.push(device);
            }
        }

        this.setState({
            staticDevices: staticDevices,
            didMount: true,
            deviceLabels: deviceLabels
        });
    }

    handleViewChange() {
        this.setState({ isDisplayList: !this.state.isDisplayList });
    }

    selectedDevice(device) {
        const selectedDevice = this.state.selectedDevice;
        if (selectedDevice.hasOwnProperty(device)) {
            selectedDevice[device] = !selectedDevice[device];
        } else {
            selectedDevice[device] = true;
        }
        this.setState({ selectedDevice });
    }

    toggleVisibility(device_id) {
        const displayMap = this.state.displayMap;
        displayMap[device_id] = !displayMap[device_id];
        this.setState({ displayMap });
    }

    hideAll() {
        const displayMap = this.state.displayMap;
        for (const k in displayMap) {
            displayMap[k] = false;
        }
        this.setState({ displayMap });
    }

    showAll() {
        const displayMap = {};
        for (const k in this.props.devices) {
            displayMap[this.props.devices[k].id] = true;
        }
        this.setState({ displayMap });
    }


    toggleTracking(device_id) {
        let device = null;
        for (const k in this.props.devices) {
            device = this.props.devices[k];
            if (device.id == device_id)
                break;
        }

        if (!device.active_tracking) {
            // enabling device' tracking
            TrackingActions.fetch.defer(device.dp_metadata.id,
                device.dp_metadata.attr_label, 50);
            device.active_tracking = true;
            this.activeTracks.push(device_id);
        }
        else {
            // disabling device' tracking
            device.active_tracking = false;
            // removes device from array of activeTracks; 
            this.activeTracks = this.activeTracks.filter(i => i !== device_id);
            // request again the last geo of this devices;
            TrackingActions.fetch.defer(device.dp_metadata.id,
                device.dp_metadata.attr_label, 1);
        }
    }

    showSelected(device) {
        if (this.state.selectedDevice.hasOwnProperty(device)) {
            return this.state.selectedDevice[device];
        }
        return false;
    }

    render() {
        const { t } = this.props;
        if (!this.state.didMount)
            return <Loading />;
        /*
                for (const k in this.dynamicDevices) {
                    const device = this.dynamicDevices[k];
                    if (this.props.trackedDevices.hasOwnProperty(device.id) && this.state.displayMap[device.id]) {
                        this.dynamicDevices[k].dy_positions = [];
                        this.dynamicDevices[k].dy_positions = this.props.trackedDevices[device.id].map(
                            (e, k) => {
                                const updated = e;
                                updated.id = device.id;
                                updated.unique_key = `${device.id}_${k}`;
                                updated.label = device.label;
                                updated.timestamp = e.timestamp;
                                return updated;
                            }
                        );
                    }
                }
        */
        this.metaData = { alias: t('devices:device') };
        this.props.dev_opex.setFilterToMap();

        /**
         Remove or not depending visibility
        */
        const myStaticDevices = this.state.staticDevices.filter(
            element => {
                return this.state.displayMap[element.id];
            });

        const myDynamicDevices = [];
        Object.values(this.props.trackedDevices).forEach(
            element => {
                const el = { ...element[0] };
                el.label = this.state.deviceLabels[el.device_id];
                if (this.state.displayMap[element[0].device_id])
                    myDynamicDevices.push(el);
            });

        /*
         Filtering on Sidebar
        */
        let deviceWithData = this.props.devices.filter(dev => dev.has_static_position || dev.has_dynamic_position);
        const nVisibleDevices = this.countVisibleDevices(deviceWithData);
        const displayDevicesCount = `${t('text.showing')} ${nVisibleDevices} ${t('text.of')} ${deviceWithData.length} ${t('devices:device')}(s)`;



        return <div className="fix-map-bug">
            <div className="flex-wrapper">
                <div className="map-filter-box">
                    <Filter showPainel={this.props.showFilter} metaData={this.metaData} ops={this.props.dev_opex} fields={withNamespaces()(DevFilterFields)} />
                </div>

                <div className="deviceMapCanvas deviceMapCanvas-map col m12 s12 relative">
                    <MultipleMapWithSocket
                        initialZoom={8}
                        staticDevices={myStaticDevices}
                        dynamicDevices={myDynamicDevices}
                    />
                    <Sidebar deviceInfo={displayDevicesCount}
                        toggleVisibility={this.toggleVisibility}
                        devices={deviceWithData}
                        hideAll={this.hideAll}
                        showAll={this.showAll}
                        displayMap={this.state.displayMap} />
                </div>
            </div>
        </div>;
    }
}

class DevFilterFields extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { t } = this.props;
        return <div className="col s12 m12">
            <div className="col s5 m5">
                <div className="dev_field_filter">
                    <label htmlFor="fld_device_name">{t('devices:title')}</label>
                    <input id="fld_device_name" type="text" className="form-control form-control-lg margin-top-mi7px" placeholder={t('text.name')} value={this.props.fields.label} name="label" onChange={this.props.onChange} onKeyUp={this.props.KeyUp} />
                </div>
            </div>
            <div className="col s1 m1" />
        </div>;
    }
}
const DeviceMapWrapper = withNamespaces()(DeviceMapWrapperComponent);
export { DeviceMapWrapper };
