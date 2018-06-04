import React, {Component} from 'react';
import TrackingActions from '../../actions/TrackingActions';
import {Link} from 'react-router'
import {Map, Marker, ImageOverlay, TileLayer, Tooltip, ScaleControl, Polyline} from 'react-leaflet';
import L from 'leaflet'
import Script from 'react-load-script';
import ReactResizeDetector from 'react-resize-detector';
import Sidebar from '../../components/DeviceRightSidebar';
import config from '../../config'

let trackingPin = L.divIcon({className: 'icon-marker bg-tracking-marker'});
let listLatLngs = [];

class PositionRenderer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,  // is ctxMenu visible?
            selected_device_id: -1,
            isTerrain: true,
            selectedPin: true,
            center: (this.props.center ? this.props.center : [-21.277057, -47.9590129]),
            zoom: (this.props.zoom ? this.props.zoom : 2)
        };

        this.setTiles = this.setTiles.bind(this);
        this.handleTracking = this.handleTracking.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleCenter = this.handleCenter.bind(this);
    }

    componentDidMount() {

        if (this.leafletMap !== undefined) {

            // console.log('will attempt to add layer', MQ.mapLayer, this.leafletMap);
            // mq = require('..//../external/mq-map.js');

            let mapLayer = MQ.mapLayer();
            mapLayer.addTo(this.leafletMap.leafletElement);

            L.control.layers({
                'Map': mapLayer,
                'Hybrid': MQ.hybridLayer(),
                'Satellite': MQ.satelliteLayer()
            }).addTo(this.leafletMap.leafletElement);
        }
    }

    handleTracking(device_id) {
        this.props.toggleTracking(device_id);

        // closing ctxMenu
        this.setState({visible: false});
    }

    // context menu based at
    // https://codepen.io/devhamsters/pen/yMProm
    handleContextMenu(e, device_id) {
        if (!this.props.allowContextMenu) {
            return false;
        }
        let event = e.originalEvent;
        event.preventDefault();
        this.setState({visible: true, selected_device_id: device_id});

        // this.refs.map.leafletElement.locate()
        const clickX = event.clientX;
        const clickY = event.clientY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const rootW = this.root.offsetWidth;
        const rootH = this.root.offsetHeight;

        const right = (screenW - clickX) > rootW;
        const left = !right;
        const top = (screenH - clickY) > rootH;
        const bottom = !top;
        if (right)
            this.root.style.left = `${clickX + 5}px`;
        if (left)
            this.root.style.left = `${clickX - rootW - 5}px`;
        if (top)
            this.root.style.top = `${clickY + 5}px`;
        if (bottom)
            this.root.style.top = `${clickY - rootH - 5}px`;

    };

    resize() {
        if (this.leafletMap !== undefined) {
            this.leafletMap.leafletElement.invalidateSize();
        }
    }

    setTiles(isMap) {
        this.setState({isTerrain: isMap});
    }

    handleCenter() {
        if (this.props.center) {
            this.setState({center: this.props.center})
        } else {
            this.setState({center: [-21.277057, -47.9590129]})
        }
    }

    render() {
        function getPin(device) {
            if (device.hasOwnProperty('unique_key')) {
                return trackingPin;
            } else {
                return config.SinrSignalLevel(device.hasOwnProperty('_sinr') ? device._sinr[0].value : -1);
            }
        }

        let parsedEntries = this.props.devices.reduce((result, k) => {
            if (k.position !== undefined) {
                result.push({
                    id: k.id,
                    pos: k.position,
                    name: k.label,
                    pin: getPin(k),
                    timestamp: k.timestamp,
                    tracking: k.tracking,
                    key: (k.unique_key ? k.unique_key : k.id)
                });
            }

            return result;
        }, []);

        const contextMenu = this.state.visible ? (
            <div ref={ref => {
                this.root = ref
            }} className="contextMenu">
                <Link to={"/device/id/" + this.state.selected_device_id + "/detail"} title="View details">
                    <div className="contextMenu--option cmenu">
                        <i className="fa fa-info-circle"/>Details
                    </div>
                </Link>
                <div className="contextMenu--option cmenu"
                     onClick={() => {
                         this.handleTracking(this.state.selected_device_id)
                     }}>
                    <img src={"images/icons/location.png"}/>Toggle tracking
                </div>
            </div>
        ) : (
            null
        );

        //Get list of positions for each device
        for (let k in this.props.listPositions) {
            listLatLngs[k] = [];
            for (let j in this.props.listPositions[k]) {
                listLatLngs[k].push(this.props.listPositions[k][j].position)
            }
        }

        return (
            <Map center={this.props.center ? this.props.center : this.state.center}
                 zoom={this.state.zoom}
                 ref={m => {
                     this.leafletMap = m;
                 }}>

                {process.env.MAP_HAS_OVERLAY_ENV ? <LayerBox/> : ''}

                {contextMenu}
                <ReactResizeDetector handleWidth onResize={this.resize.bind(this)}/>

                {parsedEntries.map((k) => {
                    return (
                        <Marker
                            onContextMenu={(e) => {
                                this.handleContextMenu(e, k.id);
                            }}
                            onClick={(e) => {
                                this.handleContextMenu(e, k.id);
                            }}
                            position={k.pos} key={k.key} icon={k.pin}>
                            <Tooltip>
                                <span>{k.name} : {k.timestamp}</span>
                            </Tooltip>
                            {listLatLngs[k.id] && k.tracking ? (
                                <Polyline positions={listLatLngs[k.id]} color='#7fb2f9' dashArray='10,10'
                                          repeatMode={false}/>
                            ) : null}
                        </Marker>
                    )
                })}
                <ScaleControl/>
            </Map>
        )
    }
}


class LayerBox extends Component {
    constructor(props) {
        super(props);
        this.state = {visible: true};
        this.toggleLayer = this.toggleLayer.bind(this);
    }

    toggleLayer() {
        this.setState({visible: !this.state.visible});
    }

    render() {

        let config = process.env.MAP_OVERLAY_JSON_ENV;
        let corner1 = L.latLng(config.corner1.lat, config.corner1.lng);
        let corner2 = L.latLng(config.corner2.lat, config.corner2.lng);
        const layerMapBounds = L.latLngBounds(corner1, corner2);
        const layerOpacity = 0.3;
        const imageOverlay = this.state.visible ? (
            <ImageOverlay
                opacity={layerOpacity}
                bounds={layerMapBounds}
                url={config.path}/>) : null;

        return (
            <div className="col s12">
                <div className="layer-div" onClick={this.toggleLayer}>
                    <img src={'images/layers.png'}/>
                </div>
                {imageOverlay}
            </div>
        )
    }
}

class DeviceMap extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isDisplayList: true,
            filter: '',
            displayMap: {},
            selectedDevice: {},
            templates_id: {},
            listOfDevices: [],
            mapquest: false
        };

        this.handleViewChange = this.handleViewChange.bind(this);
        this.applyFiltering = this.applyFiltering.bind(this);
        this.showSelected = this.showSelected.bind(this);
        this.selectedDevice = this.selectedDevice.bind(this);
        this.getDevicesWithPosition = this.getDevicesWithPosition.bind(this);

        this.toggleTracking = this.toggleTracking.bind(this);

        this.showAll = this.showAll.bind(this);
        this.hideAll = this.hideAll.bind(this);
        this.toggleDisplay = this.toggleDisplay.bind(this);

        this.mqLoaded = this.mqLoaded.bind(this);
    }

    componentDidMount() {
        this.showAll();
    }

    mqLoaded() {
        this.setState({mapquest: true});
    }

    handleViewChange() {
        this.setState({isDisplayList: !this.state.isDisplayList})
    }

    selectedDevice(device) {
        let selectedDevice = this.state.selectedDevice;
        if (selectedDevice.hasOwnProperty(device)) {
            selectedDevice[device] = !selectedDevice[device];
        } else {
            selectedDevice[device] = true;
        }
        this.setState({selectedDevice: selectedDevice});
    }

    hideAll() {
        let displayMap = this.state.displayMap;
        for (let k in this.props.devices) {
            let device = this.props.devices[k];
            displayMap[device.id] = false;
        }
        this.setState({displayMap: displayMap});
    }

    showAll() {
        // TODO filter using user queries
        let displayMap = this.state.displayMap;
        for (let k in this.props.devices) {
            let device = this.props.devices[k];
            displayMap[device.id] = true;
        }
        this.setState({displayMap: displayMap});
    }

    applyFiltering(devices) {
        let list = [];
        for (let k in devices) {
            if (this.state.displayMap[devices[k].id]) {
                list.push(devices[k]);
            }
        }
        list.sort((a, b) => {
            if (a.updated > b.updated) {
                return 1;
            } else {
                return -1;
            }
        });
        return list;
    }

    toggleTracking(device_id) {
        if (!this.props.tracking.hasOwnProperty(device_id)) {
            for (let k in this.props.devices[device_id].attrs) {
                for (let j in this.props.devices[device_id].attrs[k]) {
                    if (this.props.devices[device_id].attrs[k][j].value_type === "geo:point") {
                        TrackingActions.fetch(device_id, this.props.devices[device_id].attrs[k][j].label);
                        this.props.devices[device_id].tracking = true;
                    }
                }
            }
        } else {
            TrackingActions.dismiss(device_id);
            this.props.devices[device_id].tracking = false;
        }
    }

    showSelected(device) {
        if (this.state.selectedDevice.hasOwnProperty(device)) {
            return this.state.selectedDevice[device];
        }
        return false;
    }

    toggleDisplay(device) {
        let displayMap = this.state.displayMap;
        if (displayMap.hasOwnProperty(device)) {
            displayMap[device] = !displayMap[device];
        } else {
            displayMap[device] = false;
        }
        this.setState({displayMap: displayMap});
    }

    getDevicesWithPosition(devices) {
        function parserPosition(position) {
            let parsedPosition = position.split(", ");
            return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
        }

        let validDevices = [];
        for (let k in devices) {
            for (let j in devices[k].attrs) {
                for (let i in devices[k].attrs[j]) {
                    if (devices[k].attrs[j][i].type === "static") {
                        if (devices[k].attrs[j][i].value_type === "geo:point") {
                            devices[k].position = parserPosition(devices[k].attrs[j][i].static_value);
                        }
                    }
                }
            }

            devices[k].select = this.showSelected(k);
            if (devices[k].position !== null && devices[k].position !== undefined) {
                validDevices.push(devices[k]);
            }
        }
        return validDevices;
    }

    render() {
        let validDevices = this.getDevicesWithPosition(this.props.devices);
        let filteredList = this.applyFiltering(validDevices);

        const device_icon = (<img src={'images/icons/chip.png'}/>);
        const displayDevicesCount = "Showing " + validDevices.length + " device(s)";

        let pointList = [];
        if (filteredList !== undefined && filteredList !== null) {
            for (let k in filteredList) {
                if (filteredList.hasOwnProperty(k)) {
                    let device = filteredList[k];
                    device.hasPosition = device.hasOwnProperty('position');
                    if (this.props.tracking.hasOwnProperty(filteredList[k].id) && (!device.hide)) {
                        pointList = pointList.concat(this.props.tracking[filteredList[k].id].map((e, k) => {
                            let updated = e;
                            updated.id = device.id;
                            updated.unique_key = device.id + "_" + k;
                            updated.label = device.label;
                            updated.timestamp = e.timestamp;
                            return updated;
                        }));
                    }
                    pointList.push(device);
                }
            }
        }

        return <div className="fix-map-bug">
            <div className="flex-wrapper">
              <div className="deviceMapCanvas deviceMapCanvas-map col m12 s12 relative">
                <Script url="https://www.mapquestapi.com/sdk/leaflet/v2.s/mq-map.js?key=zvpeonXbjGkoRqVMtyQYCGVn4JQG8rd9" onLoad={this.mqLoaded} />
                {this.state.mapquest ? <PositionRenderer devices={pointList} toggleTracking={this.toggleTracking} allowContextMenu={true} listPositions={this.props.tracking} showPolyline={true} /> : <div className="row full-height relative">
                    <div className="background-info valign-wrapper full-height">
                      <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center" />
                    </div>
                  </div>}
                    <Sidebar deviceInfo={displayDevicesCount} toggleVisibility={this.toggleVisibility} devices={this.validDevices} hideAll={this.hideAll} showAll={this.showAll} displayMap={this.state.displayMap} />
              </div>
            </div>
        </div>;
    }
}

export {DeviceMap, PositionRenderer};
