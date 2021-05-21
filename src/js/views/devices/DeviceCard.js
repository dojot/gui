/* eslint-disable */
import React, { Component } from 'react';
import { Link } from 'react-router';
import { Loading } from '../../components/Loading';
import util from '../../comms/util/util';
import TemplateActions from '../../actions/TemplateActions';
import TemplateStore from '../../stores/TemplateStore';

import MaterialSelect from '../../components/MaterialSelect';

import { Filter } from '../maps/Manipulation';
import Sidebar from './Sidebar';
import AltContainer from 'alt-container';
import DeviceFormStore from './Store';
import { FormActions } from "./Actions";

import { withNamespaces } from 'react-i18next';
import ability from 'Components/permissions/ability';

function SummaryItem(props) {
    let attrs = 0;

    for (const attribute in props.device.attrs) {
        attrs += props.device.attrs[attribute].length;
    }
    const canView = ability.canView('device-manager-devices');
    const canEdit = ability.canModify('device-manager-devices');

    return (
        <div className="mg20px fl flex-order-2">
            <div className="card-size card-hover lst-entry-wrapper z-depth-2 mg0px pointer" onClick={() => { if (canEdit) FormActions.set(props.device) }}>
                <div className="lst-entry-title col s12">
                    <img className="title-icon" src="images/icons/chip-wt.png" />
                    <div className="title-text truncate">
                        <span className="text" title={props.device.label}>
                            {props.device.label}
                        </span>
                    </div>
                    <div className="title-edit" >
                        {canView ?
                            <Link to={`/device/id/${props.device.id}/detail`}>
                                <i title={props.t('devices:alts.details')} className="fa fa-info-circle fa-2x color-white" />
                            </Link> : null
                        }
                    </div>
                </div>
                <div className="attr-list">
                    <div className="attr-area light-background">
                        <div className="attr-row">
                            <div className="icon">
                                <img src="images/tag.png" />
                            </div>
                            <div className="attr-content">
                                <input type="text" value={attrs} disabled />
                                <span>{props.t('text.properties')}</span>
                            </div>
                            <div className="center-text-parent material-btn right-side" />
                        </div>
                        <div className="attr-row">
                            <div className="icon">
                                <img src="images/update.png" />
                            </div>
                            <div className="attr-content">
                                <input type="text" value={util.iso_to_date(props.device.created)} disabled />
                                <span>{props.t('text.last_update')}</span>
                            </div>
                            <div className="center-text-parent material-btn right-side" />
                        </div>
                        <div className={props.device.status} />
                    </div>
                </div>
            </div>
        </div>
    );
}


class DeviceCardListComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
        };
        this.convertDeviceList = this.convertDeviceList.bind(this);
        this.filteredList = [];
    }

    convertDeviceList() {
        this.filteredList = [];
        for (const k in this.props.deviceList) {
            this.filteredList.push(this.props.deviceList[k]);
        }
    }

    render() {
        const { t } = this.props;

        if (this.props.loading) {
            return <Loading />;
        }

        this.convertDeviceList();

        this.metaData = { alias: t('devices:device') };
        if (this.props.toggle.props.toggleState) {
            this.props.dev_opex.setFilterToCard();
        }

        return (
            <div className="full-height flex-container pos-relative overflow-x-hidden">
                <Filter showPainel={this.props.showFilter} metaData={this.metaData} ops={this.props.dev_opex} fields={withNamespaces()(DevFilterFields)} />
                <AltContainer store={DeviceFormStore}>
                    <Sidebar ops={this.props.dev_opex}
                        numOfDevPage={this.props.deviceList.length} />
                </AltContainer>
                {this.filteredList.length === 0 ? (
                    <div className="background-info valign-wrapper full-height">
                        <span className="horizontal-center">
                            {this.props.dev_opex.hasFilter()
                                ? <b className="noBold">{t('devices:no_devices_shown')}</b>
                                : <b className="noBold">{t('devices:no_configured_devices')}</b>
                            }
                        </span>
                    </div>
                ) : (
                    <div className="col s12 lst-wrapper w100 hei-100-over-scroll flex-container">
                        {this.filteredList.map(device => (
                            <SummaryItem device={device} key={device.id} t={t} />
                        ))}
                    </div>
                )}
            </div>
        );
    }
}


class DevFilterFields extends Component {
    constructor(props) {
        super(props);

        this.convertTemplateList = this.convertTemplateList.bind(this);
        this.createSelectTemplates = this.createSelectTemplates.bind(this);
        this.templates = [];
    }

    convertTemplateList() {
        this.templates = [];
        for (const k in TemplateStore.state.templatesAllList) {
            if (TemplateStore.state.templatesAllList.hasOwnProperty(k)) {
                this.templates.push(TemplateStore.state.templatesAllList[k]);
            }
        }
    }

    createSelectTemplates() {
        const { t } = this.props;
        const items = [];
        items.push(<option key="select_template" value="">
            {`${t('text.select')}   ${t('templates:template')}`}</option>);
        for (let i = 0; i < this.templates.length; i++) {
            items.push(<option key={this.templates[i].id} value={this.templates[i].id}>
                {this.templates[i].label}
            </option>);
        }
        return items;
    }

    componentDidMount() {
        TemplateActions.fetchAllTemplates.defer();
    }

    render() {
        if (this.templates.length === 0) this.convertTemplateList();
        const { t } = this.props;
        this.opts = this.createSelectTemplates();
        return (
            <div className="col s12 m12">
                <div className="col s5 m5">
                    <div className="dev_field_filter">
                        <label htmlFor="fld_device_name">{`${t('devices:title')}`} </label>
                        <input id="fld_device_name" type="text" className="form-control form-control-lg margin-top-mi7px" placeholder={t('text.name')}
                            value={this.props.fields.label} name="label" onChange={this.props.onChange} onKeyUp={this.props.KeyUp} />
                    </div>
                </div>
                <div className="col s1 m1">&nbsp;</div>

                <div className="col s6 m6">
                    <div className="col s12">
                        <MaterialSelect id="flr_templates" name="templates" label={t('templates:title')} value={this.props.fields.templates} onChange={this.props.onChange}>
                            {this.opts}
                        </MaterialSelect>
                    </div>
                </div>
            </div>
        );
    }
}

const DeviceCardList = withNamespaces()(DeviceCardListComponent);
export { DeviceCardList };
