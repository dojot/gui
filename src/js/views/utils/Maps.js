/* eslint-disable */
import React, { Component } from 'react';
import { ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import * as pins from '../../config';
import util from '../../comms/util';
import ContextMenuComponent from './maps/ContextMenuComponent';

require('leaflet.markercluster');

let deviceListSocket = null;

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
    // create map
        const { zoom } = this.props;
        this.map = L.map('map', {
            zoom,
            center: [51.505, -0.09],
            layers: [OpenStreetMapMapnik],
        });

        const overlays = { Map: OpenStreetMapMapnik, Satelite: EsriWorldImagery };
        L.control.layers(overlays).addTo(this.map);

        // this.markers = L.layerGroup().addTo(this.map); // without clustering
        this.markers = L.markerClusterGroup({
            chunkedLoading: true,
            disableClusteringAtZoom: 10,
            iconCreateFunction(cluster) {
                return pins.mapPinBlack;
            },
        }).addLayers([]);

        this.updateMarkers();
    }

    componentDidUpdate() {
        const { markersData } = this.props;
        // reseting layer to the map
        if (!this.map.hasLayer(OpenStreetMapMapnik)) {
            this.map.addLayer(OpenStreetMapMapnik);
        }
        // check if data has changed
        if (JSON.stringify(markersData) !== JSON.stringify(this.subset)) {
            this.updateMarkers();
        }
    }

    componentWillUnmount() {
        this.map.removeLayer(OpenStreetMapMapnik);
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
        this.setState({ cm_visible: true, contextMenuInfo: this.contextMenuInfo });
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
        for (const label in measureData.attrs) { if (dev.attr_label == label) geoLabel = label; }

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
                if (this.mkrHelper[indexLastPoint].options.id === deviceId) { break; }
            }

            this.markers.removeLayer(this.mkrHelper[indexLastPoint]);
            delete this.mkrHelper[indexLastPoint];
        }

        // 6. creates and sets new Marker point
        const newMkr = this.createMarker(myPoint);
        this.markers.addLayer(newMkr, {autoPan: false});
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

        if (timestamp) { mkr.bindPopup(`${name} : ${timestamp}`); } else { mkr.bindPopup(name); }

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
        if (!allowContextMenu) {
            return false;
        }
    }

    render() {
    // console.log("5. CustomMap - Render: ", this.props);
        return (
            <div className="fix-map-bug">
                <div onClick={this.handleMapClick} id="map" />
                {this.state.cm_visible ? (
                    <ContextMenuComponent
                        closeContextMenu={this.closeContextMenu}
                        handleTracking={this.handleTracking}
                        metadata={this.state.contextMenuInfo}
                    />
                ) : null}
                <MapSocket receivedSocketInfo={this.handleDyData} />
            </div>
        );
    }
}


class MapSocket extends Component {
    constructor(props) {
        super(props);
        this.state = { data: [] };
    }

    componentDidMount() {
    // console.log("MapSocket: componentDidMount:");
        const rsi = this.props.receivedSocketInfo;
        const socketio = require('socket.io-client');
        const target = `${window.location.protocol}//${window.location.host}`;
        const token_url = `${target}/stream/socketio`;

        function _getWsToken() {
            util
                ._runFetch(token_url)
                .then((reply) => {
                    init(reply.token);
                })
                .catch((error) => {
                    // console.log('Failed!', error);
                });
        }

        function init(token) {
            deviceListSocket = socketio(target, {
                query: `token=${token}`,
                transports: ['polling'],
            });
            deviceListSocket.on('all', (data) => {
                // console.log("received socket information:", data);
                rsi(data);
            });

            deviceListSocket.on('error', (data) => {
                // console.log("socket error", data);
                if (deviceListSocket !== null) deviceListSocket.close();
                // getWsToken();
            });
        }
        _getWsToken();
    }

    componentWillUnmount() {
        if (deviceListSocket !== null) deviceListSocket.close();
    }

    render() {
    // console.log("MapSocket - Render: ", this.props);
        return null;
    }
}


class SmallPositionRenderer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isTerrain: true,
            layers: [],
            loadedLayers: false,
            zoom: (this.props.zoom ? this.props.zoom : this.props.config.mapZoom ? this.props.config.mapZoom : 12),
        };

        this.toggleLayer = this.toggleLayer.bind(this);
        this.layers = [];
    }

    componentDidMount() {
        if (!this.state.loadedLayers) {
            const layers = this.props.config.mapObj;
            // console.log("I got my layers! ", layers);
            for (const index in layers) {
                layers[index].isVisible = true;
            }
            this.setState({ loadedLayers: true, layers });
        }
    }

    toggleLayer(id) {
        const layers = this.state.layers;
        for (const index in layers) {
            if (layers[index].id === id) { layers[index].isVisible = !layers[index].isVisible; }
        }
        this.setState({ layers });
    }


    render() {
        // console.log('4. <PropsSmallPositionRenderer>. Render. ', this.props);

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
            if (device.dp_metadata) { attr_label = device.dp_metadata.attr_label; }

            for (const y in device.dy_positions) {
                if (device.is_visible) {
                    const tmp = device.dy_positions[y];
                    tmp.active_tracking = device.active_tracking;
                    if (tmp.position &&
                        tmp.position[0] &&
                        tmp.position[1] &&
                        typeof tmp.position[0] === "number" &&
                        typeof tmp.position[1] === "number") {
                        
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
        // console.log("parsedEntries (static and dynamics):", parsedEntries);

        return (
            <div className="fix-map-bug">
                <CustomMap toggleTracking={this.props.toggleTracking} allowContextMenu={this.props.allowContextMenu} zoom={this.state.zoom} markersData={parsedEntries} />
                {(this.props.showLayersIcons && this.state.layers.length)
                    ? (
                        <div className="col s12 layer-box">
                            { this.state.layers.map(lyr => (
                                <LayerBox
                                    key={lyr.id}
                                    toggleLayer={this.toggleLayer}
                                    config={lyr}
                                />
                            )) }
                        </div>
                    )
                    : null}
                {/* {listLatLngs[k.id] && k.tracking && this.props.showPolyline ? <Polyline positions={listLatLngs[k.id]} color="#7fb2f9" dashArray="10,10" repeatMode={false} /> : null} */}
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
        console.log('layerbox: togglelayer: ', this.props.config.id);
        this.props.toggleLayer(this.props.config.id);
        // this.setState({visible: !this.state.visible});
    }

    render() {
        const corner1 = L.latLng(this.props.config.overlay_data.corner1.lat, this.props.config.overlay_data.corner1.lng);
        const corner2 = L.latLng(this.props.config.overlay_data.corner2.lat, this.props.config.overlay_data.corner2.lng);
        const layerMapBounds = L.latLngBounds(corner1, corner2);
        const layerOpacity = 0.3;
        const imageOverlay = this.props.config.isVisible ? <ImageOverlay opacity={layerOpacity} bounds={layerMapBounds} url={this.props.config.overlay_data.path} /> : null;
        console.log('imageOverlay', this.props.config);
        return (
            <div className="layer-mr">
                <div title={this.props.config.description} className={`layer-div ${this.props.config.isVisible ? 'active-btn' : ''}`} onClick={this.toggleLayer}>
                    <i className="fa fa-map" />
                </div>
                {imageOverlay}
            </div>
        );
    }
}


export { SmallPositionRenderer };
