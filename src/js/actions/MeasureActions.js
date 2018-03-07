import measureManager from '../comms/measures/MeasureManager';
import LoginStore from '../stores/LoginStore';

var alt = require('../alt');
import util from '../comms/util';

class MeasureActions {

  appendMeasures(data) { return data; }
  updateMeasures(data) {
    return data;
  }

  fetchMeasure(device, device_id, attrs, history_length) {
    console.log("MeasureActions, fetchMeasure", device, device_id, attrs, history_length);
    function getUrl() {
      if (history_length === undefined) { history_length = 1; }
      let url = '/history/device/' + device_id + '/history?lastN=' + history_length + '&attr=' + attrs;
      return url;
    }

    return (dispatch) => {
      dispatch();

      const service = LoginStore.getState().user.service;
      const config = {
        method: 'get',
        headers: new Headers({
          'fiware-service': service,
          'fiware-servicepath': '/'
        })
      }
      util._runFetch(getUrl(), config)
        .then((reply) => {
          if(reply !== null || reply !== undefined){
              device[attrs] = reply.reverse();
          }
          this.updateMeasures(device);
        })
        .catch((error) => {console.error("failed to fetch data", error);});
    }
  }

  updatePosition(data) {return data;}

  fetchPosition(device, device_id, attr, history_length) {
    function getUrl() {
      if (history_length === undefined) { history_length = 1; }
      let url = '/history/device/' + device_id + '/history?lastN=' + history_length + '&attr=' + attr;
      return url;
    }

    function parserPosition(position){
      let parsedPosition = position.split(", ");
      if(parsedPosition.length > 1){
        return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
      }
    }

    return (dispatch) => {
      dispatch();

      const service = LoginStore.getState().user.service;
      const config = {
        method: 'get',
        headers: new Headers({
          'fiware-service': service,
          'fiware-servicepath': '/'
        })
      }

      util._runFetch(getUrl(), config)
        .then((reply) => {
          let position = null;
          if(reply[0].value !== "nan"){
            position = parserPosition(reply[0].value);
          }
          device.position = position;
          this.updateMeasures(device);

        })
        .catch((error) => {console.error("failed to fetch data", error);});
    }
  }

  updateMeasuresAttr(device, attr, data) {
    return {device: device, attr: attr, data: data};
  }

  measuresFailed(error) {
    return error;
  }


}

alt.createActions(MeasureActions, exports);
