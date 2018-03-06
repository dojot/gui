
var alt = require('../alt');
import util from '../comms/util';

class FlowActions {

  fetch() {
    return (dispatch) => {
      util.GET('flows/v1/flow')
        .then((data) => { this.set(data.flows); })
        .catch((error) => { this.fail(error); })
    }
  }

  set(flows) {
    return flows;
  }

  fetchFlow(flowid) {
    return (dispatch) => {
      dispatch();
      util.GET('flows/v1/flow/' + flowid)
        .then((data) => { this.setSingle(data); })
        .catch((error) => { this.fail(error); })
    }
  }

  setSingle(flow) {
    return flow;
  }

  done() {
    return (dispatch) => { dispatch(); }
  }

  load() {
    return (dispatch) => { dispatch(); }
  }

  triggerCreate(flow, cb) {
    return (dispatch) => {
      dispatch();
      util.POST('flows/v1/flow', flow)
        .then((response) => {
          this.create(response);
          cb(response.flow);
        })
        .catch((error) => {this.fail(error);})
    }
  }

  create(response) {
    return (dispatch) => { dispatch(response); }
  }

  triggerUpdate(id, flow, cb) {
    return (dispatch) => {
      dispatch();
      util.PUT('flows/v1/flow/' + id, flow)
          .then((response) => {
            this.update(response.flow);
            if (cb) { cb(response.flow); }
          })
          .catch((error) => { this.fail(error); })
    }
  }

  update(flow) {
    return flow;
  }

  triggerRemove(id, cb) {
    return (dispatch) => {
      dispatch();
      util.DELETE('flows/v1/flow/' + id)
        .then((response) => {
          this.remove(id);
          cb(id);
        })
        .catch((error) => { this.fail(error); })
    }
  }

  remove(id) {
    return id;
  }

  fail(error) {
    console.error(error);
    return error;
  }

  setName(name) {
    return name;
  }
}

alt.createActions(FlowActions, exports);
