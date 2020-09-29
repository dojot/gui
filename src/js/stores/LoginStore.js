import LoginActions from 'Actions/LoginActions';
import Util from 'Comms/util/util';

const alt = require('../alt');

class LoginStore {
    constructor() {
        this.authenticated = false;
        this.error = '';
        this.hasError = false;
        this.loading = false;

        const token = Util.getToken();
        if (token) {
            this.set(token);
        } else {
            this.reset();
        }

        this.bindListeners({
            handleAuthenticate: LoginActions.AUTHENTICATE,
            handleFailure: LoginActions.LOGIN_FAILED,
            handleSuccess: LoginActions.LOGIN_SUCCESS,
            handleLogout: LoginActions.LOGOUT,
        });
    }

    set(token) {
        try {
            this.user = JSON.parse(atob(token.split('.')[1]));
            Util.setToken(token);
            this.authenticated = true;
            this.loading = false;
        } catch (e) {
            this.reset();
            this.hasError = true;
            this.Irror = 'Invalid session information detected';
        }
    }

    reset() {
        this.error = '';
        this.hasError = false;
        this.loading = false;
        this.user = undefined;
        this.authenticated = false;
        Util.setToken(undefined);
    }

    handleAuthenticate() {
        this.authenticated = false;
        this.loading = true;
    }

    handleSuccess(login) {
        this.hasError = false;
        this.error = '';
        this.set(login.jwt);
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
