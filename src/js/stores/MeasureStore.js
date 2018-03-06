var alt = require('../alt');
var MeasureActions = require('../actions/MeasureActions');
var TrackingActions = require('../actions/TrackingActions');

import util from '../comms/util';

class MeasureStore {
  constructor() {
    //this.devices = {};
    this.tracking = {};
    this.error = null;

    this.bindListeners({
      handleAppendMeasures: MeasureActions.APPEND_MEASURES,
      handleUpdateMeasures: MeasureActions.UPDATE_MEASURES,
      handleFailure: MeasureActions.MEASURES_FAILED,
      handleUpdatePosition: MeasureActions.UPDATE_POSITION,

      handleTrackingFetch: TrackingActions.FETCH,
      handleTrackingSet: TrackingActions.SET,
      handleTrackingDismiss: TrackingActions.DISMISS
    });
    // handleFetchMeansures: MeasureActions.FETCH_MEASURES,
  }


  handleTrackingFetch(){}
  handleTrackingSet(history){
    this.tracking[history.device_id] = history.data;
  }

  handleTrackingDismiss(device_id){
    if (this.tracking.hasOwnProperty(device_id)){
      delete this.tracking[device_id];
    }
  }

  handleUpdatePosition(data){
    function parserPosition(position){
      let parsedPosition = position.split(", ");
      if(parsedPosition.length > 1){
        return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
      }
    }
    if(data !== undefined){
      this.data.position = parserPosition(data);
    }

  }

  handleUpdateMeasures(measureData) {
    if (this.data == undefined)
      this.data = measureData;
    else if (this.data.device == measureData.device) {
      for (let k in measureData.data) {
        if (measureData.data.hasOwnProperty(k)) {
          this.data.data[k] = measureData.data[k];
        }
      }
    } else {
      this.data = measureData;
    }
    // if (! ('device' in measureData)) { console.error("Missing device id"); }
    // if (! ('attr' in measureData)) { console.error("Missing attr id"); }
    // if (! ('data' in measureData)) { console.error("Missing device data"); }
    //
    // if (measureData.device in this.devices) {
    //   this.devices[measureData.device][measureData.attr.name].loading = false;
    //   this.devices[measureData.device][measureData.attr.name].data = measureData.data;
    // } else {
    //   this.error = "Device not found"
    //   console.error('failed to find device in current measures');
    // }
  }


  handleAppendMeasures(measureData) {
    if(this.data.id === measureData.metadata.deviceid){
      let label = Object.keys(measureData.attrs);
      this.data[label[0]] = this.data[label[0]].concat(measureData.attrs[label[0]]);
    }
  }

   handleFetchMeasures(measureData) {
     if (! ('device' in measureData)) { console.error("Missing device id"); }
     if (! ('attr' in measureData)) { console.error("Missing attr id"); }

     if (! (measureData.device in this.devices)) {measureData;
       this.devices[measureData.device] = {}
     }

     this.devices[measureData.device][measureData.attr.name] = JSON.parse(JSON.stringify(measureData.attr));
     this.devices[measureData.device][measureData.attr.name].loading = true;
   }

  handleFailure(error) {
    this.error = error;
  }
}

var _store =  alt.createStore(MeasureStore, 'MeasureStore');
export default _store;
