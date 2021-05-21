import LoginActions from 'Actions/LoginActions';
import Util from 'Comms/util/util';

const alt = require('../alt');

class LoginStore {
    constructor() {
        this.authenticated = false;
        this.error = '';
        this.hasError = false;
        this.user = undefined;
        this.loading = false;

        const userinfo = Util.getToken();
        if (userinfo) {
            this.user = JSON.parse(userinfo);
            this.authenticated = true;
        } else {
            this.reset();
        }

        this.bindListeners({
            handleGetUserData: LoginActions.GET_USER_DATA,
            handleFailure: LoginActions.LOGIN_FAILED,
            handleSuccess: LoginActions.LOGIN_SUCCESS,
            handleLogout: LoginActions.LOGOUT,
        });
    }

    set(userinfo) {
        this.user = userinfo;
        Util.setToken(JSON.stringify(userinfo)); // could be any value;
        this.authenticated = true;
        this.loading = false;
    }

    reset() {
        this.error = '';
        this.hasError = false;
        this.loading = false;
        this.user = undefined;
        this.authenticated = false;
        Util.setToken(undefined);
    }

    handleGetUserData() {
        // this.authenticated = false;
        this.loading = true;
    }

    handleSuccess(userinfo) {
        console.log("userinfo", userinfo);
        this.hasError = false;
        this.error = '';
        this.set(userinfo);
        // trying to find other way
        window.location.href = `${window.location.origin}`;
    }

    handleFailure(error) {
        this.hasError = true;
        this.error = error;
        this.loading = false;
    }

    handleLogout() {
        this.reset();
    }
}

const _store = alt.createStore(LoginStore, 'LoginStore');
export default _store;
