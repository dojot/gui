/* eslint-disable */
import React, { Component } from 'react';
import { hashHistory } from 'react-router';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import AltContainer from 'alt-container';
import { NewPageHeader } from '../../containers/full/PageHeader';

import FlowActions from '../../actions/FlowActions';
import FlowStore from '../../stores/FlowStore';
import util from '../../comms/util/util';
import MaterialInput from '../../components/MaterialInput';
import { DojotBtnRedCircle } from '../../components/DojotButton';
import toaster from '../../comms/util/materialize';
import { RemoveModal } from '../../components/Modal';

class FlowCanvas extends Component {
    constructor(props) {
        super(props);

        this.state = { done: false };
        this.__updateCanvas = this.__updateCanvas.bind(this);
    }

    componentDidMount() {
        FlowActions.load.defer();
        const dynRED = require('./red.js');
        const RED = dynRED.RED;

        // This is required since the nodes' code are run outside of react's scope
        // Since node-red compatibility is an interesting plus, this workaround is needed
        // TODO this makes me remarkably sad
        window.RED = RED;
        window.util = util;

        function initNodes() {
            const config = {
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer: ${util.getToken()}`,
                },
            };
            fetch('mashup/nodes', config)
                .then(response => response.json())
                .then((nodes) => {
                    RED.nodes.setNodeList(nodes);
                    let count = 0; // used to control the i18n updating call
                    // let elem = this.scriptHolder;
                    nodes.map((n) => {
                        if (n.module !== 'node-red') {
                            count++;
                            RED.i18n.loadCatalog(n.id, () => {
                                count--;
                                if (count === 0) {
                                    // tells i18next to update the page's localization placeholders
                                    // jquery makes me sad
                                    $('.flows-wrapper').i18n();
                                    initDOM();
                                }
                            });
                        }
                    });

                    if (count === 0) {
                        // jquery makes me sad
                        $('.flows-wrapper').i18n();
                    }
                })
                .catch((error) => { console.error('failed to init nodes config', error); });
        }

        const domEntryPoint = this.scriptHolder;
        function initDOM(dom) {
            const config = {
                headers: {
                    accept: 'text/html',
                    authorization: `Bearer: ${util.getToken()}`,
                },
            };
            fetch('mashup/nodes', config)
                .then(response => response.text())
                .then((dom) => {
                    // this makes me *VERY* sad
                    $(domEntryPoint).append(dom);
                    $.getScript('js/ace/ace.js', () => {
                        ace.config.set('basePath', 'js/ace');
                    });
                    FlowActions.done();
                })
                .catch((error) => { console.error('failed to fetch nodes dom', error); });
        }

        RED.i18n.init(`Bearer: ${util.getToken()}`, () => {
            RED.palette.init();
            RED.workspaces.init();
            RED.view.init();
            RED.keyboard.init();
            RED.editor.init();
            RED.typeSearch.init();
            initNodes();
        });
    }

    /**
   * Updates the redered flow when the store finishes loading
   * */
    __updateCanvas() {
        if ((this.props.loading == false) && (this.state.done == false)) {
            // to be on the safe side (avoids re-importing things after save)
            RED.workspaces.remove(null);
            RED.nodes.clear();

            if (this.props.flow) {
                if (this.props.flow in this.props.flows) {
                    RED.nodes.version(null);
                    RED.nodes.import(this.props.flows[this.props.flow].flow);
                    RED.nodes.dirty(false);
                    RED.view.redraw(true);
                    RED.workspaces.show(RED.__currentFlow);
                } else {
                    console.error(`unknown flow ${this.props.flow}`);
                }
            } else {
                RED.nodes.version(null);
                RED.nodes.import([]);
                RED.nodes.dirty(false);
                RED.view.redraw(true);
                RED.workspaces.show(RED.__currentFlow);
            }
        }
    }

    componentDidUpdate() {
        if ((this.props.loading == false) && (this.props.canvasLoading == false) && (this.state.done == false)) {
            this.setState({ done: true });
        }
    }

    componentWillUnmount() {
    // makes sure that ongoing edits are not carried over to the next flow rendering session
        RED.workspaces.remove(null);
        RED.nodes.clear();
        window.RED = null;
        RED = null;
        FlowActions.load();
    }

    render() {
    // while not proper rendering per-se, it makes more sense for this to be here
        if ((this.props.canvasLoading == false) && RED) {
            this.__updateCanvas();
        }

        return (
            <div className="flows-wrapper">
                <div id="main-container">
                    <div id="workspace">
                        <div id="chart" tabIndex="1" />
                        <div id="workspace-toolbar" />
                        <div id="editor-shade" className="hide" />
                    </div>
                    <div id="editor-stack" />

                    <div id="palette">
                        {/* This gets updated on didMount */}
                        <img src="mashup/red/images/spin.svg" className="palette-spinner hide" />
                        {/* This gets updated on didMount */}
                        {/* <div id="palette-search" className="palette-search hide">
              <input type="text" data-i18n="[placeholder]palette.filter"></input>
            </div> */}
                        {/* This gets updated on didMount */}
                        <div id="palette-container" className="palette-scroll" />
                        <div id="palette-footer">
                            <a className="palette-button" id="palette-collapse-all" href="#"><i className="fa fa-angle-double-up" /></a>
                            <a className="palette-button" id="palette-expand-all" href="#"><i className="fa fa-angle-double-down" /></a>
                        </div>
                        <div id="palette-shade" className="hide" />
                    </div>
                </div>

                <div id="flows-node-scripts" ref={elem => (this.scriptHolder = elem)}>
                    {/*
              This will actually hold a number of scripts that handle the individual node's
              configuration forms and client-side validations.
          */}
                </div>

            </div>
        );
    }
}

function handleSave(flowid) {
    // fetch existing data for flow
    const fData = FlowStore.getState();
    let flow = null;
    if (flowid) {
        if (flowid in fData.flows) {
            flow = fData.flows[flowid];
        } else {
            console.error('failed to find flow context');
            return;
        }
    } else {
    // handle flow creation
        flow = fData.newFlow;
    }

    // update flow's actual configuration data
    flow.name = fData.flowName; 
    flow.flow = RED.nodes.createCompleteNodeSet();
    if (flowid) {
        FlowActions.triggerUpdate(flowid, flow, (flow) => {
            toaster.success('Flow updated');
        });
    } else {
        if (flow.name === "") {
            toaster.error('Flow name is required');
        } else {
            FlowActions.triggerCreate(flow, (flow) => {          
                toaster.success('Flow created');
                hashHistory.push(`/flows/id/${flow.id}`);
            });
        }                
    }
}


class NameForm extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <MaterialInput
                id="fld_flowname"
                name="name"
                className="col s8"
                value={this.props.flowName}
                onChange={(e) => {
                    e.preventDefault();
                    FlowActions.setName(e.target.value);
                }}
                maxLength={45}
            >
        Flow name
            </MaterialInput>
        );
    }
}

export class EditFlow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            show_modal: false,
        };
        this.openRemoveModal = this.openRemoveModal.bind(this);
        this.setModal = this.setModal.bind(this);
        this.removeFlow = this.removeFlow.bind(this);
    }

    removeFlow() {
        FlowActions.triggerRemove(this.props.params.flowid, () => {
            toaster.success('Flow removed');
            hashHistory.push('/flows');
        });
        // console.log('removeFlow', this.props.params.flowid);
    }

    openRemoveModal() {
        this.setState({ show_modal: true });
    }

    setModal(status) {
        this.setState({ show_modal: status });
    }

    componentDidMount() {
        if (this.props.params.flowid) {
            FlowActions.fetchFlow.defer(this.props.params.flowid);
        } else {
            FlowActions.setName('');
        }
    }

    render() {
        return (
            <ReactCSSTransitionGroup transitionName="first" transitionAppear transitionAppearTimeout={500} transitionEnterTimeout={500} transitionLeaveTimeout={500}>
                <NewPageHeader title="flow manager" subtitle="Flow configuration" icon="flow">
                    <div className="row valign-wrapper full-width no-margin top-minus-2">
                        <AltContainer store={FlowStore}>
                            <NameForm />
                        </AltContainer>
                        <DojotBtnRedCircle
                            icon=" fa fa-save"
                            tooltip="Save Flow"
                            click={() => {
                                handleSave(this.props.params.flowid);
                            }}
                        />
                        {this.props.params.flowid && <DojotBtnRedCircle icon="fa fa-trash" tooltip="Remove Flow" click={this.openRemoveModal} />}
                        <DojotBtnRedCircle to="/flows" icon="fa fa-arrow-left" tooltip="Return to Flow list" />
                    </div>
                </NewPageHeader>
                <AltContainer store={FlowStore}>
                    <FlowCanvas flow={this.props.params.flowid} />
                </AltContainer>
                {this.state.show_modal ? <RemoveModal name="flow" remove={this.removeFlow} openModal={this.setModal} /> : <div />}
            </ReactCSSTransitionGroup>
        );
    }
}
