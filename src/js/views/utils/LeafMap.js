import React, { useEffect, useState, useRef } from 'react';
import { Map, TileLayer, Marker } from 'react-leaflet';
import socketio from 'socket.io-client';
import PropTypes from 'prop-types';
import { baseURL } from 'Src/config';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const LeafMap = ({ point }) => {
    const mapRef = useRef();

    if (mapRef.current) {
        setTimeout(() => {
            mapRef.current.leafletElement.invalidateSize();
        }, 250);
    }
    return (
        <Map
            ref={mapRef}
            center={point}
            zoom={14}
            attributionControl
            zoomControl
            doubleClickZoom
            scrollWheelZoom
            dragging
            animate
            easeLinearity={0.35}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={point} />
        </Map>
    );
};

LeafMap.propTypes = {
    point: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export const MapWithSocket = ({ device, initialZoom }) => {
    const { position, id } = device;
    const [socketInstance, setSocketInstance] = useState(undefined);
    const [devicePosition, setDevicePosition] = useState(position);
    const [mapZoom, setMapZoom] = useState(initialZoom);
    const URL = `${baseURL}stream/socketio`;
    const mapRef = useRef();


    if (mapRef.current) {
        // We need to wait for the window to finish resizing
        setTimeout(() => {
            mapRef.current.leafletElement.invalidateSize();
        }, 250);
    }

    const handlePosition = ({ attrs }) => {
        const { location } = attrs;
        const toParse = location || '[0, 0]';
        const [lat, long] = toParse.split(',');
        setDevicePosition([parseFloat(lat), parseFloat(long)]);
    };

    const handleZoom = () => {
        // The zoom value is stored in the local hook
        setMapZoom(mapRef.current.leafletElement.getZoom());
    };

    useEffect(() => {
        const userToken = window.localStorage.getItem('jwt');
        axios.get(URL, { headers: { Authorization: `Bearer ${userToken}` } }).then(({ data }) => {
            setSocketInstance(socketio(baseURL, { query: `token=${data.token}`, transports: ['polling'] }));
        }).catch((error) => {
            console.error(error);
        });
    }, []);

    useEffect(() => {
        if (socketInstance) {
            socketInstance.on(id, data => handlePosition(data));
            socketInstance.on('error', (data) => { console.error('Websocket error: ', data); });
        }
        // Destroy the socket instance when dismounting the component
        return () => (socketInstance ? socketInstance.close() : undefined);
    }, [socketInstance]);

    return (
        <Map
            ref={mapRef}
            center={devicePosition}
            zoom={mapZoom}
            attributionControl
            zoomControl
            doubleClickZoom
            scrollWheelZoom
            dragging
            animate
            easeLinearity={0.35}
            onzoomend={() => handleZoom()}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={devicePosition} />
        </Map>
    );
};

MapWithSocket.defaultProps = {
    initialZoom: 14,
};

MapWithSocket.propTypes = {
    device: PropTypes.shape({
        position: PropTypes.arrayOf(PropTypes.number),
        id: PropTypes.string,
    }).isRequired,
    initialZoom: PropTypes.number,
};


export default LeafMap;
