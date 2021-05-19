import { PROXY_URL } from 'Src/config';
import util from '../util';

class UserManager {
    getUsers() {
        return util.GET(`${PROXY_URL}auth/user`);
    }

    getUser(id) {
        return util.GET(`${PROXY_URL}auth/user/${id}`);
    }

    setUser(detail) {
        return util.PUT(`${PROXY_URL}auth/user/${detail.id}`, detail);
    }

    addUser(d) {
        d.id = util.guid();
        return util.POST(`${PROXY_URL}auth/user`, d);
    }

    deleteUser(id) {
        return util.DELETE(`${PROXY_URL}auth/user/${id}`);
    }

    setIcon(id, icon) {
        const data = new FormData();
        data.append('icon', icon);
        const config = { method: 'put', body: data };
        return util._runFetch(`${PROXY_URL}auth/user/user/${id}/icon`, config);
    }
}

const userManager = new UserManager();
export default userManager;
