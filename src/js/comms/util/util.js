import LoginActions from '../../actions/LoginActions';
import moment from 'moment'

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
        .then(local._json)
        .then(function(data) { resolve(data); })
        .catch(function(error) {
          reject(error);
        })
    })
  }

  _status(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      if ((response.status == 401) || (response.status == 403)) {
        LoginActions.logout();
      }
      return Promise.reject(new FetchError(response, response.statusText));
    }
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
    return moment(timestamp).format('MMM, D, YYYY HH:mm:ss');
  }


  isNameValid(name) {
    if (name.length == 0) {
      // ErrorActions.setField('name', "You can't leave this empty");
      return false;
    }

    if (name.match(/^\w+$/) == null) {
      // ErrorActions.setField('name', "Please use only letters (a-z), numbers (0-9) and underscores (_).");
      return false;
    } else {
      // ErrorActions.setField('name', "");
      return true;
    }
  }

  isTypeValid(value, type){
    const validator = {
      'string': function (value) {
        return value.trim().length > 0;
      },
      'geo:point': function (value) {
        const re = /^([+-]?\d+(\.\d+)?)([,]\s*)([+-]?\d+(\.\d+)?)$/
        const result = re.test(value);
        if (result == false) {
          ErrorActions.setField('value', 'This is not a valid coordinate')
        }
        return result;
      },
      'integer': function (value) {
        const re = /^[+-]?\d+$/
        const result = re.test(value);
        if (result == false) {
          ErrorActions.setField('value', 'This is not an integer')
        }
        return result;
      },
      'float': function (value) {
        const re = /^[+-]?\d+(\.\d+)?$/
        const result = re.test(value);
        if (result == false) {
          ErrorActions.setField('value', 'This is not a float')
        }
        return result;
      },
      'boolean': function (value) {
        const re = /^0|1|true|false$/
        const result = re.test(value);
        if (result == false) {
          ErrorActions.setField('value', 'This is not a boolean')
        }
        return result;
      },
    };


    if (validator.hasOwnProperty(type)) {
      const result = validator[type](value)
      // if (result) { ErrorActions.setField('value', ''); }
      return result;
    }
    //
    // if (validator.hasOwnProperty(this.props.newAttr.type)) {
    //   const result = validator[this.props.newAttr.type](value)
    //   if (result) { ErrorActions.setField('value', ''); }
    //   return result;
    // }
    return true;
  }


}



class TypeDisplay {
  constructor() {
    this.availableTypes = {
      'geo:point': 'Geo',
      'float':'Float',
      'integer':'Integer',
      'string':'Text',
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

var util = new Util();
export default util;
