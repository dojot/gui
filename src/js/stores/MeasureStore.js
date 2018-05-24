var alt = require('../alt');
var MeasureActions = require('../actions/MeasureActions');
var TrackingActions = require('../actions/TrackingActions');

import util from '../comms/util';

class MeasureStore {
    constructor() {
        //this.devices = {};
        this.data = {}
        this.tracking = {};
        this.error = null;

        this.bindListeners({
            handleAppendMeasures: MeasureActions.APPEND_MEASURES,
            handleUpdateMeasures: MeasureActions.UPDATE_MEASURES,
            handleFailure: MeasureActions.MEASURES_FAILED,
            //handleUpdatePosition: MeasureActions.UPDATE_POSITION,

            handleTrackingFetch: TrackingActions.FETCH,
            handleTrackingSet: TrackingActions.SET,
            handleTrackingDismiss: TrackingActions.DISMISS
        });
        // handleFetchMeansures: MeasureActions.FETCH_MEASURES,
    }


    handleTrackingFetch() {
    }

    handleTrackingSet(history) {
        this.tracking[history.device_id] = history.data;
    }

    handleTrackingDismiss(device_id) {
        if (this.tracking.hasOwnProperty(device_id)) {
            delete this.tracking[device_id];
        }
    }

    handleUpdateMeasures(measureData) {
        if (measureData !== null || measureData !== undefined) {
            this.data[measureData.id] = measureData;
        }
    }

    handleAppendMeasures(measureData) {
        function parserPosition(position) {
            if (position.toString().indexOf(",") > -1) {
                let parsedPosition = position.split(",");
                if (parsedPosition.length > 1) {
                    return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
                }
            } else {
                return undefined;
            }
        }

        let now = measureData.metadata.timestamp;
        let deviceID = measureData.metadata.deviceid;
        if (typeof this.data[deviceID] !== "undefined") {
            for (let templateID in this.data[deviceID].attrs) {
                for (let attrID in this.data[deviceID].attrs[templateID]) {
                    for (let label in measureData.attrs) {
                        if (this.data[deviceID].attrs[templateID][attrID].label === label) {
                            let attrValue = {
                                "ts": now,
                                "value": measureData.attrs[label]
                            };
                            if (this.data[deviceID].attrs[templateID][attrID].value_type === "geo:point") {
                                this.data[deviceID].position = parserPosition(measureData.attrs[label]);
                                if (this.tracking[measureData.metadata.deviceid] !== undefined && this.tracking[measureData.metadata.deviceid] !== null) {
                                    let trackingStructure = {
                                        "device_id": measureData.metadata.deviceid,
                                        "position": parserPosition(measureData.attrs[label]),
                                        "timestamp": util.iso_to_date(now)
                                    };
                                    console.log(this.tracking);
                                    this.tracking[measureData.metadata.deviceid].unshift(trackingStructure);
                                }
                            } else {
                                // attr is not geo
                                if (this.data[deviceID]['_' + label] === undefined) {
                                    this.data[deviceID]['_' + label] = [];
                                }
                                this.data[deviceID]['_' + label].push(attrValue);
                                if (this.data[deviceID]['_' + label].length > 10) {
                                    this.data[deviceID]['_' + label].shift();
                                }

                            }
                        }
                    }
                }
            }
        }
    }


    handleFetchMeasures(measureData) {
        if (!('device' in measureData)) {
            console.error("Missing device id");
        }
        if (!('attr' in measureData)) {
            console.error("Missing attr id");
        }

        if (!(measureData.device in this.devices)) {
            measureData;
            this.devices[measureData.device] = {}
        }

        this.devices[measureData.device][measureData.attr.name] = JSON.parse(JSON.stringify(measureData.attr));
        this.devices[measureData.device][measureData.attr.name].loading = true;
    }

    handleFailure(error) {
        this.error = error;
    }
}

var _store = alt.createStore(MeasureStore, 'MeasureStore');
export default _store;
