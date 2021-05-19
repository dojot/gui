import LoginActions from 'Actions/LoginActions';
import Util from 'Comms/util/util';
import { BASE_URL } from 'Src/config';

const alt = require('../alt');

class LoginStore {
    constructor() {
        this.authenticated = false;
        this.error = '';
        this.hasError = false;
        this.user = undefined;
        this.loading = false;

        const username = Util.getToken();
        if (username) {
            this.set(username);
        } else {
            this.reset();
        }
        console.log('this.authenticated', this.authenticated);

        this.bindListeners({
            handleGetUserData: LoginActions.GET_USER_DATA,
            handleFailure: LoginActions.LOGIN_FAILED,
            handleSuccess: LoginActions.LOGIN_SUCCESS,
            handleLogout: LoginActions.LOGOUT,
        });
    }

    set(username) {
        console.log('username', username);
        this.user = username;
        Util.setToken(username); // could be any value;
        this.authenticated = true;
        console.log('set   .authenticated', this.authenticated);
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

    handleSuccess(login) {
        this.hasError = false;
        this.error = '';
        this.set(login);
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
