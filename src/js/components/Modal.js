/* eslint-disable */
import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import {
    DojotBtnClassic,
} from './DojotButton';

class RemoveModalComponent extends Component {
    constructor(props) {
        super(props);

        this.openModal = this.openModal.bind(this);
        this.remove = this.remove.bind(this);
    }

    openModal(statusModal) {
        this.props.openModal(statusModal);
    }

    remove(event) {
        event.preventDefault();
        this.props.remove(event);
    }

    render() {
        const { t } = this.props;
        const op_type = { label: t('remove.label') };
        const title = `${t('remove.label')} ${this.props.name}`;
        const first_message = t('qst_remove', { label: this.props.name });
        return (
            <GenericModal title={title} first_message={first_message} openModal={this.openModal}
                click={this.remove} op_type={op_type} btnLabel={t('remove.label')} />
        );
    }
}

class GenericModalComponent extends Component {
    constructor(props) {
        super(props);

        this.dismiss = this.dismiss.bind(this);
        this.primary_click = this.primary_click.bind(this);
    }

    dismiss() {
        this.props.openModal(false);
    }

    primary_click(event) {
        event.preventDefault();
        this.props.click(event);
    }

    render() {
        const { t } = this.props;
        return (
            <div className="">
                <div className="row confirm-modal">
                    <div className="confirm-modal-head">
                        <div className="col s4 img-alert">
                            <div><i className="fa fa-exclamation-triangle fa-4x" /></div>
                        </div>
                        <div className="col s8 message">
                            <div className="message-title left">{this.props.title}</div>
                            <div className="message-subtitle left">{this.props.first_message}</div>
                        </div>
                    </div>
                    <div className="col s12 text-right">
                        <DojotBtnClassic color="blue" type="primary" onClick={this.primary_click}
                            label={this.props.op_type.label}
                            title={this.props.op_type.label} />
                        <DojotBtnClassic type="secondary" onClick={this.dismiss}
                            label={t('cancel.label')}
                            title={t('cancel.label')} />
                    </div>
                </div>
                <div className="modal-background" onClick={this.dismiss} />
            </div>
        );
    }
}

const GenericModal = withNamespaces()(GenericModalComponent);
const RemoveModal = withNamespaces()(RemoveModalComponent);
export {
    GenericModal, RemoveModal,
};
