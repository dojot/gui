import { hashHistory } from 'react-router';
import { t } from 'i18next';
import loginManager from 'Comms/login/LoginManager';
import toaster from 'Comms/util/materialize';
import { AbilityUtil } from 'Components/permissions/ability';
import { LOGOUT_URL } from 'Src/config';

const alt = require('../alt');

class LoginActions {
    getUserData() {
        console.log('getUserData');
        return (dispatch) => {
            dispatch();
            loginManager.getUserData()
                .then((response) => {
                    //      hashHistory.push('/');
                    console.log('response.data', response);
                    this.loginPermissions(response.permissions);
                    this.loginSuccess(response.username);
                })
                .catch((error) => {
                    console.log('error', error);
                    this.loginFailed(error);
                });
        };
    }

    logout() {
        AbilityUtil.logoff();
        window.location.href = LOGOUT_URL;
        return true;
    }

    setPassword(login) {
        return (dispatch) => {
            dispatch();
            loginManager.setNewPassword(login)
                .then(() => {
                    hashHistory.push('/login');
                    window.location.reload();
                })
                .catch((error) => {
                    this.loginFailed(error);
                });
        };
    }

    updatePassword(data) {
        return (dispatch) => {
            dispatch();
            loginManager.updatePassword(data)
                .then(() => {
                    toaster.success(t('text.password_updated'));
                })
                .catch((error) => {
                    toaster.error(error.message);
                });
        };
    }

    resetPassword(username) {
        return (dispatch) => {
            dispatch();
            loginManager.resetPassword(username);
        };
    }

    loginSuccess(token) {
        return token;
    }

    loginPermissions(permissions) {
        const oldPermissionModel = permissions.map((el) => {
            const newPermission = { actions: [] };
            newPermission.subject = el.resourceName;
            if (el.scopes.includes('view')) {
                newPermission.actions.push('viewer');
            }
            if (el.scopes.includes('update')
                || el.scopes.includes('create')
                || el.scopes.includes('delete')) {
                newPermission.actions.push('modifier');
            }
            return newPermission;
        });
        console.log(JSON.stringify(oldPermissionModel));

        AbilityUtil.loginPermissions(oldPermissionModel);
        return oldPermissionModel;
    }

    loginFailed(error) {
        let errMsg = '';

        if (error === null) {
            errMsg = t('login:errors.not_found');
        } else if (error instanceof TypeError) {
            errMsg = t('login:errors.no_connection');
        } else {
            const status = (error.data.status) ? error.data.status : error.data.data.status;
            if (status === 401 || status === 403) {
                errMsg = t('login:errors.auth_failed');
            } else if (status === 500) {
                errMsg = t('login:errors.internal_error');
            } else if (error.message) {
                errMsg = error.message;
            }
        }

        if (errMsg === '') {
            errMsg = t('login:errors.not_found');
        }

        toaster.error(errMsg);

        return errMsg;
    }
}

const _login = alt.createActions(LoginActions, exports);
export default _login;
