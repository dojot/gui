/* eslint-disable */
import React, { Component } from 'react';
import { Link } from 'react-router';
import { ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import DivIcon from 'react-leaflet-div-icon';
import * as pins from '../../config'
import util from "../../comms/util";
import MapPositionActions from "../../actions/MapPositionActions";

require('leaflet.markercluster');

let device_list_socket = null;

const OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

const Esri_WorldImagery = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 17,
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
  }
);


 function getPin(device, config) {
    if (device.active_tracking)
    {
      return pins.mapPinYellow;
    }
    
    let varToMeasure = "_" + config.measureAttribute;

    if (device.hasOwnProperty('unique_key')) {
        return pins.mapPinGreen;
    }

    if (device.hasOwnProperty(varToMeasure) && config.mapColorActive) {
        for (let index in config.range) {
            if (config.range.hasOwnProperty(index) && config.range[index].value <= device[varToMeasure]["0"].value) {
                let method = "mapPin" + config.range[index].pin;
                return pins[method];
            }
        }
    }
    return pins.mapPinBlack;
}



class ContextMenu {
    constructor() {
        console.log("ContextMenu loaded.");
    }
    // context menu based at: https://codepen.io/devhamsters/pen/yMProm
    updateCurrentContextMenu(event,root) {
        console.log("updateCurrentContextMenu");
        const clickX = event.clientX;
        const clickY = event.clientY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const rootW = root.offsetWidth;
        const rootH = root.offsetHeight;
        const right = screenW - clickX > rootW;
        const left = !right;
        const top = screenH - clickY > rootH;
        const bottom = !top;
        if (right) root.style.left = `${clickX + 5}px`;
        if (left) root.style.left = `${clickX - rootW - 5}px`;
        if (top) root.style.top = `${clickY + 5}px`;
        if (bottom) root.style.top = `${clickY - rootH - 5}px`;
    }
}


class CustomMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cm_visible: false,
      contextMenuInfo: {},
      bounds: false
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
  }

  componentDidMount() {
    console.log("5. CustomMap: componentDidMount");
    // create map
    this.map = L.map("map", {
      zoom: this.props.zoom,
      center: [51.505, -0.09],
      layers: [OpenStreetMap_Mapnik]
    });

    var overlays = { Map: OpenStreetMap_Mapnik, Satelite: Esri_WorldImagery };
    L.control.layers(overlays).addTo(this.map);

    // this.markers = L.layerGroup().addTo(this.map); // without clustering
    this.markers = L.markerClusterGroup({
      chunkedLoading: true,
      disableClusteringAtZoom: 10,
      iconCreateFunction: function(cluster) {
        return pins.mapPinBlack;
      }
    }).addLayers([]);

    this.updateMarkers();
  }

  componentWillUnmount() {
    // reseting layer to the map
    this.map.removeLayer(OpenStreetMap_Mapnik);
  }

  componentDidUpdate() {
    console.log("5. componentDidUpdate ", this.props.markersData, this.subset);
    console.log("5. map ", this.map);
   if (!this.map.hasLayer(OpenStreetMap_Mapnik)) {
      console.log("Readding the tile layer");
      this.map.addLayer(OpenStreetMap_Mapnik);
    }
    if (JSON.stringify(this.props.markersData) != JSON.stringify(this.subset)) {
      this.updateMarkers();
    }
  }

  handleContextMenu(e, device_id, tracking) {
    console.log("handleContextMenu");
    if (!this.props.allowContextMenu) return false;

    e.originalEvent.preventDefault();
    this.contextMenuInfo = {
      allow_tracking: tracking,
      event: e.originalEvent,
      root: this.root,
      device_id: device_id
    };
    this.setState({ cm_visible: true, contextMenuInfo: this.contextMenuInfo });
  }

  closeContextMenu() {
    this.setState({
      cm_visible: false
    });
  }

  handleBounds() {
    // set initial map center or boundaries

    let positionList = [];
    this.props.markersData.forEach((element, index) => {
      positionList.push(element.pos);
    });

    console.log("5. this.state.bounds", this.state.bounds);

    if (positionList.length == 0) {
      let temporaryCenter = [-20.90974, -48.83651];
      this.map.panTo(temporaryCenter);
    } else if (positionList.length > 1) {
      this.bounds = L.latLngBounds(positionList);
      this.map.fitBounds(this.bounds);
    } else {
      this.map.panTo(positionList[0]);
    }
  }

  handleDyData(socket_data) {
    this.creatingDynamicPoint(socket_data);
  }

  creatingDynamicPoint(measureData) {
    // 1. get device data
    let dev = null;
    const now = measureData.metadata.timestamp;
    const deviceID = measureData.metadata.deviceid;
    for (const index in this.props.markersData) {
      if (this.props.markersData[index].id == deviceID) {
        dev = this.props.markersData[index];
      }
    }
    if (dev == null) return;
    let myPoint = dev;
    // 2. trying to find the dynamic geo-point
    let geoLabel = null;
    for (const label in measureData.attrs) {
      if (dev.attr_label == label)
        geoLabel = label;
    }
    if (geoLabel == null) return; //no attribute with position
    let position = util.parserPosition(measureData.attrs[geoLabel]);
    myPoint.pos = L.latLng(position[0], position[1]);
    myPoint.timestamp = util.iso_to_date(now);
    // 3. change Marker point
    let hcm = this.handleContextMenu;
    let mkr = this.mkrHelper[myPoint.id];
    console.log("mkr", mkr);
    mkr.setLatLng(myPoint.pos);
    mkr.bindPopup(myPoint.name + " : " + myPoint.timestamp);
    mkr.on("click", function (a) {
      hcm(a, a.target.options.id, a.target.options.allow_tracking);
      a.originalEvent.preventDefault();
    });
  }
  
  updateMarkers() {
    console.log("5. this.props.markersData");
    this.subset = JSON.parse(JSON.stringify(this.props.markersData));
    this.markers.clearLayers();
    this.mkrHelper = {};
    let hcm = this.handleContextMenu;
    this.props.markersData.forEach(marker => {
      let mkr = L.marker(marker.pos, {
        title: marker.name,
        allow_tracking: marker.allow_tracking,
        id: marker.id,
        icon: marker.pin
      });
      if (marker.timestamp)
        mkr.bindPopup(marker.name + " : " + marker.timestamp);
      else mkr.bindPopup(marker.name);

      mkr.on("click", function(a) {
        console.log("a", a);
        hcm(a, a.target.options.id, a.target.options.allow_tracking);
        a.originalEvent.preventDefault();
      });

      this.markers.addLayer(mkr);
      this.mkrHelper[marker.id] = mkr;
    });
    this.markers.addTo(this.map);

    this.handleBounds();
    // this.markers.on('click', function (a) {
    //     hcm(a, a.layer.options.id);
    //     a.originalEvent.preventDefault();
    //     console.log('marker ',a);
    // });
  }

  handleTracking(device_id) {
    console.log("5. handleTracking", device_id);
    this.props.toggleTracking(device_id);

    this.setState({ cm_visible: false });
  }

  handleMapClick(e) {
    console.log("handleMapClick");
    if (!this.props.allowContextMenu) {
      return false;
    }
    // if (this.state.cm_visible)
    //    this.setState({cm_visible:false});
  }

  render() {
    console.log("5. CustomMap - Render: ", this.props);
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


class ContextMenuComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.handleTracking = this.handleTracking.bind(this);

        this.contextMenu = new ContextMenu();
    }
    
     handleTracking(device_id) {
        console.log("6. handleTracking", device_id);
        this.props.handleTracking(device_id);
    }
    
    componentDidMount() {
        this.contextMenu.updateCurrentContextMenu(this.props.metadata.event, this.root);
    }

    componentDidUpdate() {
        this.contextMenu.updateCurrentContextMenu(this.props.metadata.event, this.root);
    }

    render() {

        console.log("6. ContextMenuComponent - Render: ", this.props);
        const md = this.props.metadata;
        
        return <div ref={(ref) => {
            this.root = ref;
        }} className="contextMenu">
            <Link to={`/device/id/${md.device_id}/detail`} title="View details">
                <div className="contextMenu--option cmenu"><i className="fa fa-info-circle" />Details</div>
            </Link>
            {(md.allow_tracking) ? 
            <div
                className="contextMenu--option cmenu"
                onClick={() => {
                    this.handleTracking(md.device_id);
                }}
            ><img src="images/icons/location.png" />Toggle tracking</div> : null}
          <div onClick={() => {
            this.props.closeContextMenu();
          }} className="contextMenu--option cmenu"><i className="fa fa-close" />Close Menu</div>

        </div>;
    }
}




class MapSocket extends Component {
  constructor(props) {
    super(props);
    this.state = { data: [] };
  }
   
  componentDidMount() {
    console.log("MapSocket: componentDidMount:");
    const rsi = this.props.receivedSocketInfo
    console.log("rsi",rsi);
    const socketio = require("socket.io-client");
    const target = `${window.location.protocol}//${window.location.host}`;
    const token_url = `${target}/stream/socketio`;

    function _getWsToken() {
      util
        ._runFetch(token_url)
        .then(reply => {
          init(reply.token);
        })
        .catch(error => {
          console.log('Failed!', error);
        });
    }

    function init(token) {
      console.log("web socket init");
      device_list_socket = socketio(target, {
        query: `token=${token}`,
        transports: ["polling"]
      });
      device_list_socket.on("all", data => {
        console.log("MapSocket: received socket information:", data);
        rsi(data);
      });

      device_list_socket.on("error", data => {
        console.log("socket error", data);
        if (device_list_socket !== null) device_list_socket.close();
        // getWsToken();
      });
    }
    _getWsToken();
  }

  componentWillUnmount() {
    if (device_list_socket !== null) device_list_socket.close();
  }

  render() {
    console.log("MapSocket - Render: ", this.props);
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
            let layers = this.props.config.mapObj;
            console.log("I got my layers! ", layers);
            for (let index in layers) {
                layers[index].isVisible = true;
            }
            this.setState({ loadedLayers: true, layers: layers });
        }
    }

    toggleLayer(id) {
        let layers = this.state.layers;
        for (let index in layers)
            if (layers[index].id === id)
                layers[index].isVisible = !layers[index].isVisible;
        this.setState({ layers: layers });
    }



    render() {
        console.log('4. <PropsSmallPositionRenderer>. Render. ', this.props);

        let parsedEntries = [];
        for (const k in this.props.staticDevices) {
            let device = this.props.staticDevices[k];
            if (device.is_visible)
            {
                parsedEntries.push({
                id: device.id,
                pos: L.latLng(device.sp_value[0], device.sp_value[1]),
                name: device.label,
                pin: getPin(device, this.props.config),
                timestamp: device.timestamp,
                tracking: device.tracking,
                key: device.unique_key ? device.unique_key : device.id
                });
            }
        }

        for (const k in this.props.dynamicDevices) {
            let device = this.props.dynamicDevices[k];
            let attr_label = "";
            if (device.dp_metadata)
              attr_label = device.dp_metadata.attr_label;
              for (const y in device.dy_positions) {
              if (device.is_visible)
              {
                  let tmp = device.dy_positions[y];
                  tmp.active_tracking = device.active_tracking;
                  parsedEntries.push({
                    id: tmp.id,
                    pos: L.latLng(
                      tmp.position[0],
                      tmp.position[1]
                    ),
                    attr_label: attr_label,
                    name: tmp.label,
                    pin: getPin(tmp, this.props.config),
                    timestamp: tmp.timestamp,
                    active_tracking: tmp.active_tracking,
                    allow_tracking: device.allow_tracking,
                    key: tmp.unique_key
                      ? tmp.unique_key
                      : tmp.id
                  });
                }
            }
        }
        console.log("parsedEntries (static and dynamics):", parsedEntries);

        return <div className="fix-map-bug">
            <CustomMap toggleTracking={this.props.toggleTracking}  allowContextMenu={this.props.allowContextMenu} zoom={this.state.zoom} markersData={parsedEntries}/>
              {(this.props.showLayersIcons && this.state.layers.length ) ?
                <div className="col s12 layer-box">
                 { this.state.layers.map(lyr => (
                    <LayerBox
                      key={lyr.id}
                      toggleLayer={this.toggleLayer}
                      config={lyr}
                    />
                  )) }
                </div>
                : null}
            {/* {listLatLngs[k.id] && k.tracking && this.props.showPolyline ? <Polyline positions={listLatLngs[k.id]} color="#7fb2f9" dashArray="10,10" repeatMode={false} /> : null} */}
          </div>;

        // return <Map zoom={this.state.zoom} ref={m => {
        //     this.leafletMap = m;
        // }} onClick={this.handleMapClick}>
        //     <TileLayer
        //         attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        //         url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
        //     />
        //     <div className="col s12 layer-box" >
        //         {
        //             (this.props.showLayersIcons && this.state.layers.length) ?
        //                 this.state.layers.map(lyr => (
        //                     <LayerBox
        //                         key={lyr.id}
        //                         toggleLayer={this.toggleLayer}
        //                         config={lyr}
        //                     />
        //                 )) : null
        //         }
        //     </div>
        //     {contextMenu}
        //     {parsedEntries.map(k => {
        //         console.log("k",k);

        //         return <Marker onContextMenu={e => {
        //             this.handleContextMenu(e, k.id);
        //         }} onClick={e => {
        //             this.handleContextMenu(e, k.id);
        //         }} position={k.pos} key={k.key} icon={k.pin}>
        //             <Tooltip direction='top' offset={[0, -40]}>
        //                 <span>
        //                     {k.name} : {k.timestamp}
        //                 </span>
        //             </Tooltip>
        //             {/* {listLatLngs[k.id] && k.tracking && this.props.showPolyline ? <Polyline positions={listLatLngs[k.id]} color="#7fb2f9" dashArray="10,10" repeatMode={false} /> : null} */}
        //         </Marker>;
        //     })}
        //     <ScaleControl />
        // </Map>;
    }
}


class LayerBox extends Component {
    constructor(props) {
        super(props);
        // this.state = { visible: true };
        this.toggleLayer = this.toggleLayer.bind(this);
    }

    toggleLayer() {
        console.log("layerbox: togglelayer: ", this.props.config.id);
        this.props.toggleLayer(this.props.config.id);
        // this.setState({visible: !this.state.visible});
    }

    render() {
        let corner1 = L.latLng(this.props.config.overlay_data.corner1.lat, this.props.config.overlay_data.corner1.lng);
        let corner2 = L.latLng(this.props.config.overlay_data.corner2.lat, this.props.config.overlay_data.corner2.lng);
        const layerMapBounds = L.latLngBounds(corner1, corner2);
        const layerOpacity = 0.3;
        const imageOverlay = this.props.config.isVisible ? <ImageOverlay opacity={layerOpacity} bounds={layerMapBounds} url={this.props.config.overlay_data.path} /> : null;
        console.log("imageOverlay", this.props.config);
        return <div className="layer-mr">
            <div title={this.props.config.description} className={"layer-div " + (this.props.config.isVisible ? "active-btn" : "")} onClick={this.toggleLayer}>
                <i className={"fa fa-map"} />
            </div>
            {imageOverlay}
        </div>;
    }
}


export { SmallPositionRenderer };
