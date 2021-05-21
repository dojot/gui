/* eslint-disable */
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import AltContainer from 'alt-container';
import { withNamespaces } from 'react-i18next';
import * as i18next from 'i18next';
import { Loading } from 'Components/Loading';
import { Attr } from 'Components/HistoryElements';
import { DojotBtnRedCircle } from 'Components/DojotButton';
import MeasureActions from 'Actions/MeasureActions';
import DeviceActions from 'Actions/DeviceActions';
import CertificateActions from 'Actions/CertificateActions';
import MeasureStore from 'Stores/MeasureStore';
import DeviceStore from 'Stores/DeviceStore';
import ConfigStore from 'Stores/ConfigStore';
import Metadata from './Details/Metadata';
import { NewPageHeader } from 'Containers/full/PageHeader';
import util from 'Comms/util/util';
import socketio from 'socket.io-client';
import Can from 'Components/permissions/Can';
import Report from './Report';
import { BASE_URL, PROXY_URL } from 'Src/config';
import GenericList from './GenericList';

const DeviceHeader = ({ device, t, listAttrDySelected }) => (
    <div className="row devicesSubHeader p0 device-details-header">
        <div className="col s3 m3">
            <span className="col s12 device-label truncate" title={device.label}>
                {device.label}
            </span>
            <div className="col s12 device-label-name">{t('text.name')}</div>
        </div>
        <Report
            deviceLabel={device.label}
            deviceId={device.id}
            listAttrDySelected={listAttrDySelected}
            t={t}
        />
    </div>
);

DeviceHeader.propTypes = {
    device: PropTypes.shape({}).isRequired,
    t: PropTypes.func.isRequired,
    listAttrDySelected: PropTypes.shape({}).isRequired,
};


class Attribute extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false,
        };
        this.toggleExpand = this.toggleExpand.bind(this);
    }

    toggleExpand() {
        const { opened } = this.state;
        this.setState({ opened: !opened });
    }

    render() {
        // check the current window, if less then 1024px, blocks compressed state
        const { opened } = this.state;
        const { device, attr, isStatic } = this.props;
        const { label, value_type: valueType, metadata, type } = attr;
        const isOpened = util.checkWidthToStateOpen(opened);
        return (
            <div className={`attributeBox ${isOpened ? 'expanded' : 'compressed'}`}>
                <div className="header">
                    <span>{label}</span>
                    <i
                        role="button"
                        tabIndex="-1"
                        onKeyUp={this.toggleExpand.bind(this)}
                        onClick={this.toggleExpand.bind(this)}
                        className={isOpened ? 'fa fa-compress' : 'fa fa-expand'}
                    />

                </div>
                <div className="details-card">
                    <AttrHistory
                        device={device}
                        deviceType={type}
                        type={valueType}
                        attr={label}
                        metadata={metadata}
                        isStatic={isStatic === true}
                    />
                </div>
            </div>
        );
    }
}

Attribute.propTypes = {
    device: PropTypes.shape({}).isRequired,
    attr: PropTypes.shape({}).isRequired,
};

const Configurations = ({ t, attrs, device }) => (
    <div>
        <GenericList
            img="images/gear-dark.png"
            attrs={attrs}
            boxTitle={t('text.properties')}
            device={device}
            t={t}
        />
    </div>
);

Configurations.propTypes = {
    device: PropTypes.shape({}).isRequired,
    attrs: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    t: PropTypes.func.isRequired,
};


const StaticAttributes = ({ t, openStaticMap, attrs, device }) => (
    <div>
        <GenericList
            img="images/tag.png"
            attrs={attrs}
            boxTitle={t('text.static_attributes')}
            device={device}
            openStaticMap={openStaticMap}
            t={t}
        />
    </div>
);

StaticAttributes.propTypes = {
    device: PropTypes.shape({}).isRequired,
    attrs: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    openStaticMap: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};



class DyAttributeArea extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedAttributes: [],
            isAttrsVisible: {},
        };
        this.toggleAttribute = this.toggleAttribute.bind(this);
    }

    toggleAttribute(attr) {
        let { selectedAttributes: sa } = this.state;
        const { isAttrsVisible } = this.state;
        if (isAttrsVisible[attr.id]) {
            sa = sa.filter(attribute => attribute.id !== attr.id);
            delete isAttrsVisible[attr.id];
        } else {
            sa.push(attr);
            isAttrsVisible[attr.id] = true;
        }

        const { updateListAttrDySelected } = this.props;

        updateListAttrDySelected(sa);

        // update attributes
        this.setState({
            selectedAttributes: sa,
            isAttrsVisible,
        });
    }

    render() {
        const { isAttrsVisible, selectedAttributes } = this.state;
        const {
            openStaticMap, device, t, actuators, dynamicAttrs,
        } = this.props;

        const auxAttrs = JSON.parse(JSON.stringify(dynamicAttrs));
        const auxActuators = JSON.parse(JSON.stringify(actuators));
        // preparing dynamic attributes

        for (const index in auxAttrs) {
            auxAttrs[index].visible = !!isAttrsVisible[auxAttrs[index].id];
        }

        // preparing actuators
        for (const index in auxActuators) {
            auxActuators[index].visible = !!isAttrsVisible[auxActuators[index].id];
        }

        const NoActiveAttr = () => (
            <div className="second-col-label center-align">
                {t('devices:select_attribute')}
            </div>
        );

        let atStatic = [];
        if (openStaticMap.length) {
            // we need get the geo-point data for each selected attrs;
            Object.values(device.attrs)
                .forEach(arry => {
                    arry.forEach(element => {
                        if (openStaticMap.filter(i =>
                            element.type === 'static'
                            && element.value_type === 'geo:point'
                            && element.id === i).length === 1) //just found the attr
                        {
                            atStatic.push(element);
                        }
                    });
                });
        }

        return (
            <div className="content-row float-right">
                <div className="second-col">
                    {selectedAttributes.length === 0 && atStatic.length === 0
                        ? (
                            <NoActiveAttr />
                        )
                        : null
                    }
                    {
                        atStatic.map(atsta => (
                            <Attribute
                                key={atsta.id}
                                attr={atsta}
                                device={device}
                                isStatic={true}
                            />
                        ))
                    }
                    {selectedAttributes.map(at => (
                        <Attribute key={at.id} device={device} attr={at} />
                    ))}
                </div>
                <div className="third-col">
                    <div className="row">
                        <DynamicAttributeList
                            device={device}
                            attrs={auxAttrs}
                            toggleAttribute={this.toggleAttribute}
                            t={t}
                        />
                    </div>
                    <div className="row">
                        <ActuatorsList
                            device={device}
                            actuators={auxActuators}
                            toggleAttribute={this.toggleAttribute}
                            t={t}
                        />
                    </div>
                </div>
            </div>
        );
    }
}


DyAttributeArea.propTypes = {
    device: PropTypes.shape({}).isRequired,
    actuators: PropTypes.shape({}).isRequired,
    dynamicAttrs: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    openStaticMap: PropTypes.bool,
    t: PropTypes.func.isRequired,
};

DyAttributeArea.defaultProps = {
    openStaticMap: false,
};


class ActuatorsList extends Component {
    constructor(props) {
        super(props);
        this.clickAttr = this.clickAttr.bind(this);
    }

    componentWillMount() {
        const { device } = this.props;
        const { attrs } = device;

        for (const i in attrs) {
            for (const j in attrs[i]) {
                if (attrs[i][j].type === 'actuator') {
                    MeasureActions.fetchMeasure.defer(device, attrs[i][j].label, 10);
                }
            }
        }
    }

    clickAttr(attr) {
        const { toggleAttribute } = this.props;
        toggleAttribute(attr);
    }

    render() {
        const { t, actuators } = this.props;
        return (
            <div className="stt-attributes dy_attributes">
                <div className="col s12 header">
                    <div className="icon">
                        <img src="images/gear-dark.png" />
                    </div>
                    <span>{t('text.actuators')}</span>
                </div>
                <div className="col s12 body">
                    {actuators.map(actuator => (

                        <Fragment>
                            <div
                                role="button"
                                tabIndex="0"
                                key={actuator.label}
                                className="line-dy"
                                onKeyUp={this.clickAttr.bind(this, actuator)}
                                onClick={this.clickAttr.bind(this, actuator)}
                            >
                                <div className="col-label-body">
                                    <div
                                        className="label truncate"
                                        title={actuator.label}
                                    >
                                        {actuator.label}
                                    </div>
                                    <div
                                        className="value-label"
                                    >
                                        {i18next.exists(`types.${actuator.value_type}`) ? t(`types.${actuator.value_type}`) : actuator.value_type}

                                    </div>
                                </div>
                                <div className="col-label-star">
                                    <div className="star">
                                        <i className={`fa ${actuator.visible ? 'fa-star' : 'fa-star-o'}`} />
                                    </div>
                                </div>

                            </div>
                            {Object.prototype.hasOwnProperty.call(actuator, 'metadata') ?
                                <Metadata attr={actuator} /> : null}
                            <hr />
                        </Fragment>
                    ))}
                </div>
            </div>

        );
    }
}

ActuatorsList.propTypes = {
    device: PropTypes.shape({}).isRequired,
    actuators: PropTypes.shape({}).isRequired,
    toggleAttribute: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};


class DynamicAttributeList extends Component {
    constructor(props) {
        super(props);
        this.state = { truncate: false };
        this.clickAttr = this.clickAttr.bind(this);
        this.limitSizeField = this.limitSizeField.bind(this);
    }

    componentWillMount() {
        const { device, attrs: propsAttrs } = this.props;
        const { attrs } = device;
        for (const i in attrs) {
            for (const j in attrs[i]) {
                if (attrs[i][j].type !== 'meta') {
                    if (attrs[i][j].type === 'dynamic') {
                        if (attrs[i][j].value_type === 'geo:point') {
                            MeasureActions.fetchPosition.defer(device, device.id, attrs[i][j].label);
                        }
                    }
                    MeasureActions.fetchMeasure.defer(device, attrs[i][j].label, 10);
                }
            }
        }

        this.limitSizeField(propsAttrs);
    }

    clickAttr(attr) {
        const { toggleAttribute } = this.props;
        toggleAttribute(attr);
    }

    limitSizeField(dyAttrs) {
        dyAttrs.map((dyAttr) => {
            if (dyAttr.label.length > 20) {
                this.setState({ truncate: true });
            }
        });
    }

    render() {
        const { truncate } = this.state;
        const { t, attrs } = this.props;
        return (
            <div className="stt-attributes dy_attributes">
                <div className="col s12 header">
                    <div className="icon">
                        <img src="images/tag.png" />
                    </div>
                    <span>{t('devices:dynamic_attributes')}</span>
                </div>
                <div className="col s12 body">
                    {attrs.map(attr => (
                        <Fragment>
                            <div
                                role="button"
                                tabIndex="0"
                                key={attr.label}
                                className="line-dy"
                                onKeyUp={this.clickAttr.bind(this, attr)}
                                onClick={this.clickAttr.bind(this, attr)}
                            >
                                <div className="col-label-body">
                                    <div
                                        className={truncate ? 'label truncate' : 'label'}
                                        title={i18next.exists(`options.config_type.values.${attr.label}`) ? t(`options.config_type.values.${attr.label}`) : `${attr.label}`}
                                    >
                                        {i18next.exists(`options.config_type.values.${attr.label}`) ? t(`options.config_type.values.${attr.label}`) : `${attr.label}`}

                                    </div>
                                    <div
                                        className="value-label"
                                    >
                                        {i18next.exists(`types.${attr.value_type}`) ? t(`types.${attr.value_type}`) : attr.value_type}

                                    </div>
                                </div>
                                <div className="col-label-star">
                                    <div className="star">
                                        <i className={`fa ${attr.visible ? 'fa-star' : 'fa-star-o'}`} />
                                    </div>
                                </div>

                            </div>
                            {Object.prototype.hasOwnProperty.call(attr, 'metadata') ?
                                <Metadata attr={attr} /> : null}
                            <hr />
                        </Fragment>
                    ))}
                </div>
            </div>
        );
    }
}

DynamicAttributeList.propTypes = {
    device: PropTypes.shape({}).isRequired,
    attrs: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    toggleAttribute: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};


const DeviceUserActions = ({ t }) => (
    <div>
        <DojotBtnRedCircle
            to="/device/list"
            icon="fa fa-arrow-left"
            tooltip={t('devices:return_list')}
        />
    </div>
);


const AttrHistory = ({ device, type, attr, metadata, isStatic = false, deviceType }) => {

    if (isStatic) {
        //to avoid pass flux containers to a static attribute
        return (
            <Attr
                device={device}
                deviceType={deviceType}
                type={type}
                attr={attr}
                label={attr}
                metadata={metadata}
                isStatic={isStatic}
            />
        );

    } else {
        return (
            <Fragment>
                <AltContainer stores={{
                    MeasureStore,
                    Config: ConfigStore,
                }}>
                    <Attr
                        device={device}
                        deviceType={deviceType}
                        type={type}
                        attr={attr}
                        label={attr}
                        metadata={metadata}
                        isStatic={isStatic}
                    />
                </AltContainer>
            </Fragment>
        );
    }
};

AttrHistory.propTypes = {
    device: PropTypes.shape({}).isRequired,
    type: PropTypes.string.isRequired,
    attr: PropTypes.string.isRequired,
};

class DeviceDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openStaticMap: false,
            listStaticMapOpenned: []
        };

        this.openStaticMap = this.openStaticMap.bind(this);
    }

    openStaticMap(updatedList) {
        let openStaticMap = (updatedList.length > 0);
        this.setState({
            openStaticMap,
            listStaticMapOpenned: updatedList
        });
    }

    render() {
        const { listStaticMapOpenned } = this.state;
        const { device, t, updateListAttrDySelected } = this.props;
        let attr_list = [];
        let dal = [];
        let actuators = [];
        let config_list = [];
        // splitting attributes
        for (const index in device.attrs) {
            let tmp = device.attrs[index];
            if (!Array.isArray(tmp)) {
                tmp = device.attrs;
            }

            attr_list = attr_list.concat(tmp.filter(i => String(i.type) === 'static'));
            dal = dal.concat(tmp.filter((i) => {
                i.visible = false;
                return String(i.type) === 'dynamic';
            }));
            actuators = actuators.concat(tmp.filter((i) => {
                i.visible = false;
                return String(i.type) === 'actuator';
            }));
            config_list = config_list.concat(tmp.filter(i => String(i.type) === 'meta'));
        }
        return (
            <div className="row detail-body">
                <div className="first-col">
                    <Configurations
                        device={device}
                        attrs={config_list}
                        t={t}
                    />
                    <StaticAttributes
                        device={device}
                        attrs={attr_list}
                        openStaticMap={this.openStaticMap}
                        t={t}
                    />
                </div>
                <DyAttributeArea
                    device={device}
                    actuators={actuators}
                    dynamicAttrs={dal}
                    openStaticMap={listStaticMapOpenned}
                    updateListAttrDySelected={updateListAttrDySelected}
                    t={t}
                />
            </div>
        );
    }
}


class ViewDeviceImpl extends Component {

    constructor(props) {
        super(props);
        this.state = {
            listAttrDySelected: [],
        };
        this.updateListAttrDySelected = this.updateListAttrDySelected.bind(this);
    }

    updateListAttrDySelected(attrs) {
        this.setState({ listAttrDySelected: attrs });
    }

    componentWillMount() {
        const { devices, device_id } = this.props;
        const device = devices[device_id];
        if (device === undefined) return; // not ready

        for (const i in device.attrs) {
            for (const j in device.attrs[i]) {
                if (device.attrs[i][j].type !== 'meta' && device.attrs[i][j].type !== 'static') {
                    MeasureActions.fetchMeasure.defer(device, device.attrs[i][j].label, 10);
                }
            }
        }
    }

    render() {
        let device;
        const { t, devices } = this.props;
        const { listAttrDySelected } = this.state;

        if (devices !== undefined) {
            if (devices.hasOwnProperty(this.props.device_id)) {
                device = devices[this.props.device_id];
            }
        }

        if (device === undefined) {
            return (<Loading />);
        }
        return (
            <div className="full-height bg-light-gray">
                <NewPageHeader
                    title={t('devices:title')}
                    subtitle={t('devices:subtitle')}
                    icon="device"
                >
                    <div className="box-sh">
                        <DeviceUserActions
                            t={t}
                        />
                    </div>
                </NewPageHeader>
                <DeviceHeader
                    device={device}
                    t={t}
                    listAttrDySelected={listAttrDySelected}
                />
                <DeviceDetail
                    deviceid={device.id}
                    device={device}
                    t={t}
                    updateListAttrDySelected={this.updateListAttrDySelected}
                />
            </div>
        );
    }
}

class CertificateComponent extends Component {
    constructor(props) {
        super(props);
        this.handleClickNewCerts = this.handleClickNewCerts.bind(this);
        this.handleClickCACert = this.handleClickCACert.bind(this);
    }

    componentDidMount() {
        CertificateActions.cleanStorePrivateKey.defer();
        CertificateActions.cleanStoreCRL.defer();
        CertificateActions.cleanStoreCACRL.defer();
    }

    handleClickNewCerts() {
        CertificateActions.updateCertificates.defer(this.props.deviceId, this.props.loginStore.user.service);
    }

    handleClickCACert() {
        CertificateActions.updateCACertificates.defer();
    }

    render() {
        const {
            t,
            deviceId,
            certStore:
            {
                privateKey,
                crt,
                caCrt
            },
            loginStore: {
                user: {
                    service
                }
            }
        } = this.props;

        const nameFile = service + ':' + deviceId;

        return (
            <Fragment>
                <Can do="modifier" on="x509-identity-mgmt">
                    <div className="line">
                        <div className="display-flex-column flex-1">
                            <div
                                className={'name-value '}
                                title={t('certificates:title_cert')}
                            >
                                {t('certificates:title_cert')}

                            </div>
                            <div className="display-flex-no-wrap space-between">
                                <div className="w100">
                                    <div className="w100">
                                        <button type="button"
                                            title={t('certificates:btn_generate')}
                                            className="btn-crl"
                                            onClick={this.handleClickNewCerts}
                                            disabled={!!privateKey && !!crt}>
                                            {t('certificates:btn_generate')}
                                            &nbsp; &nbsp;
                                            <i className="fa fa-lock" />
                                        </button>

                                    </div>
                                    <div>
                                        <a href={'data:application/pkcs8,' + encodeURIComponent(privateKey)}
                                            download={nameFile + '.key'}
                                            className={privateKey ? '' : 'hide'}
                                            title={t('certificates:down_private_key')}>
                                            <i className="fa fa-arrow-circle-down" /> {t('certificates:down_private_key')}
                                        </a>
                                    </div>
                                    <div>
                                        <a href={'data:application/pkcs8,' + encodeURIComponent(crt)}
                                            title={t('certificates:down_crt')}
                                            download={nameFile + '.crt'}
                                            className={crt ? '' : 'hide'}>
                                            <i className="fa fa-arrow-circle-down" /> {t('certificates:down_crt')}
                                        </a>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </Can>
                <hr />
                <Can do="viewer" on="x509-identity-mgmt">
                    <div className="line">
                        <div className="display-flex-column flex-1">
                            <div
                                className={'name-value '}
                                title={t('certificates:title_ca')}
                            >
                                {t('certificates:title_ca')}
                                <sub> {t('certificates:down_ca_crt_alt')}</sub>

                            </div>
                            <div className="display-flex-no-wrap space-between">
                                <div className="w100"
                                >
                                    <div className="w100">
                                        <button type="button" title={t('certificates:btn_load')}
                                            className="btn-crl"
                                            onClick={this.handleClickCACert}
                                            disabled={!!caCrt}>
                                            {t('certificates:btn_load')}
                                            &nbsp; &nbsp;
                                            <i className="fa fa-lock" />
                                        </button>

                                    </div>
                                    <div>
                                        <a href={'data:application/pkcs8,' + encodeURIComponent(caCrt)}
                                            download='ca.crt'
                                            className={caCrt ? '' : 'hide'}>
                                            <i className="fa fa-arrow-circle-down" /> {t('certificates:down_ca_crt')}
                                        </a>
                                    </div>
                                    <div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Can>
                <hr />
            </Fragment>
        );
    }
}

class ViewDeviceComponent extends Component {
    constructor(props) {
        super(props);

        const { params } = this.props;

        this.tokenURL = `${PROXY_URL}stream/socketio`;
        this.keepConnected = true;

        // socket to receive real time data
        this.socket = socketio(BASE_URL, {
            transports: ['polling'],
            autoConnect: false,
            reconnection: false,
        });

        this.socket.on(`${params.device}`, (data) => {
            MeasureActions.appendMeasures(data);
        })
            .on('error', () => {
                // if the socket was connected, the 'close()' method
                // will fire the event 'disconnect' and manually reconnect
                this.socket.close();

            })
            .on('connect_error', () => {
                this.socketReconnection();

            })
            .on('connect_timeout', () => {
                this.socketReconnection();

            })
            .on('disconnect', () => {
                this.socketReconnection();
            });
    }

    componentWillMount() {
        DeviceActions.fetchSingle.defer(this.props.params.device);
    }

    componentDidMount() {
        this.establishSocketConnection();
    }

    componentWillUnmount() {
        this.keepConnected = false;
        this.socket.close();
    }

    establishSocketConnection() {
        const selfSocket = this.socket;
        util._runFetch(this.tokenURL)
            .then((reply) => {
                selfSocket.io.opts.query = {
                    token: reply.token
                };
                selfSocket.open();
            });
    }

    socketReconnection() {
        if (this.keepConnected) {
            this.establishSocketConnection();
        }
    }

    render() {
        const {
            params, t,
        } = this.props;

        return (
            <div className="full-width full-height">
                <AltContainer store={DeviceStore}>
                    <ViewDeviceImpl device_id={params.device} t={t} />
                </AltContainer>
            </div>
        );
    }
}

const ViewDevice = withNamespaces()(ViewDeviceComponent);
export { ViewDevice };
