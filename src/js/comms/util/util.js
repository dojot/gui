/* eslint-disable */
import moment from 'moment';
import LoginActions from '../../actions/LoginActions';
import 'babel-polyfill';

const sha1 = require('sha1');

function FetchError(data, message) {
    this.name = 'FetchError';
    this.message = message || 'Call failed';
    this.stack = (new Error()).stack;
    this.data = data;
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;

class Util {

    checkWidthToStateOpen(opened){
        console.log("checkWidthToStateOpen");
        const width =
            window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;
        if (width < 1168) return true;
        return opened;
    };


    getSHA1(data) {
        return sha1(data);
    }

    getToken() {
        return window.localStorage.getItem('jwt');
    }

    setToken(token) {
        try {
            // Test webstorage existence.
            if (!window.localStorage || !window.sessionStorage) throw 'exception';
            // Test webstorage accessibility - Needed for Safari private browsing.
            if (token === null || token === undefined) {
                window.localStorage.removeItem('jwt');
            } else {
                window.localStorage.setItem('jwt', token);
            }
        } catch (e) {
            localStoragePolyFill();
        }
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
        // console.log('POST_MULTIPART', payload);
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

    DELETE(url, payload) {
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

        let authConfig = config || {};
        authConfig.credentials = 'include';
        if (this.getToken()) {
            if (authConfig) {
                if (authConfig.headers) {
                    authConfig.headers.append('Authorization', `Bearer ${this.getToken()}`);
                } else {
                    authConfig.headers = new Headers();
                    authConfig.headers.append('Authorization', `Bearer ${this.getToken()}`);
                }
            } else {
                const headers = new Headers();
                headers.append('Authorization', `Bearer ${this.getToken()}`);
                authConfig = { headers };
            }
        }
        return new Promise(((resolve, reject) => {
            fetch(url, authConfig)
                .then(local._status)
            // .then(local._json)
                .then((data) => { resolve(data[1]); })
                .catch((error) => {
                    reject(local.checkContent(error));
                });
        }));
    }

    async _status(response) {
        if (response.status === 500) return Promise.reject(response);

        if (response.status === 404) return Promise.reject(new FetchError(response, 'API not found.'));

        const body = await response.json();
        response.message = body.message;
        if (response.status >= 200 && response.status < 300) {
            return [Promise.resolve(response), body];
        }
        if ((response.status === 401) || (response.status === 403)) {
            LoginActions.logout();
        }

        // return Promise.reject(new FetchError(response, response.statusText ));
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
        return `${this.s4() + this.s4()}-${this.s4()}-${this.s4()}-${
            this.s4()}-${this.s4()}${this.s4()}${this.s4()}`;
    }

    // to get formatted date
    timestamp_to_date(timestamp) {
        return moment(timestamp).format('MMM, DD, YYYY HH:mm:ss');
    }

    iso_to_date(timestamp) {
        return moment(timestamp).format('DD/MM/YYYY HH:mm:ss');
    }

    iso_to_date_hour(timestamp) {
        return moment(timestamp).format('DD/MM HH:mm');
    }


    isNameValid(name) {
        const ret = { result: true, error: '' };
        if (name.length === 0) {
            ret.result = false;
            ret.error = "You can't leave the name empty.";
            return ret;
        }

        if (name.match(/^[a-zA-Z0-9_\- ]*$/) == null) {
            ret.result = false;
            ret.error = 'Please use only letters (a-z), numbers (0-9) and underscores (_).';
            return ret;
        }
        return ret;
    }

    isTypeValid(value, type, dynamic) {
    const ret = { result: true, error: '' };
    if (dynamic === 'actuator' && value.length === 0) return ret;

    if (type.trim().length == 0) {
        ret.result = false;
        ret.error = 'You must set a type.';
        return ret;
    }
    if (dynamic === 'dynamic' && value.length === 0) return ret;

    const validator = {
        string(value) {
            ret.result = value.trim().length > 0;
            ret.error = 'This text is not valid';
            return ret;
        },
        'geo:point': function (value) {
            const re = /^([+-]?\d+(\.\d+)?)([,]\s*)([+-]?\d+(\.\d+)?)$/;
            ret.result = re.test(value);
            if (ret.result === false) {
                ret.error = 'This is not a valid coordinate';
            }
            return ret;
        },
        integer(value) {
            const re = /^[+-]?\d+$/;
            ret.result = re.test(value);
            if (ret.result === false) {
                ret.error = 'This is not an integer';
            }
            return ret;
        },
        float(value) {
            const re = /^[+-]?\d+(\.\d+)?$/;
            ret.result = re.test(value);
            if (ret.result === false) {
                ret.error = 'This is not a float';
            }
            return ret;
        },
        boolean(value) {
            const re = /^0|1|true|false$/;
            ret.result = re.test(value);
            if (ret.result === false) {
                ret.error = 'This is not a boolean';
            }
            return ret;
        
        },
        'protocol': function (value) {
            ret.result = value.trim().length > 0;
            ret.error = 'This protocol is not valid';
            return ret;
        },
        'topic': function (value) {
            ret.result = value.trim().length > 0;
            ret.error = 'This topic is not valid';
            return ret;
        },
        'translator': function (value) {
            ret.result = value.trim().length > 0;
            ret.error = 'This translator is not valid';
            return ret;
        },
        'device_timeout': function (value) {
            const re = /^[+-]?\d+$/;
            ret.result = re.test(value);
            if (ret.result === false) {
                ret.error = 'This device timeout is not an integer';
            }
            return ret;
        },
    };

    if (validator.hasOwnProperty(type)) {
        const result = validator[type](value);
        return result;
    }

    // if (validator.hasOwnProperty(this.props.newAttr.type)) {
    //   const result = validator[this.props.newAttr.type](value)
    //   if (result) { ErrorActions.setField('value', ''); }
    //   return result;
    // }
    return ret;
  }

  isDeviceTimeoutValid(device_timeout) {
      let ret = {result: true, error: ""};
      if (device_timeout.length === 0) {
          ret.result = false;
          ret.error = "You can't leave the device timeout empty.";
          return ret;
      }
      
      const re = /^[+-]?\d+$/;
      ret.result = re.test(device_timeout);
      if (ret.result === false) {
          ret.error = 'Invalid device timeout value. This is not a integer';
      }
      return ret;
  }
}

class TypeDisplay {
    constructor() {
        this.availableTypes = {
            'geo:point': 'Geo',
            float: 'Float',
            integer: 'Integer',
            string: 'String',
            boolean: 'Boolean',
        };
    }

    getTypes() {
        const list = [];
        for (const k in this.availableTypes) {
            list.push({ value: k, label: this.availableTypes[k] });
        }
        return list;
    }

    translate(value) {
        if (this.availableTypes.hasOwnProperty(value)) {
            return this.availableTypes[value];
        }
        return undefined;
    }
}

const util = new Util();
export default util;
