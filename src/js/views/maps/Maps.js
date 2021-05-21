/* eslint-disable */
import React, { Component, Fragment } from 'react';
import { ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import { BASE_URL, PROXY_URL } from 'Src/config';
import * as pins from '../../config';
import util from '../../comms/util/util';
import ContextMenuComponent from './ContextMenuComponent';

require('leaflet.markercluster');


const OpenStreetMapMapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
});

const EsriWorldImagery = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        maxZoom: 17,
        attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
);


function getPin(device, config) {
    if (device.active_tracking) {
        return pins.mapPinYellow;
    }

    const varToMeasure = `_${config.measureAttribute}`;

    if (device.hasOwnProperty('unique_key')) {
        return pins.mapPinGreen;
    }

    if (device.hasOwnProperty(varToMeasure) && config.mapColorActive) {
        for (const index in config.range) {
            if (config.range.hasOwnProperty(index) && config.range[index].value <= device[varToMeasure]['0'].value) {
                const method = `mapPin${config.range[index].pin}`;
                return pins[method];
            }
        }
    }
    return pins.mapPinBlack;
}


class CustomMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cm_visible: false,
            mapId: `map${util.guid()}`,
            contextMenuInfo: {},
        };
        this.map = null;
        this.markers = null;
        this.subset = [];
        this.mkrHelper = {};
        this.handleBounds = this.handleBounds.bind(this);
        this.updateMarkers = this.updateMarkers.bind(this);
        this.handleDyData = this.handleDyData.bind(this);
        this.handleTracking = this.handleTracking.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.closeContextMenu = this.closeContextMenu.bind(this);
        this.creatingDynamicPoint = this.creatingDynamicPoint.bind(this);
        this.createMarker = this.createMarker.bind(this);
    }

    componentDidMount() {
        const { zoom, websocket } = this.props;
        this.map = L.map(this.state.mapId, {
            zoom,
            center: [51.505, -0.09],
            layers: [OpenStreetMapMapnik],
        });

        const overlays = {
            Map: OpenStreetMapMapnik,
            Satelite: EsriWorldImagery,
        };
        L.control.layers(overlays)
            .addTo(this.map);

        this.markers = L.markerClusterGroup({
            chunkedLoading: true,
            disableClusteringAtZoom: 10,
            iconCreateFunction(cluster) {
                return pins.mapPinBlack;
            },
        })
            .addLayers([]);

        this.updateMarkers();

        // Adding callback to the Websocket instance
        if (websocket) {
            websocket.setCallback(this.handleDyData);
            websocket.init();
        }
    }

    componentDidUpdate() {
        const { markersData } = this.props;
        if (!this.map.hasLayer(OpenStreetMapMapnik)) {
            this.map.addLayer(OpenStreetMapMapnik);
        }

        // check if data has changed
        if (JSON.stringify(markersData) !== JSON.stringify(this.subset)) {
            this.updateMarkers();
        }
    }

    componentWillUnmount() {
        this.map.eachLayer((layer) => {
            layer.remove();
        });
        this.map.remove();
    }

    handleContextMenu(e, deviceId, tracking) {
        const { allowContextMenu } = this.props;
        if (!allowContextMenu) return false;

        e.originalEvent.preventDefault();
        this.contextMenuInfo = {
            allow_tracking: tracking,
            event: e.originalEvent,
            root: this.root,
            device_id: deviceId,
        };
        this.setState({
            cm_visible: true,
            contextMenuInfo: this.contextMenuInfo,
        });
    }

    closeContextMenu() {
        this.setState({
            cm_visible: false,
        });
    }

    handleBounds() {
        // set initial map center or boundaries
        const { markersData } = this.props;
        const positionList = [];
        markersData.forEach((element, index) => {
            positionList.push(element.pos);
        });

        if (positionList.length === 0) {
            const temporaryCenter = [-20.90974, -48.83651];
            this.map.panTo(temporaryCenter);
        } else if (positionList.length > 1) {
            this.bounds = L.latLngBounds(positionList);
            this.map.fitBounds(this.bounds);
        } else {
            this.map.panTo(positionList[0]);
        }
    }

    handleDyData(socketData) {
        this.creatingDynamicPoint(socketData);
    }

    creatingDynamicPoint(measureData) {
        // 1. get device data
        let devIndex = 0;
        let dev = null;
        const { markersData } = this.props;
        const now = measureData.metadata.timestamp;
        const deviceId = measureData.metadata.deviceid;

        for (devIndex in markersData) {
            if (markersData[devIndex].id === deviceId) {
                dev = markersData[devIndex];
            }
        }
        if (dev == null) return; // was received a valid device

        // 2. trying to find the dynamic geo-point attr
        let geoLabel = null;
        for (const label in measureData.attrs) {
            if (dev.attr_label == label) geoLabel = label;
        }

        if (geoLabel == null) return; // no attribute with position

        // 3. duplicate point info
        const myPoint = { ...dev };

        // 4. create position info
        const position = util.parserPosition(measureData.attrs[geoLabel]);
        myPoint.pos = L.latLng(position[0], position[1]);
        myPoint.timestamp = util.iso_to_date(now);

        // 5. if tracking is not active
        if (!myPoint.active_tracking) {
            // 5. a remove last location point
            let indexLastPoint = -1;
            for (indexLastPoint in this.mkrHelper) {
                if (this.mkrHelper[indexLastPoint].options.id === deviceId) {
                    break;
                }
            }

            this.markers.removeLayer(this.mkrHelper[indexLastPoint]);
            delete this.mkrHelper[indexLastPoint];
        }

        // 6. creates and sets new Marker point
        const newMkr = this.createMarker(myPoint);
        this.markers.addLayer(newMkr, { autoPan: false });
        // 7. sets in device_id index in mkrHelper
        this.mkrHelper[newMkr.options.index] = newMkr;

        // 8. Bonus issue
        // if we've lost some points when remove tracking,
        // we need to update the store and use the data from there
        //     MeasureActions.updateGeoLabel( {geoLabel, deviceID});
        //     MeasureActions.updateTracking(measureData);
        // also we need update measureReload and check it in shouldComponentUpdate
    }


    createMarker(marker) {
        const {
            pos, name, allow_tracking, id, pin, timestamp,
        } = marker;
        const hcm = this.handleContextMenu;
        const mkr = L.marker(pos, {
            title: name,
            allow_tracking,
            id,
            icon: pin,
            index: util.sid(),
        });

        if (timestamp) {
            mkr.bindPopup(`${name} : ${timestamp}`);
        } else {
            mkr.bindPopup(name);
        }

        mkr.on('click', (a) => {
            hcm(a, a.target.options.id, a.target.options.allow_tracking);
            a.originalEvent.preventDefault();
        });
        return mkr;
    }

    updateMarkers() {
        const { markersData } = this.props;
        this.subset = JSON.parse(JSON.stringify(markersData));
        this.markers.clearLayers();
        this.mkrHelper = {};
        markersData.forEach((marker) => {
            const mkr = this.createMarker(marker);
            this.markers.addLayer(mkr);
            this.mkrHelper[mkr.options.index] = mkr; // creating a map to helps find the device
        });
        this.markers.addTo(this.map);
        this.handleBounds();
    }

    handleTracking(deviceId) {
        this.props.toggleTracking(deviceId);
        this.setState({ cm_visible: false });
    }

    handleMapClick() {
        const { allowContextMenu } = this.props;
    }

    render() {
        return (
            <Fragment>
                <div onClick={this.handleMapClick} id={this.state.mapId} />
                {this.state.cm_visible ? (
                    <ContextMenuComponent
                        closeContextMenu={this.closeContextMenu}
                        handleTracking={this.handleTracking}
                        metadata={this.state.contextMenuInfo}
                    />
                ) : null}
            </Fragment>
        );
    }
}

const socketio = require('socket.io-client');

class MapSocket {
    constructor(props) {
        this.callback = null;
        this.socketInstance = null;
        this.token_url = `${PROXY_URL}stream/socketio`;
        this.token = null;
    }

    setCallback(callbackHandleData) {
        if (!this.callback)
            this.callback = callbackHandleData;
    }

    init() {
        if (this.socketInstance) {
            // The socket has already started.
            return;
        }
        // Step 1: fetching Token
        util._runFetch(this.token_url)
            .then((reply) => {
                this.token = reply.token;
                // Step 2: initiate Socket
                this.socketInstance = socketio(BASE_URL, {
                    query: `token=${this.token}`,
                    transports: ['polling'],
                });
                this.socketInstance.on('all', (data) => {
                    this.callback(data);
                });

                this.socketInstance.on('error', (data) => {
                    console.error("Websocket error: ", data);
                });
            })
            .catch((error) => {
                console.error("An error occurred to  fetch token to socket");
            });

    }

    teardown() {
        if (this.socketInstance)
            this.socketInstance.close();
    }
}


class SmallPositionRenderer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isTerrain: true,
            layers: [],
            websocket: null,
            loadedLayers: false,
            zoom: (this.props.zoom ? this.props.zoom : this.props.config.mapZoom ? this.props.config.mapZoom : 12),
        };

        this.toggleLayer = this.toggleLayer.bind(this);
        this.layers = [];
    }

    componentDidMount() {

        if (!this.state.loadedLayers) {
            const layers = this.props.config.mapObj;
            for (const index in layers) {
                layers[index].isVisible = true;
            }
            this.setState({
                loadedLayers: true,
                layers,
            });
        }
        // socket to be used for position updating
        const websocket = new MapSocket();
        this.setState({
            websocket,
        });

    }

    componentWillUnmount() {
        this.state.websocket.teardown();
    }


    toggleLayer(id) {
        const { layers } = this.state;
        for (const index in layers) {
            if (layers[index].id === id) {
                layers[index].isVisible = !layers[index].isVisible;
            }
        }
        this.setState({ layers });
    }


    render() {
        const parsedEntries = [];
        for (const k in this.props.staticDevices) {
            const device = this.props.staticDevices[k];
            if (device.is_visible) {
                parsedEntries.push({
                    id: device.id,
                    pos: L.latLng(device.sp_value[0], device.sp_value[1]),
                    name: device.label,
                    pin: getPin(device, this.props.config),
                    timestamp: device.timestamp,
                    tracking: device.tracking,
                    key: device.unique_key ? device.unique_key : device.id,
                });
            }
        }

        for (const k in this.props.dynamicDevices) {
            const device = this.props.dynamicDevices[k];
            let attr_label = '';
            if (device.dp_metadata) {
                attr_label = device.dp_metadata.attr_label;
            }

            for (const y in device.dy_positions) {
                if (device.is_visible) {
                    const tmp = device.dy_positions[y];
                    tmp.active_tracking = device.active_tracking;
                    if (tmp.position &&
                        tmp.position[0] &&
                        tmp.position[1] &&
                        typeof tmp.position[0] === 'number' &&
                        typeof tmp.position[1] === 'number') {

                        parsedEntries.push({
                            id: tmp.id,
                            pos: L.latLng(
                                tmp.position[0],
                                tmp.position[1],
                            ),
                            attr_label,
                            name: tmp.label,
                            pin: getPin(tmp, this.props.config),
                            timestamp: tmp.timestamp,
                            active_tracking: tmp.active_tracking,
                            allow_tracking: device.allow_tracking,
                            key: tmp.unique_key
                                ? tmp.unique_key
                                : tmp.id,
                        });
                    }
                }
            }
        }

        return (
            <div className='graphLarge'>
                <CustomMap websocket={this.state.websocket} key={util.guid()} toggleTracking={this.props.toggleTracking}
                    allowContextMenu={this.props.allowContextMenu} zoom={this.state.zoom}
                    markersData={parsedEntries} />
                {(this.props.showLayersIcons && this.state.layers.length)
                    ? (
                        <div className="col s12 layer-box">
                            {this.state.layers.map(lyr => (
                                <LayerBox
                                    key={lyr.id}
                                    toggleLayer={this.toggleLayer}
                                    config={lyr}
                                />
                            ))}
                        </div>
                    )
                    : null}
            </div>
        );
    }
}


class LayerBox extends Component {
    constructor(props) {
        super(props);
        // this.state = { visible: true };
        this.toggleLayer = this.toggleLayer.bind(this);
    }

    toggleLayer() {
        this.props.toggleLayer(this.props.config.id);
        // this.setState({visible: !this.state.visible});
    }

    render() {
        const corner1 = L.latLng(this.props.config.overlay_data.corner1.lat, this.props.config.overlay_data.corner1.lng);
        const corner2 = L.latLng(this.props.config.overlay_data.corner2.lat, this.props.config.overlay_data.corner2.lng);
        const layerMapBounds = L.latLngBounds(corner1, corner2);
        const layerOpacity = 0.3;
        const imageOverlay = this.props.config.isVisible ?
            <ImageOverlay opacity={layerOpacity} bounds={layerMapBounds}
                url={this.props.config.overlay_data.path} /> : null;
        return (
            <div className="layer-mr">
                <div title={this.props.config.description}
                    className={`layer-div ${this.props.config.isVisible ? 'active-btn' : ''}`}
                    onClick={this.toggleLayer}>
                    <i className="fa fa-map" />
                </div>
                {imageOverlay}
            </div>
        );
    }
}


export { SmallPositionRenderer };
