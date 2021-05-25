import React, { useEffect, useState, useRef } from 'react';
import {
    Map, TileLayer, Marker, LayersControl, Tooltip,
} from 'react-leaflet';
import PropTypes from 'prop-types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import socketio from 'socket.io-client';
import { BASE_URL, PROXY_URL } from 'Src/config';
import util from '../../comms/util/util';
import * as pins from '../../config';
import ContextMenuComponent from './ContextMenuComponent';

/*
WebSocket
*/
const EventEmitter = require('events');

class WebSocket {
    constructor() {
        this.socketInstance = null;
        this.tokenUrl = `${PROXY_URL}stream/socketio`;
        this.token = null;
        this.hasToken = false;
        this.deviceIds = {};
        this.isInstatiated = false;
        this.markerEmitter = new EventEmitter();
    }

    /*
       The  socket.io emitter could also be used to emit these events,
       but we are using a specific Event Emitter to isolate responsibility.
    */
    emitHandler(data) {
        const { metadata: { deviceid } } = data;
        if (this.deviceIds[deviceid]) {
            this.markerEmitter.emit(deviceid, data);
        }
    }

    init() {
        if (this.isInstatiated) {
            // The socket was already started.
            return;
        }
        this.isInstatiated = true;

        // Step 1: Fetching Token
        util._runFetch(this.tokenUrl)
            .then((reply) => {
                this.token = reply.token;
                this.hasToken = true;

                // Step 2: Initiate Socket
                this.socketInstance = socketio(BASE_URL, {
                    query: `token=${this.token}`,
                    transports: ['polling'],
                });

                this.socketInstance.on('all', (data) => {
                    this.emitHandler(data);
                });

                // Step 3: Set emmiter for errors
                this.socketInstance.on('error', (data) => {
                    // @TODO We should better handle these errors
                    // eslint-disable-next-line no-console
                    console.error('Websocket error: ', data);
                });
            })
            .catch((error) => {
                // @TODO We should better handle these errors
                // eslint-disable-next-line no-console
                console.error(`An error occurred to fetch token to socket: ${JSON.stringify(error)}`);
            });
    }

    setDeviceIdAvailable(id) {
        this.deviceIds[id] = true;
    }

    removeIdAvailable(id, cback) {
        this.deviceIds[id] = false;
        this.markerEmitter.removeListener(id, cback);
    }

    teardown() {
        // Destroy the socket instance
        if (this.socketInstance) {
            this.socketInstance = this.socketInstance.close();
        }
        this.isInstatiated = false;
    }

    isInstantiated() {
        return this.isInstatiated;
    }

    getInstance() {
        return this.markerEmitter;
    }
}

/*

A Map component allowing receives static and dynamic positions.

*/
const wsGlobal = new WebSocket();

const MultipleMapWithSocket = ({
    staticDevices, dynamicDevices, initialZoom,
}) => {
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [menuInfo, setMenuInfo] = useState({});

    const [dyDevices, setDyDevices] = useState([]);
    const [stDevices, setStDevices] = useState([]);

    const [initialBounds, setInitialBounds] = useState();
    const [dynamicPosition, setDynamicPosition] = useState([]);
    const [staticPosition, setStaticPosition] = useState([]);

    const mapRef = useRef();
    if (mapRef.current) {
        // We need to wait for the window to finish resizing
        setTimeout(() => {
            mapRef.current.leafletElement.invalidateSize();
        }, 500);
    }

    useEffect(() => {
        wsGlobal.init();
    }, []);

    const handleBounds = (positionList) => {
        if (positionList.length) {
            const bounds = L.latLngBounds(positionList);
            setInitialBounds(bounds);
        }
        else {
            // no markers to be shown, setting center at Campinas
            const bounds = L.latLngBounds([
                [-22.9071, - 47.06324], [-23.5489, -46.6388]]);
            setInitialBounds(bounds);
        }
    };

    useEffect(() => {
        const positionList = [];
        const staticList = [];
        staticDevices.forEach((device) => {
            positionList.push(device.sp_value);
            staticList.push({
                id: device.id,
                name: device.label,
                position: device.sp_value,
                key: util.guid(),
            });
        });
        setStDevices(staticList);
        setStaticPosition(positionList);
    }, [staticDevices]);

    useEffect(() => {
        const positionList = [];
        const dynamicList = [];

        dynamicDevices.forEach((device) => {
            const auxDevice = {
                id: device.device_id,
                name: device.label,
                position: device.position,
                attr: device.attr,
                key: util.guid(),
            };
            positionList.push(device.position);
            dynamicList.push(auxDevice);
        });

        setDyDevices(dynamicList);
        setDynamicPosition(positionList);
    }, [dynamicDevices]);

    useEffect(() => {
        const position = [...staticPosition, ...dynamicPosition];
        handleBounds(position);
    }, [dynamicPosition, staticPosition]);

    const closeContextMenu = () => {
        setIsMenuVisible(false);
    };

    const handleContextMenu = (e, deviceId) => {
        e.originalEvent.preventDefault();

        const contextMenuInfo = {
            allow_tracking: false,
            event: e.originalEvent,
            device_id: deviceId,
        };
        setMenuInfo(contextMenuInfo);
        setIsMenuVisible(true);
    };

    return (
        <Map
            ref={mapRef}
            zoom={initialZoom}
            attributionControl
            bounds={initialBounds}
            zoomControl
            doubleClickZoom
            scrollWheelZoom
            dragging
            animate
            easeLinearity={0.35}
        >
            <LayersControl position="topright">
                <LayersControl.BaseLayer
                    checked
                    name="Map"
                >
                    <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer
                    name="Satelite"
                >
                    <TileLayer
                        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            {isMenuVisible ? (
                <ContextMenuComponent
                    closeContextMenu={closeContextMenu}
                    metadata={menuInfo}
                />
            ) : null}

            {stDevices.map((device) => (
                <Marker
                    icon={pins.mapPinGreen}
                    onClick={(e) => handleContextMenu(e, device.id)}
                    key={device.key}
                    position={device.position}
                >
                    <Tooltip>{device.name}</Tooltip>
                </Marker>
            ))}

            {dyDevices.map((device) => (
                device.position ? (
                    <MarkerUpdater
                        icon={pins.mapPinBlue}
                        id={device.id}
                        onClick={(e) => handleContextMenu(e, device.id)}
                        key={device.key}
                        deviceKey={device.key}
                        attributeLabel={device.attr}
                        initialPosition={device.position}
                        name={device.name}
                    />
                ) : null
            ))}

        </Map>
    );
};

MultipleMapWithSocket.defaultProps = {
    initialZoom: 12,
    dynamicDevices: [],
    staticDevices: [],
};

MultipleMapWithSocket.propTypes = {
    dynamicDevices: PropTypes.arrayOf(PropTypes.shape),
    staticDevices: PropTypes.arrayOf(PropTypes.shape),
    initialZoom: PropTypes.number,
};

/*

MarkerUpdater

*/
export const MarkerUpdater = ({
    initialPosition, icon, deviceKey,
    name, onClick, id, attributeLabel,
}) => {
    const [devicePosition, setDevicePosition] = useState(initialPosition);

    const handlePosition = (data) => {
        const { attrs } = data;
        if (attrs[attributeLabel]) {
            const toParse = attrs[attributeLabel] || '[0, 0]';
            let coordinates;
            try {
                coordinates = toParse.split(',');
            } catch (e) {
                coordinates = [0, 0];
            }
            const [lat, long] = coordinates;
            setDevicePosition([parseFloat(lat), parseFloat(long)]);
        }
    };

    useEffect(() => {
        const hasData = (data) => {
            handlePosition(data);
        };

        if (wsGlobal.isInstantiated()) {
            wsGlobal.getInstance().on(id, hasData);
            wsGlobal.setDeviceIdAvailable(id);
        }

        // Dismounting the emitter in web socket
        return () => {
            if (wsGlobal.isInstantiated()) {
                wsGlobal.removeIdAvailable(id, hasData);
            }
        };
    }, []);

    return (
        <Marker
            position={devicePosition}
            icon={icon}
            onClick={onClick}
            key={deviceKey}
        >
            <Tooltip>{name}</Tooltip>
        </Marker>

    );
};

MarkerUpdater.defaultProps = {
    name: '',
    icon: pins.mapPinBlue,
};

MarkerUpdater.propTypes = {
    id: PropTypes.string.isRequired,
    deviceKey: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.shape({}),
    name: PropTypes.string,
    initialPosition: PropTypes.arrayOf(PropTypes.number).isRequired,
    attributeLabel: PropTypes.string.isRequired,
};

export default MultipleMapWithSocket;
