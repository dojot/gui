/* eslint-disable */
import React, { Fragment, Component } from 'react';
import { withRouter, hashHistory } from 'react-router';
import Slide from 'react-reveal/Slide';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import AltContainer from 'alt-container';
import { withNamespaces } from 'react-i18next';
import ability from 'Components/permissions/ability';
import { DojotBtnRedCircle } from 'Components/DojotButton';
import { RemoveModal } from 'Components/Modal';
import Can from 'Components/permissions/Can';
import { NewPageHeader } from 'Containers/full/PageHeader';
import FlowActions from '../../actions/FlowActions';
import FlowStore from '../../stores/FlowStore';
import util from '../../comms/util/util';
import toaster from '../../comms/util/materialize';
import { BASE_URL, PROXY_URL } from "Src/config";



class FlowCanvas extends Component {
    constructor(props) {
        super(props);

        this.state = { done: false };
        this.__updateCanvas = this.__updateCanvas.bind(this);

        // When cannotEdit is true, the flow is just for viewer
        this.cannotEdit = !ability.can('modifier', 'flows');
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
                },
            };
            fetch(`${PROXY_URL}flows/nodes`, config)
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
                                    $('.flows-wrapper')
                                        .i18n();
                                    initDOM();
                                }
                            });
                        }
                    });

                    if (count === 0) {
                        // jquery makes me sad
                        $('.flows-wrapper')
                            .i18n();
                    }
                })
                .catch((error) => {
                    console.error('failed to init nodes config', error);
                });
        }

        const domEntryPoint = this.scriptHolder;

        function initDOM(dom) {
            const config = {
                headers: {
                    accept: 'text/html',
                },
            };
            fetch(`${PROXY_URL}flows/nodes`, config)
                .then(response => response.text())
                .then((dom) => {
                    // this makes me *VERY* sad
                    $(domEntryPoint)
                        .append(dom);
                    $.getScript('js/ace/ace.js', () => {
                        ace.config.set('basePath', 'js/ace');
                    });
                    FlowActions.done();
                })
                .catch((error) => {
                    console.error('failed to fetch nodes dom', error);
                });
        }

        RED.i18n.init(() => {
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
        alreadySetted = false;
        if (observer.disconnect) {
            observer.disconnect();
        }
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

                    <div id="palette" style={this.cannotEdit ? { display: 'none' } : {}}>
                        <img src={`flows/red/images/spin.svg`} className="palette-spinner hide" />
                        <div id="palette-container" className="palette-scroll" />
                        <div id="palette-footer">
                            <a className="palette-button" id="palette-collapse-all" href="#">
                                <i
                                    className="fa fa-angle-double-up"
                                />

                            </a>
                            <a className="palette-button" id="palette-expand-all" href="#">
                                <i
                                    className="fa fa-angle-double-down"
                                />

                            </a>
                        </div>
                        <div id="palette-shade" className="hide" />
                    </div>
                </div>

                <div id="flows-node-scripts" ref={elem => (this.scriptHolder = elem)} />

                <MutationSchema isSaved={this.props.isSaved} somethingChanged={this.props.somethingChanged} />
            </div>
        );
    }
}

let alreadySetted = false;
var observer = {};

const MutationSchema = ({ somethingChanged, isSaved }) => {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    if (isSaved === false) {
        // if we already know that we should save, let's disconnect the observer
        observer.disconnect();
        alreadySetted = false;
    }
    else if (!alreadySetted) {
        setTimeout(() => {
            setMutation();
        }, 1000);
        alreadySetted = true;
    }

    function setMutation() {
        var target1 = document.querySelector('#chart>svg');
        //var target2 = document.querySelector('.editor-tray.ui-draggable');
        if (target1) {
            observer = new MutationObserver(function (mutations) {
                // sending false means isSaved = false;
                somethingChanged(false);
            });

            var config = {
                attributes: true,
                characterData: true
            };
            observer.observe(target1, config);
            //if (target2)
            //    observer.observe(target2, config);
        } else {
            alreadySetted = false;
        };
    }
    return null;
};

function handleSave(flowid, i18n, callbackSaved) {
    // fetch existing data for flow
    const fData = FlowStore.getState();
    let flow = null;
    if (flowid) {
        if (flowid in fData.flows) {
            flow = fData.flows[flowid];
        } else {
            console.error(i18n('flows:failed_find_ctx'));
            return;
        }
    } else {
        // handle flow creation
        flow = fData.newFlow;
    }
    // update flow's actual configuration data
    flow.name = fData.flowName;
    flow.flow = RED.nodes.createCompleteNodeSet();
    const ret = util.isNameValid(flow.name);
    if (flowid) {
        if (!ret.result) {
            toaster.error(ret.error);
        } else {
            flow.name = ret.label;
            FlowActions.triggerUpdate(flowid, flow, (flow) => {
                toaster.success(i18n('flows:alerts.update'));
                callbackSaved(true);
            });
        }
    } else if (!ret.result) {
        toaster.error(ret.error);
    } else {
        flow.name = ret.label;
        FlowActions.triggerCreate(flow, (flow) => {
            toaster.success(i18n('flows:alerts.create'));
            callbackSaved(true);
            hashHistory.push(`/flows/id/${flow.id}`);
        });
    }
}


class NameForm extends Component {
    constructor(props) {
        super(props);
        // When cannotEdit is true, the flow is just for viewer
        this.cannotEdit = !ability.can('modifier', 'flows');
    }

    render() {
        const { flowName, t } = this.props;

        if (this.cannotEdit) {
            return (<div className="col s6 margin-input">{flowName}</div>);
        }
        return (
            <Fragment>
                <div className="col s2 text-right bold">
                    <span>
                        {t('flows:header.name.label')}
                    </span>
                </div>
                <div className="col s5 ml0 input-field">
                    <input
                        id="fld_flowname"
                        type="text"
                        name="name"
                        onChange={(e) => {
                            e.preventDefault();
                            FlowActions.setName(e.target.value);
                        }}
                        maxLength={45}
                        value={flowName}
                    />
                </div>
            </Fragment>
        );
    }
}

class EditFlowComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSaved: true,
            show_modal: false,
        };
        this.openRemoveModal = this.openRemoveModal.bind(this);
        this.setModal = this.setModal.bind(this);
        this.removeFlow = this.removeFlow.bind(this);
        this.enableBeforeUnload = this.enableBeforeUnload.bind(this);
        this.disableBeforeUnload = this.disableBeforeUnload.bind(this);
        this.somethingChanged = this.somethingChanged.bind(this);
        this.routerWillLeave = this.routerWillLeave.bind(this);
    }

    somethingChanged(newState) {
        const isSaved = newState;
        if (isSaved)
            this.disableBeforeUnload();
        else
            this.enableBeforeUnload();
        this.setState({ isSaved: isSaved });
    }

    enableBeforeUnload() {
        window.onbeforeunload = function (e) {
            return "Discard changes?";
        };
    }

    disableBeforeUnload() {
        window.onbeforeunload = null;
    }

    removeFlow() {
        const { t: i18n } = this.props;
        FlowActions.triggerRemove(this.props.params.flowid, () => {
            toaster.success(i18n('flows:alerts.remove'));
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

    routerWillLeave() {
        // return false to prevent a transition w/o prompting the user,
        // or return a string to allow the user to decide:
        // return `null` or nothing to let other hooks to be executed
        // NOTE: if you return true, other hooks will not be executed!
        if (!this.state.isSaved) {
            return this.props.t('flows:alerts.work_is_not_saved_ask_to_confirm_exit');
        }
    }

    componentDidMount() {
        if (this.props.params.flowid) {
            FlowActions.fetchFlow.defer(this.props.params.flowid);
        } else {
            FlowActions.setName('');
        }

        // prevents immediate exit from the page if unsaved data exists.
        this.props.router.setRouteLeaveHook(this.props.route, this.routerWillLeave);
    }

    componentWillUnmount() {
        this.disableBeforeUnload();
    }

    render() {
        const { t: i18n } = this.props;
        const { isSaved } = this.state;
        return (
            <ReactCSSTransitionGroup
                transitionName="first"
                transitionAppear
                transitionAppearTimeout={500}
                transitionEnterTimeout={500}
                transitionLeaveTimeout={500}
            >
                <NewPageHeader
                    title={i18n('flows:title_edit')}
                    subtitle={i18n('flows:subtitle_edit')}
                    icon="flow"
                >
                    <div
                        className="row valign-wrapper absolute-input full-width no-margin top-minus-2 "
                    >
                        {(!isSaved ?
                            <Slide right duration={300}>
                                <div className="maybeNotSaved">
                                    <div className="boxLine"></div>
                                    <span>{i18n('flows:alerts.maybe_not_saved')}</span>
                                    <i className="fa fa-exclamation-triangle" ></i>
                                </div>
                            </Slide> : null)}
                        <AltContainer store={FlowStore}>
                            <NameForm t={i18n} />
                        </AltContainer>
                        <Can do="modifier" on="flows">
                            <DojotBtnRedCircle
                                icon=" fa fa-save"
                                tooltip={i18n('flows:header.save.label')}
                                click={() => {
                                    handleSave(this.props.params.flowid, i18n, this.somethingChanged);
                                }}
                            />
                            {this.props.params.flowid
                                && (
                                    <DojotBtnRedCircle
                                        icon="fa fa-trash"
                                        tooltip={i18n('flows:header.remove.label')}
                                        click={this.openRemoveModal}
                                    />
                                )}
                        </Can>
                        <DojotBtnRedCircle
                            to="/flows"
                            icon="fa fa-arrow-left"
                            tooltip={i18n('flows:header.return.label')}
                        />
                    </div>
                </NewPageHeader>
                <AltContainer store={FlowStore}>
                    <FlowCanvas isSaved={isSaved} somethingChanged={this.somethingChanged} flow={this.props.params.flowid} />
                </AltContainer>
                {this.state.show_modal
                    ? (
                        <RemoveModal
                            name={i18n('flows:element_name')}
                            remove={this.removeFlow}
                            openModal={this.setModal}
                        />
                    )
                    : <div />}
            </ReactCSSTransitionGroup>
        );
    }
}

export const EditFlow = (withNamespaces()(withRouter(EditFlowComponent)));
