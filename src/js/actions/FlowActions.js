import { PROXY_URL } from "Src/config";
import util from 'Comms/util/util';
import toaster from 'Comms/util/materialize';

const alt = require('../alt');

class FlowActions {
    fetch() {
        return (dispatch) => {
            dispatch();
            util.GET(`${PROXY_URL}flows/v1/flow`)
                .then((data) => { this.set(data.flows); })
                .catch((error) => { this.fail(error); });
        };
    }

    set(flows) {
        return flows;
    }

    fetchFlow(flowid) {
        return (dispatch) => {
            dispatch();
            util.GET(`${PROXY_URL}flows/v1/flow/${flowid}`)
                .then((data) => { this.setSingle(data); })
                .catch((error) => { this.fail(error); });
        };
    }

    setSingle(flow) {
        return flow;
    }

    done() {
        return (dispatch) => { dispatch(); };
    }

    load() {
        return (dispatch) => { dispatch(); };
    }

    triggerCreate(flow, cb) {
        return (dispatch) => {
            dispatch();
            util.POST(`${PROXY_URL}flows/v1/flow`, flow)
                .then((response) => {
                    this.create(response);
                    cb(response.flow);
                })
                .catch((error) => { this.fail(error); });
        };
    }

    create(response) {
        return (dispatch) => { dispatch(response); };
    }

    triggerUpdate(id, flow, cb) {
        return (dispatch) => {
            dispatch();
            util.PUT(`${PROXY_URL}flows/v1/flow/${id}`, flow)
                .then((response) => {
                    this.update(response.flow);
                    if (cb) { cb(response.flow); }
                })
                .catch((error) => { this.fail(error); });
        };
    }

    update(flow) {
        return flow;
    }

    triggerRemove(id, cb) {
        return (dispatch) => {
            dispatch();
            util.DELETE(`${PROXY_URL}flows/v1/flow/${id}`)
                .then(() => {
                    this.remove(id);
                    cb(id);
                })
                .catch((error) => { this.fail(error); });
        };
    }

    remove(id) {
        return id;
    }

    fail(error) {
        toaster.error(error.message);
        return error;
    }

    setName(name) {
        return name;
    }
}

alt.createActions(FlowActions, exports);
