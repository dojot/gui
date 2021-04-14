/* eslint-disable */
import alt from '../alt';
import util from '../comms/util';
import LoginStore from '../stores/LoginStore';

class TrackingActions {
    fetch(device_id, attrName, history_length) {
        function getUrl() {
            return '/history/device/' + device_id + '/history?lastN=' + history_length + '&attr=' + attrName;
        }

        function parserPosition(position) {
            const parsedPosition = position.split(',');
            if (parsedPosition.length > 1) {
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
                    'fiware-servicepath': '/',
                }),
            };

            util._runFetch(getUrl(), config)
                .then((reply) => {
                    const history = { device_id, data: [] };
                    for (const k in reply) {
                        const data = { device_id };
                        if (reply[k].value !== null && reply[k].value !== undefined) {
                            data.attr = reply[k].attr;
                            data.position = parserPosition(reply[k].value);
                            data.timestamp = util.iso_to_date(reply[k].ts);
                        }
                        history.data.push(data);
                    }
                    this.set(history);
                })
                .catch((error) => { console.error('failed to fetch data', error); });
        };
    }

    set(history) { return history; }

    dismiss(device_id) { return device_id; }
}
alt.createActions(TrackingActions, exports);
