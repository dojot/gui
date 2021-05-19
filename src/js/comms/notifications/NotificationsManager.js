import { PROXY_URL } from 'Src/config';
import util from '../util/util';

class NotificationsManager {
    /**
     *
     * @param subject
     * @returns {*}
     */
    getNotificationsHistory(subject) {
        return util.GET(`${PROXY_URL}history/notifications/history/?subject="${subject}"`);
    }
}

const notificationsManager = new NotificationsManager();
export default notificationsManager;
