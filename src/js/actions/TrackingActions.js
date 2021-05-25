/* eslint-disable */
import { PROXY_URL } from 'Src/config';
import alt from '../alt';
import util from 'Comms/util/util';
import LoginStore from '../stores/LoginStore';


class TrackingActions {
    fetch(device_id, attrName, history_length) {
        function getUrl() {
            return `${PROXY_URL}history/device/${device_id}/history?lastN=${history_length}&attr=${attrName}`;
        }

        function parserPosition(position) {
            const parsedPosition = position.split(',');
            if (parsedPosition.length > 1) {
                return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
            }
        }

        return (dispatch) => {
            dispatch();

            const { tenant } = LoginStore.getState().user;
            const config = {
                method: 'get',
                headers: new Headers({
                    'fiware-service': tenant,
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
