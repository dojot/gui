/* eslint-disable */
import React, {Component, Fragment} from 'react';
import PropTypes from 'prop-types';
import AltContainer from 'alt-container';
import {withNamespaces} from 'react-i18next';
import * as i18next from 'i18next';
import {Loading} from 'Components/Loading';
import {Attr, HandleGeoElements} from 'Components/HistoryElements';
import {DojotBtnRedCircle} from 'Components/DojotButton';
import MeasureActions from 'Actions/MeasureActions';
import DeviceActions from 'Actions/DeviceActions';
import CertificateActions from 'Actions/CertificateActions';
import MeasureStore from 'Stores/MeasureStore';
import DeviceStore from 'Stores/DeviceStore';
import ConfigStore from 'Stores/ConfigStore';
import LoginStore from 'Stores/LoginStore';
import CertificateStore from 'Stores/CertificateStore';
import Metadata from './Details/Metadata';
import {NewPageHeader} from 'Containers/full/PageHeader';
import util from 'Comms/util/util';
import Can from "Components/permissions/Can";

const DeviceHeader = ({device, t}) => (
    <div className="row devicesSubHeader p0 device-details-header">
        <div className="col s8 m8">
            <span className="col s12 device-label truncate" title={device.label}>
                {device.label}
            </span>
            <div className="col s12 device-label-name">{t('text.name')}</div>
        </div>
    </div>
);

DeviceHeader.propTypes = {
    device: PropTypes.shape({}).isRequired,
    t: PropTypes.func.isRequired,
};


class Attribute extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false,
        };
        this.toggleExpand = this.toggleExpand.bind(this);
    }

    toggleExpand(state) {
        this.setState({opened: state});
    }

    render() {
        // check the current window, if less then 1024px, blocks compressed state
        const {opened} = this.state;
        const {device, attr} = this.props;
        const {label, value_type: valueType, metadata} = attr;
        const isOpened = util.checkWidthToStateOpen(opened);
        return (
            <div className={`attributeBox ${isOpened ? 'expanded' : 'compressed'}`}>
                <div className="header">
                    <span>{label}</span>
                    {!isOpened
                        ? (
                            <i
                                role="button"
                                tabIndex="-1"
                                onKeyUp={this.toggleExpand.bind(this, true)}
                                onClick={this.toggleExpand.bind(this, true)}
                                className="fa fa-expand"
                            />
                        )
                        : (
                            <i
                                role="button"
                                tabIndex="-1"
                                onKeyUp={this.toggleExpand.bind(this, false)}
                                onClick={this.toggleExpand.bind(this, false)}
                                className="fa fa-compress"
                            />
                        )}
                </div>
                <div className="details-card-content">
                    <AttrHistory
                        device={device}
                        type={valueType}
                        attr={label}
                        metadata={metadata}
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

const Configurations = ({t, attrs, device}) => (
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


const StaticAttributes = ({
                              t, openStaticMap, attrs, device,
                          }) => (
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


class GenericList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openStaticMap: true,
            visible_static_map: false,
            truncate: false,
        };

        this.openMap = this.openMap.bind(this);
        this.verifyIsGeo = this.verifyIsGeo.bind(this);
        this.limitSizeField = this.limitSizeField.bind(this);
    }

    componentWillMount() {
        this.limitSizeField(this.props.attrs);
    }

    openMap() {
        const device = this.props.device;
        for (const k in device.attrs) {
            for (const j in device.attrs[k]) {
                if (device.attrs[k][j].value_type === 'geo:point') {
                    if (device.attrs[k][j].static_value !== '') {
                        this.setState({
                            openStaticMap: !this.state.openStaticMap,
                            visible_static_map: !this.state.visible_static_map,
                        });
                        this.props.openStaticMap(this.state.openStaticMap);
                    }
                }
            }
        }
    }

    verifyIsGeo(attrs) {
        for (const k in attrs) {
            attrs[k].isGeo = attrs[k].value_type === 'geo:point' || attrs[k].value_type === 'geo';
        }
    }

    limitSizeField(attrs) {
        attrs.map((attr) => {
            if (attr.static_value !== undefined) {
                if (attr.type === 'meta') {
                    // values of configurations
                    if (attr.static_value.length > 20) {
                        this.setState({truncate: true});
                    }
                } else {
                    if (attr.label.length > 20 || attr.value_type > 20) {
                        this.setState({truncate: true});
                    }
                    // Values of static attributes
                    if (attr.static_value.length > 20) {
                        this.setState({truncate: true});
                    }
                }
            }
        });
    }

    render() {
        const {
            t, attrs, img, boxTitle, device,
        } = this.props;
        this.verifyIsGeo(attrs);
        return (
            <div className="row stt-attributes">
                <div className="col s12 header">
                    <div className="icon">
                        <img src={img} alt={boxTitle}/>
                    </div>
                    <label>{boxTitle}</label>
                </div>
                <div className="col s12 body">
                    {boxTitle === t('text.properties') ? (
                        <Fragment>
                            <div className="line">
                                <div className="display-flex-column flex-1">
                                    <div
                                        className={'name-value '}
                                        title={t('devices:device_id')}
                                    >
                                        {t('devices:device_id')}
                                    </div>
                                    <div className="display-flex-no-wrap space-between">
                                        <div
                                            className='value-value '
                                            title={device.id}
                                        >
                                            {device.id}
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <hr/>
                            <AltContainer stores={{
                                certStore: CertificateStore,
                                loginStore: LoginStore,
                            }}
                            >
                                <CertificateComponent deviceId={device.id} t={t}/>

                            </AltContainer>

                        </Fragment>
                    ) : ('')}
                    {attrs.map(attr => (
                        attr.isGeo ? (
                            <Fragment>
                                <div
                                    role="button"
                                    tabIndex="0"
                                    key={attr.label}
                                    className="line col s12"
                                    id="static-geo-attribute"
                                    onKeyUp={this.openMap}
                                    onClick={this.openMap}
                                >
                                    <div className="display-flex-column flex-1">
                                        <div
                                            className={this.state.truncate
                                                ? 'name-value display-flex flex-1 space-between truncate'
                                                : 'name-value display-flex flex-1 space-between'}
                                            title={i18next.exists(`options.config_type.values.${attr.label}`) ? t(`options.config_type.values.${attr.label}`) : `${attr.label}`}
                                        >
                                            {i18next.exists(`options.config_type.values.${attr.label}`) ? t(`options.config_type.values.${attr.label}`) : `${attr.label}`}
                                            <div className="star">
                                                <i className={`fa ${this.state.visible_static_map ? 'fa-star' : 'fa-star-o'}`}/>
                                            </div>
                                        </div>


                                        <div className="display-flex-no-wrap space-between">
                                            <div
                                                className={this.state.truncate ? 'value-value truncate' : 'value-value'}
                                                title={attr.static_value}
                                            >
                                                {attr.static_value.length > 25
                                                    ? `${attr.static_value.substr(0, 21)}...`
                                                    : attr.static_value
                                                }
                                            </div>
                                            <div
                                                className="value-label"
                                                title={attr.value_type}
                                            >
                                                {i18next.exists(`types.${attr.value_type}`) ? t(`types.${attr.value_type}`) : attr.value_type}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {Object.prototype.hasOwnProperty.call(attr, "metadata") ?
                                    <div className="line line-meta-btn"><Metadata attr={attr}/></div> : null}
                                <hr/>
                            </Fragment>
                        ) : (
                            <Fragment>
                                <div key={attr.label} className="line">
                                    <div className="display-flex-column flex-1">
                                        <div
                                            className={this.state.truncate ? 'name-value  truncate' : 'name-value '}
                                            title={i18next.exists(`options.config_type.values.${attr.label}`) ? t(`options.config_type.values.${attr.label}`) : `${attr.label}`}
                                        >
                                            {`${attr.label}`}

                                        </div>
                                        <div className="display-flex-no-wrap space-between">
                                            <div
                                                className={this.state.truncate ? 'value-value  truncate' : 'value-value '}
                                                title={attr.static_value}
                                            >
                                                {(attr.static_value !== undefined && attr.static_value.length > 25)
                                                    ? `${attr.static_value.substr(0, 21)}...`
                                                    : attr.static_value
                                                }
                                            </div>
                                            <div
                                                className="value-label"
                                                title={attr.value_type}
                                            >
                                                {i18next.exists(`types.${attr.value_type}`) ? t(`types.${attr.value_type}`) : attr.value_type}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                {Object.prototype.hasOwnProperty.call(attr, "metadata") ?
                                    <div className="line line-meta-btn"><Metadata attr={attr}/></div> : null}
                                <hr/>
                            </Fragment>
                        )
                    ))}
                </div>
            </div>
        );
    }
}


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
        let {selectedAttributes: sa} = this.state;
        const {isAttrsVisible} = this.state;
        if (isAttrsVisible[attr.id]) {
            sa = sa.filter(i => i.id !== attr.id);
            delete isAttrsVisible[attr.id];
        } else {
            sa.push(attr);
            isAttrsVisible[attr.id] = true;
        }

        // update attributes
        this.setState({
            selectedAttributes: sa,
            isAttrsVisible,
        });
    }

    render() {
        const {isAttrsVisible, selectedAttributes} = this.state;
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

        return (
            <div className="content-row float-right">
                <div className="second-col">
                    {selectedAttributes.length === 0 && openStaticMap === false
                        ? (
                            <NoActiveAttr/>
                        )
                        : null
                    }
                    {openStaticMap ? (
                        <HandleGeoElements
                            device={device}
                            isStatic
                        />
                    ) : null}
                    {selectedAttributes.map(at => (
                        <Attribute key={at.id} device={device} attr={at}/>
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
        const {device} = this.props;
        const {attrs} = device;

        for (const i in attrs) {
            for (const j in attrs[i]) {
                if (attrs[i][j].type === 'actuator') {
                    MeasureActions.fetchMeasure.defer(device, attrs[i][j].label, 10);
                }
            }
        }
    }

    clickAttr(attr) {
        const {toggleAttribute} = this.props;
        toggleAttribute(attr);
    }

    render() {
        const {t, actuators} = this.props;
        return (
            <div className="stt-attributes dy_attributes">
                <div className="col s12 header">
                    <div className="icon">
                        <img src="images/gear-dark.png"/>
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
                                        <i className={`fa ${actuator.visible ? 'fa-star' : 'fa-star-o'}`}/>
                                    </div>
                                </div>

                            </div>
                            {Object.prototype.hasOwnProperty.call(actuator, "metadata") ?
                                <Metadata attr={actuator}/> : null}
                            <hr/>
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
        this.state = {truncate: false};
        this.clickAttr = this.clickAttr.bind(this);
        this.limitSizeField = this.limitSizeField.bind(this);
    }

    componentWillMount() {
        const {device, attrs: propsAttrs} = this.props;
        const {attrs} = device;
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
        const {toggleAttribute} = this.props;
        toggleAttribute(attr);
    }

    limitSizeField(dyAttrs) {
        dyAttrs.map((dyAttr) => {
            if (dyAttr.label.length > 20) {
                this.setState({truncate: true});
            }
        });
    }

    render() {
        const {truncate} = this.state;
        const {t, attrs} = this.props;
        return (
            <div className="stt-attributes dy_attributes">
                <div className="col s12 header">
                    <div className="icon">
                        <img src="images/tag.png"/>
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
                                        <i className={`fa ${attr.visible ? 'fa-star' : 'fa-star-o'}`}/>
                                    </div>
                                </div>

                            </div>
                            {Object.prototype.hasOwnProperty.call(attr, "metadata") ? <Metadata attr={attr}/> : null}
                            <hr/>
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


const DeviceUserActions = ({t}) => (
    <div>
        <DojotBtnRedCircle
            to="/device/list"
            icon="fa fa-arrow-left"
            tooltip={t('devices:return_list')}
        />
    </div>
);


const AttrHistory = ({device, type, attr, metadata}) => (
    <div className="graphLarge">
        <AltContainer stores={{
            MeasureStore,
            Config: ConfigStore,
        }}
        >
            <Attr
                device={device}
                type={type}
                attr={attr}
                label={attr}
                metadata={metadata}
                isStatic={false}
            />
        </AltContainer>
    </div>
);

AttrHistory.propTypes = {
    device: PropTypes.shape({}).isRequired,
    type: PropTypes.string.isRequired,
    attr: PropTypes.string.isRequired,
};

class DeviceDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {openStaticMap: false};

        this.openStaticMap = this.openStaticMap.bind(this);
    }

    openStaticMap(state) {
        this.setState({openStaticMap: state});
    }

    render() {
        const {openStaticMap} = this.state;
        const {device, t} = this.props;
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
                    openStaticMap={openStaticMap}
                    t={t}
                />
            </div>
        );
    }
}


class ViewDeviceImpl extends Component {
    componentWillMount() {
        const {devices, device_id} = this.props;
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
        const {t, devices} = this.props;

        if (devices !== undefined) {
            if (devices.hasOwnProperty(this.props.device_id)) {
                device = devices[this.props.device_id];
            }
        }

        if (device === undefined) {
            return (<Loading/>);
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
                <DeviceHeader device={device} t={t}/>
                <DeviceDetail deviceid={device.id} device={device} t={t}/>
            </div>
        );
    }
}

// TODO: this is an awful quick hack - this should be better scoped.
let device_detail_socket = null;

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
                <Can do="modifier" on="ca-sign">
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
                                            <i className="fa fa-lock"/>
                                        </button>

                                    </div>
                                    <div>
                                        <a href={'data:application/pkcs8,' + encodeURIComponent(privateKey)}
                                           download={nameFile + '.key'}
                                           className={privateKey ? '' : 'hide'}
                                           title={t('certificates:down_private_key')}>
                                            <i className="fa fa-arrow-circle-down"/> {t('certificates:down_private_key')}
                                        </a>
                                    </div>
                                    <div>
                                        <a href={'data:application/pkcs8,' + encodeURIComponent(crt)}
                                           title={t('certificates:down_crt')}
                                           download={nameFile + '.crt'}
                                           className={crt ? '' : 'hide'}>
                                            <i className="fa fa-arrow-circle-down"/> {t('certificates:down_crt')}
                                        </a>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </Can>
                <hr/>
                <Can do="viewer" on="ca">
                    <div className="line">
                        <div className="display-flex-column flex-1">
                            <div
                                className={'name-value '}
                                title={t('certificates:title_ca')}
                            >
                                {t('certificates:title_ca')} <sub> {t('certificates:down_ca_crt_alt')}</sub>

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
                                            <i className="fa fa-lock"/>
                                        </button>

                                    </div>
                                    <div>
                                        <a href={'data:application/pkcs8,' + encodeURIComponent(caCrt)}
                                           download='ca.crt'
                                           className={caCrt ? '' : 'hide'}>
                                            <i className="fa fa-arrow-circle-down"/> {t('certificates:down_ca_crt')}
                                        </a>
                                    </div>
                                    <div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Can>
                <hr/>
            </Fragment>
        );
    }
}

class ViewDeviceComponent extends Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        DeviceActions.fetchSingle.defer(this.props.params.device);
    }

    componentDidMount() {
        // Realtime
        const socketio = require('socket.io-client');

        const target = `${window.location.protocol}//${window.location.host}`;
        const token_url = `${target}/stream/socketio`;

        function getWsToken() {
            util._runFetch(token_url)
                .then((reply) => {
                    init(reply.token);
                })
                .catch((error) => {
                    // console.log('Failed!', error);
                });
        }

        function init(token) {
            device_detail_socket = socketio(target, {
                query: `token=${token}`,
                transports: ['polling'],
            });

            device_detail_socket.on('all', (data) => {
                MeasureActions.appendMeasures(data);
            });

            // console.log('socket error', data);
            device_detail_socket.on('error', (data) => {
                if (device_detail_socket) device_detail_socket.close();
                // getWsToken();
            });
        }

        getWsToken();
    }

    componentWillUnmount() {
        if (device_detail_socket) device_detail_socket.close();
    }

    render() {
        const {
            params, t,
        } = this.props;

        return (
            <div className="full-width full-height">
                <AltContainer store={DeviceStore}>
                    <ViewDeviceImpl device_id={params.device} t={t}/>
                </AltContainer>
            </div>
        );
    }
}

const ViewDevice = withNamespaces()(ViewDeviceComponent);
export {ViewDevice};
