import { PROXY_URL } from 'Src/config';
import util from '../util';

class AlarmsManager {
    getCurrentAlarmsWithoutNamespace() {
        return util.GET(`${PROXY_URL}alarmmanager/api/alarms/current`);
    }

    getAllCurrentAlarmsWithNamespace(namespace) {
        return util.GET(`${PROXY_URL}alarmmanager/api/alarms/current/${namespace}`);
    }

    getAllCurrentAlarms() {
        return util.GET(`${PROXY_URL}alarmmanager/api/alarms/current/all`);
    }

    getHistoryWithoutNamespace() {
        return util.GET(`${PROXY_URL}alarmmanager/api/alarms/history/all`);
    }

    getHistoryWithNamespace(namespace) {
        return util.GET(`${PROXY_URL}alarmmanager/api/alarms/history/${namespace}`);
    }

    getNamespaces() {
        return util.GET(`${PROXY_URL}alarmmanager/api/alarms/namespaces`);
    }
}

const alarmsManager = new AlarmsManager();
export default alarmsManager;
