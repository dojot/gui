/* eslint-disable */
import util from '../comms/util';


const alt = require('../alt');
const MeasureActions = require('../actions/MeasureActions');
const TrackingActions = require('../actions/TrackingActions');

class MeasureStore {
    constructor() {
        // this.devices = {};
        this.data = {};
        this.tracking = {};
        this.error = null;
        //this.measureReload = true;
        this.geoLabelForTracking = [];

        this.bindListeners({
            handleAppendMeasures: MeasureActions.APPEND_MEASURES,
            handleUpdateTracking: MeasureActions.updateTracking,
            handleUpdateMeasures: MeasureActions.UPDATE_MEASURES,
            handleUpdateGeoLabel: MeasureActions.updateGeoLabel,
            handleFailure: MeasureActions.MEASURES_FAILED,

            handleTrackingFetch: TrackingActions.FETCH,
            handleTrackingSet: TrackingActions.SET,
            handleTrackingDismiss: TrackingActions.DISMISS,
        });
    }

    handleUpdateGeoLabel(info) {
        const { geoLabel, deviceID } = info;
        this.geoLabelForTracking[deviceID] = geoLabel;
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

    parserPosition(position) {
        if (position.toString().indexOf(',') > -1) {
            const parsedPosition = position.split(',');
            if (parsedPosition.length > 1) {
                return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
            }
        } else {
            return undefined;
        }
    }

    /**
     *  Receive data from socket and add in tracking list
     * @param measureData
     */
    handleUpdateTracking(measureData) {
        const { metadata: { deviceid, timestamp }, attrs } = measureData;
        if (this.geoLabelForTracking[deviceid]) {
            for (const label in attrs) {
                if (this.geoLabelForTracking[deviceid] === label) {
                    if (this.tracking[deviceid] !== undefined && this.tracking[deviceid] !== null) {
                        const trackingStructure = {
                            device_id: deviceid,
                            attr_label: label,
                            position: this.parserPosition(attrs[this.geoLabelForTracking[deviceid]]),
                            timestamp: util.iso_to_date(timestamp),
                        };
                        //add new position in begin of tracking list
                        if (this.tracking[deviceid].unshift(trackingStructure) > 50) {
                            //if there are more than 50 positions, remove more older
                            this.tracking[deviceid] = this.tracking[deviceid].slice(0, 50);
                        }
                    }
                }
            }
        }
    }

    handleAppendMeasures(measureData) {
        const { metadata: { deviceid, timestamp } } = measureData;

        if (typeof this.data[deviceid] !== 'undefined') {
            for (const templateID in this.data[deviceid].attrs) {
                for (const attrID in this.data[deviceid].attrs[templateID]) {
                    for (const label in measureData.attrs) {
                        if (this.data[deviceid].attrs[templateID][attrID].label === label) {

                            const attrValue = {
                                ts: timestamp,
                                value: measureData.attrs[label],
                            };


                            if (this.data[deviceid][`_${label}`] === undefined) {
                                this.data[deviceid][`_${label}`] = [];
                            }
                            this.data[deviceid][`_${label}`].push(attrValue);

                            if (this.data[deviceid].attrs[templateID][attrID].value_type === 'geo:point') {
                                this.data[deviceid].position = this.parserPosition(measureData.attrs[label]);
                                if (this.tracking[deviceid] !== undefined && this.tracking[deviceid] !== null) {
                                    const trackingStructure = {
                                        device_id: deviceid,
                                        position: this.parserPosition(measureData.attrs[label]),
                                        attr_label: label,
                                        timestamp: util.iso_to_date(timestamp),
                                    };
                                    if (this.tracking[deviceid].unshift(trackingStructure) > 5) {
                                        this.tracking[deviceid] = this.tracking[deviceid].slice(0, 4);
                                    }
                                }
                            } else {
                                if (this.data[deviceid][`_${label}`].length > 10) {
                                    this.data[deviceid][`_${label}`].shift();
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
            console.error('Missing device id');
        }
        if (!('attr' in measureData)) {
            console.error('Missing attr id');
        }

        if (!(measureData.device in this.devices)) {
            measureData;
            this.devices[measureData.device] = {};
        }

        this.devices[measureData.device][measureData.attr.name] = JSON.parse(JSON.stringify(measureData.attr));
        this.devices[measureData.device][measureData.attr.name].loading = true;
    }

    handleFailure(error) {
        this.error = error;
    }
}

const _store = alt.createStore(MeasureStore, 'MeasureStore');
export default _store;
