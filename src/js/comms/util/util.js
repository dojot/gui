import LoginActions from '../../actions/LoginActions';
import moment from 'moment'
import 'babel-polyfill'

function FetchError(data, message) {
  this.name = "FetchError";
  this.message = message || "Call failed";
  this.stack = (new Error()).stack;
  this.data = data;
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;

class Util {

  getToken() {
    return window.localStorage.getItem("jwt");
  }

  setToken(token) {
    try {
       // Test webstorage existence.
       if (!window.localStorage || !window.sessionStorage) throw "exception";
       // Test webstorage accessibility - Needed for Safari private browsing.
       if (token === null || token === undefined) {
         window.localStorage.removeItem("jwt");
       } else {
         window.localStorage.setItem("jwt", token);
       }
     } catch (e) {
       localStoragePolyFill();
     }
  }

  GET(url) {
    return this._runFetch(url, {
      method: 'get'
    });
  }

  POST(url, payload) {
    return this._runFetch(url, {
      method: 'post',
      headers: new Headers({"content-type": "application/json"}),
      body: new Blob([JSON.stringify(payload)], {type : 'application/json'})
    });
  }

  PUT(url, payload) {
    return this._runFetch(url, {
      method: 'put',
      headers: new Headers({"content-type": "application/json"}),
      body: new Blob([JSON.stringify(payload)], {type : 'application/json'})
    });
  }

  DELETE(url, payload) {
    return this._runFetch(url, { method: 'delete' });
  }

  printTime(ts) {
    let date = new Date(null);
    date.setSeconds(Math.floor(ts));

    const options = { hour12: false };
    return date.toLocaleString(undefined, options);
  }

  _runFetch(url, config) {
    let local = this;

    var authConfig = config;
    authConfig.credentials = 'include';
    if (this.getToken()) {
      if (authConfig) {
        if (authConfig.headers) {
          authConfig.headers.append('Authorization', 'Bearer ' + this.getToken());
        } else {
          authConfig.headers = new Headers();
          authConfig.headers.append('Authorization', 'Bearer ' + this.getToken());
        }
      } else {
        let headers = new Headers();
        headers.append('Authorization', 'Bearer ' + this.getToken());
        authConfig = { headers: headers };
      }
    }
    return new Promise(function(resolve, reject) {
      fetch(url, authConfig)
        .then(local._status)
        // .then(local._json)
        .then(function(data) { resolve(data[1]); })
        .catch(function(error) {
          reject(local.checkContent(error));
        })
    })
  }

    async _status(response) {
    let body = await response.json();
    response.message = body.message;
        if (response.status >= 200 && response.status < 300) {
            return [Promise.resolve(response), body];
        } else {
            if ((response.status === 401) || (response.status === 403)) {
                LoginActions.logout();
            }
            // return Promise.reject(new FetchError(response, response.statusText ));
            return Promise.reject(response);
        }
    }

    checkContent(data) {
        return(new FetchError(data, data.message ));
    }

     _json(response) {
    return response.json();
  }

  sid() {
    return (1 + Math.random()*4294967295).toString(16);
  }

  s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  guid() {
    return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
      this.s4() + '-' + this.s4() + this.s4() + this.s4();
  }

  // to get formatted date
  timestamp_to_date(timestamp) {
      return moment(timestamp).format('MMM, D, YYYY HH:mm:ss');
  }

  iso_to_date(timestamp) {
    return moment(timestamp).format('D/MM/YYYY HH:mm:ss');
  }


  isNameValid(name) {
    let ret = {result: true, error: ""};
    if (name.length === 0) {
        ret.result = false;
        ret.error = "You can't leave the name empty.";
      return ret;
    }

    if (name.match(/^[a-zA-Z0-9_\- ]*$/) == null) {
      ret.result = false;
      ret.error = "Please use only letters (a-z), numbers (0-9) and underscores (_).";
      return ret;
    } else {
      return ret;
    }
  }

  isTypeValid(value, type, dynamic){
    let ret = {result: true, error: ""};
    if (dynamic === 'dynamic' && value.length === 0) return ret;
    const validator = {
      'string': function (value) {
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
      'integer': function (value) {
        const re = /^[+-]?\d+$/;
        ret.result = re.test(value);
        if (ret.result === false) {
            ret.error = 'This is not an integer';
        }
        return ret;
      },
      'float': function (value) {
        const re = /^[+-]?\d+(\.\d+)?$/;
        ret.result = re.test(value);
        if (ret.result === false) {
            ret.error = 'This is not a float';
        }
        return ret;
      },
      'boolean': function (value) {
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
      }
    };

    if (validator.hasOwnProperty(type)) {
      const result = validator[type](value);
      // if (result) { ErrorActions.setField('value', ''); }
      return result;
    }
    //
    // if (validator.hasOwnProperty(this.props.newAttr.type)) {
    //   const result = validator[this.props.newAttr.type](value)
    //   if (result) { ErrorActions.setField('value', ''); }
    //   return result;
    // }
    return ret;
  }


}



class TypeDisplay {
  constructor() {
    this.availableTypes = {
      'geo:point': 'Geo',
      'float':'Float',
      'integer':'Integer',
      'string':'String',
      'boolean':'Boolean',
    }
  }

  getTypes() {
    let list = []
    for (let k in this.availableTypes) {
      list.push({'value': k, 'label': this.availableTypes[k]})
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

let util = new Util();
export default util;
