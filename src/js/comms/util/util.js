import moment from 'moment';
import LoginActions from 'Actions/LoginActions';
import 'babel-polyfill';
import i18n from 'i18next';
import { BASE_URL, PROXY_URL } from 'Src/config';

function FetchError(data, message) {
    this.name = 'FetchError';
    this.message = message || 'Call failed';
    this.stack = (new Error()).stack;
    this.data = data;
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;

const REGEX_ALPHA_NUMBER_HYPHEN_2_POINTS_SPACE_UNDER = /^[\w-: ]+$/g;
const REGEX_ALPHA_NUMBER_HYPHEN_2_POINTS_UNDER = /^[\w-:]+$/g;

class Util {

    parserPosition(position) {
        if (position.toString().indexOf(',') > -1) {
            const parsedPosition = position.split(',');
            if (parsedPosition.length > 1) {
                return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
            }
        }
        return undefined;
    }

    checkWidthToStateOpen(opened) {
        const width =
            window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;
        if (width < 1168) return true;
        return opened;
    };

    /**
     * Full Url
     * @returns {string} Ex.: http://localhost:8000
     */
    getFullURL() {
        return BASE_URL;
    }

    /**
     *  Full Url for socketIO
     * @returns {string} Ex.: http://localhost:8000/stream/socketio
     */
    getUrlTokenSocketIO() {
        return `${PROXY_URL}stream/socketio`;
    }

    getUserInfo() {
        return window.localStorage.getItem('userinfo');
    }


    setUserInfo(userinfo) {
        if (typeof (Storage) !== "undefined") {
            // Test webstorage existence.
            if (!window.localStorage || !window.sessionStorage) {
                throw new Error('error checking webstorage existence');
            }
            // Test webstorage accessibility - Needed for Safari private browsing.
            if (userinfo === null || userinfo === undefined) {
                window.localStorage.removeItem('userinfo');
            } else {
                window.localStorage.setItem('userinfo', userinfo);
            }
        } else {
            // No web storage Support.
            throw new Error('error checking webstorage existence');
        }
    }


    getPermissions() {
        return JSON.parse(window.localStorage.getItem('roles'));
    }

    setPermissions(permissions) {
        const objPermStr = JSON.stringify(permissions);
        if (typeof (Storage) !== "undefined") {
            // Test webstorage existence.
            if (!window.localStorage || !window.sessionStorage) {
                throw new Error('error checking webstorage existence');
            }
            // Test webstorage accessibility - Needed for Safari private browsing.
            if (objPermStr === undefined) {
                window.localStorage.removeItem('roles');
            } else {
                window.localStorage.setItem('roles', objPermStr);
            }
        } else {
            // No web storage Support.
            throw new Error('error checking webstorage existence');
        }
    }

    getTokenSocketIO() {
        return this._runFetch(this.getUrlTokenSocketIO());
    }

    GET_PROXY(url) {
        return this._runFetch(`${PROXY_URL}${url}`, {
            method: 'get',
        });
    }

    GET(url) {
        return this._runFetch(url, {
            method: 'get',
        });
    }

    POST(url, payload) {
        return this._runFetch(url, {
            method: 'post',
            headers: new Headers({ 'content-type': 'application/json' }),
            body: new Blob([JSON.stringify(payload)], { type: 'application/json' }),
        });
    }

    POST_MULTIPART(url, payload) {
        const data = new FormData();
        data.append('sha1', payload.sha1);
        data.append('image', payload.binary);

        return this._runFetch(url, {
            method: 'post',
            // headers: new Headers({ "Content-Type": "multipart/form-data" }),
            body: data,
            // body: new Blob(payload, { type: 'multipart/form-data' })
        });
    }

    PUT(url, payload) {
        return this._runFetch(url, {
            method: 'put',
            headers: new Headers({ 'content-type': 'application/json' }),
            body: new Blob([JSON.stringify(payload)], { type: 'application/json' }),
        });
    }

    PATCH(url, payload) {
        return this._runFetch(url, {
            method: 'PATCH',
            headers: new Headers({ 'content-type': 'application/json' }),
            body: new Blob([JSON.stringify(payload)], { type: 'application/json' }),
        });
    }

    DELETE(url) {
        return this._runFetch(url, { method: 'delete' });
    }

    printTime(ts) {
        const date = new Date();
        date.setSeconds(Math.floor(ts));

        const options = { hour12: false };
        return date.toLocaleString(undefined, options);
    }

    _runFetch(url, config) {
        const local = this;
        const setConfig = config || {};
        return new Promise(((resolve, reject) => {
            fetch(url, setConfig)
                .then(local._status)
                .then((data) => {
                    resolve(data && data[1] ? data[1]: "");
                })
                .catch((error) => {
                    reject(local.checkContent(error));
                });
        }));
    }

    async _status(response) {
        if ((response.status === 401)) {
            LoginActions.logout();
        }

        if ((response.status === 403)) {
            return Promise.reject(i18n.t('errors_msg.not_perm'));
        }

        if (response.status === 503) return Promise.reject(new FetchError(response, i18n.t('errors_msg.api_503')));
        if (response.status === 502) return Promise.reject(new FetchError(response, i18n.t('errors_msg.api_502')));
        if (response.status === 404) return Promise.reject(new FetchError(response, i18n.t('errors_msg.api_404')));
        if (response.status === 500) return Promise.reject(response);

        //204 No Content
        if (response.status === 204) return [Promise.resolve(response), null];

        const body = await response.json();
        response.message = body.message;
        if (response.status >= 200 && response.status < 300) {
            return [Promise.resolve(response), body];
        }

        return Promise.reject(response);
    }

    checkContent(data) {
        return (new FetchError(data, data.message));
    }

    _json(response) {
        return response.json();
    }

    sid() {
        return (1 + Math.random() * 4294967295).toString(16);
    }

    s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    guid() {
        return `${this.s4() + this.s4()}-${this.s4()}-${this.s4()}-${this.s4()}-${this.s4()}${this.s4()}${this.s4()}`;
    }

    // to get formatted date
    timestamp_to_date(timestamp) {
        return moment(timestamp).format('MMM, DD, YYYY HH:mm:ss');
    }

    iso_to_date(timestamp) {
        return moment(timestamp).format(`${i18n.t('format.full_date')} HH:mm:ss`);
    }

    iso_to_date_hour(timestamp) {
        return moment(timestamp).format(`${i18n.t('format.day_mouth')} HH:mm`);
    }

    timestampToHourMinSec(timestamp) {
        return timestamp ? moment(timestamp).format('HH:mm:ss') : null;
    }

    timestampToDayMonthYear(timestamp) {
        return timestamp ? moment(timestamp).format(i18n.t('format.full_date')) : null;
    }

    utcToHourMinSec(utc) {
        return utc ? moment.parseZone(utc).utc().local().format('HH:mm:ss') : null;
    }

    utcToDayMonthYear(utc) {
        return utc ? moment.parseZone(utc).utc().local().format(i18n.t('format.full_date')) : null;
    }

    isNameValid(name) {
        const ret = { result: true, error: '', label: name.trim() };
        if (name.trim().length === 0) {
            ret.result = false;
            ret.error = i18n.t('errors_msg.name_empty');
            return ret;
        }
        if (name.match(REGEX_ALPHA_NUMBER_HYPHEN_2_POINTS_SPACE_UNDER) == null) {
            ret.result = false;
            ret.error = i18n.t('errors_msg.alpha_number_space_hyphen');
            return ret;
        }
        return ret;
    }

    /**
     * @param name
     * @returns {{result: boolean, error: string, label: *}}
     */
    isLabelValid(name) {
        const ret = {
            result: true,
            error: '',
            label: name.trim(),
        };
        if (name.trim().length === 0) {
            ret.result = false;
            ret.error = i18n.t('errors_msg.name_empty');
            return ret;
        }
        if (name.match(REGEX_ALPHA_NUMBER_HYPHEN_2_POINTS_UNDER) == null) {
            ret.result = false;
            ret.error = i18n.t('errors_msg.alpha_number_hyphen');
            return ret;
        }

        return ret;
    }

    isTypeValid(value, type, dynamic) {
        const ret = { result: true, error: '' };
        if (dynamic === 'actuator' && value.length === 0) return ret;
        if (type.trim().length === 0) {
            ret.result = false;
            ret.error = i18n.t('errors_msg.set_type');
            return ret;
        }
        if (dynamic === 'dynamic' && value.length === 0) return ret;

        const validator = {
            string: (val) => {
                ret.result = val.trim().length > 0;
                ret.error = i18n.t('errors_msg.invalid_text');
                return ret;
            },
            'geo:point': (val) => this.geo(val),
            geo: (val) => {
                const re = /^([+-]?\d+(\.\d+)?)([,]\s*)([+-]?\d+(\.\d+)?)$/;
                ret.result = re.test(val);
                if (ret.result === false) {
                    ret.error = i18n.t('errors_msg.invalid_geo');
                }
                return ret;
            },
            integer: (val) => {
                const re = /^[+-]?\d+$/;
                ret.result = re.test(val);
                if (ret.result === false) {
                    ret.error = i18n.t('errors_msg.invalid_int');
                }
                return ret;
            },
            float: (val) => {
                const re = /^[+-]?\d+(\.\d+)?$/;
                ret.result = re.test(val);
                if (ret.result === false) {
                    ret.error = i18n.t('errors_msg.invalid_float');
                }
                return ret;
            },
            boolean: (val) => {
                const re = /^0|1|true|false$/;
                ret.result = re.test(val);
                if (ret.result === false) {
                    ret.error = i18n.t('errors_msg.invalid_bool');
                }
                return ret;
            },
            bool: (val) => this.boolean(val),
            protocol: (val) => {
                ret.result = val.trim().length > 0;
                ret.error = i18n.t('errors_msg.invalid_protocol');
                return ret;
            },
            topic: (val) => {
                ret.result = val.trim().length > 0;
                ret.error = i18n.t('errors_msg.invalid_topic');
                return ret;
            },
            translator: (val) => {
                ret.result = val.trim().length > 0;
                ret.error = i18n.t('errors_msg.invalid_translator');
                return ret;
            },
            'device_timeout': (val) => {
                const re = /^[+-]?\d+$/;
                ret.result = re.test(val);
                if (ret.result === false) {
                    ret.error = i18n.t('errors_msg.invalid_timeout');
                }
                return ret;
            },
        };

        if (validator.hasOwnProperty(type)) {
            return validator[type](value);
        }

        return ret;
    }

    isDeviceTimeoutValid(device_timeout) {
        const ret = { result: true, error: "" };
        if (device_timeout.length === 0) {
            ret.result = false;
            ret.error = i18n.t('errors_msg.empty_timeout');
            return ret;
        }

        const re = /^[+-]?\d+$/;
        ret.result = re.test(device_timeout);
        if (ret.result === false) {
            ret.error = i18n.t('errors_msg.invalid_timeout_2');
        }
        return ret;
    }
}

const util = new Util();
export default util;
