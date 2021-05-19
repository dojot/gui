import { PROXY_URL } from 'Src/config';
import util from '../util/util';

class GroupManager {
    getGroups() {
        return util.GET(`${PROXY_URL}auth/pap/group`);
    }

    getGroup(id) {
        return util.GET(`${PROXY_URL}auth/pap/group/${id}`);
    }

    setGroup(group) {
        // update
        if (group.id) return util.PUT(`${PROXY_URL}auth/pap/group/${group.id}`, group);

        // create
        return util.POST(`${PROXY_URL}auth/pap/group`, group);
    }

    deleteGroup(id) {
        return util.DELETE(`${PROXY_URL}auth/pap/group/${id}`);
    }
}

const groupManager = new GroupManager();
export default groupManager;
