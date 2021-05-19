import React, { useEffect, useState, useRef } from 'react';
import { Map, TileLayer, Marker } from 'react-leaflet';
import socketio from 'socket.io-client';
import PropTypes from 'prop-types';
import { BASE_URL } from 'Src/config';
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

const MarkerUpdater = ({
    initialPosition, id, attributeLabel, setMapCenter,
}) => {
    const [socketInstance, setSocketInstance] = useState(undefined);
    const [devicePosition, setDevicePosition] = useState(initialPosition);
    const URL = `${BASE_URL}stream/socketio`;

    const handlePosition = ({ attrs }) => {
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
            setMapCenter([parseFloat(lat), parseFloat(long)]);
        }
    };

    useEffect(() => {
        const userToken = window.localStorage.getItem('jwt');
        axios.get(URL, { headers: { Authorization: `Bearer ${userToken}` } }).then(({ data }) => {
            setSocketInstance(socketio(BASE_URL, { query: `token=${data.token}`, transports: ['polling'] }));
        }).catch((error) => {
            // @TODO We should better handle these errors
            // eslint-disable-next-line no-console
            console.error(error);
        });
    }, []);

    useEffect(() => {
        if (socketInstance) {
            socketInstance.on(id, data => handlePosition(data));
            socketInstance.on('error', (data) => {
                // @TODO We should better handle these errors
                // eslint-disable-next-line no-console
                console.error('Websocket error: ', data);
            });
        }
        // Destroy the socket instance when dismounting the component
        return () => (socketInstance ? socketInstance.close() : undefined);
    }, [socketInstance]);

    return (
        <Marker position={devicePosition} />
    );
};

MarkerUpdater.propTypes = {
    setMapCenter: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
    initialPosition: PropTypes.arrayOf(PropTypes.number).isRequired,
    attributeLabel: PropTypes.string.isRequired,
};

export const MapWithSocket = ({ device, initialZoom, attributeLabel }) => {
    const { position, id } = device;
    const [mapCenter, setMapCenter] = useState(position);
    const [mapZoom, setMapZoom] = useState(initialZoom);
    const mapRef = useRef();
    if (mapRef.current) {
        // We need to wait for the window to finish resizing
        setTimeout(() => {
            mapRef.current.leafletElement.invalidateSize();
        }, 250);
    }

    const handleZoom = () => {
        // The zoom value is stored in the local hook
        setMapZoom(mapRef.current.leafletElement.getZoom());
    };
    return (
        <Map
            ref={mapRef}
            center={mapCenter}
            zoom={mapZoom}
            attributionControl
            zoomControl
            doubleClickZoom
            scrollWheelZoom
            dragging
            animate
            easeLinearity={0.35}
            onzoomend={handleZoom}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <MarkerUpdater
                initialPosition={position}
                id={id}
                attributeLabel={attributeLabel}
                setMapCenter={setMapCenter}
            />
        </Map>
    );
};

MapWithSocket.defaultProps = {
    initialZoom: 14,
    attributeLabel: 'unknown',
};

MapWithSocket.propTypes = {
    device: PropTypes.shape({
        position: PropTypes.arrayOf(PropTypes.number),
        id: PropTypes.string,
    }).isRequired,
    initialZoom: PropTypes.number,
    attributeLabel: PropTypes.string,
};

export default LeafMap;
