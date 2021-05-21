/* eslint-disable */
import PropTypes from "prop-types";
import React, { Component, useEffect, Fragment } from 'react';
import AltContainer from 'alt-container';
import * as i18next from 'i18next';
import LoginStore from 'Stores/LoginStore';
import CertificateStore from 'Stores/CertificateStore';
import CertificateActions from 'Actions/CertificateActions';
import Can from 'Components/permissions/Can';
import Metadata from './Details/Metadata';


const CertificateComponent = (props) => {
    const {
        t,
        deviceId,
        certStore:
        {
            privateKey,
            crt,
            caCrt,
        },
        loginStore: {
            user: {
                tenant,
            },
        },
    } = props;


    useEffect(() => {
        CertificateActions.cleanStorePrivateKey.defer();
        CertificateActions.cleanStoreCRL.defer();
        CertificateActions.cleanStoreCACRL.defer();
    }, []);

    const handleClickNewCerts = () => {
        CertificateActions.updateCertificates.defer(deviceId, tenant);
    }

    const handleClickCACert = () => {
        CertificateActions.updateCACertificates.defer();
    }


    const nameFile = `${tenant}:${deviceId}`;

    return (
        <Fragment>
            <Can do="modifier" on="x509-identity-mgmt">
                <div className="line">
                    <div className="display-flex-column flex-1">
                        <div
                            className="name-value "
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
                                        onClick={handleClickNewCerts}
                                        disabled={!!privateKey && !!crt}>
                                        {t('certificates:btn_generate')}
                                            &nbsp; &nbsp;
                                        <i className="fa fa-lock" />
                                    </button>

                                </div>
                                <div>
                                    <a href={`data:application/pkcs8,${encodeURIComponent(privateKey)}`}
                                        download={`${nameFile}.key`}
                                        className={privateKey ? '' : 'hide'}
                                        title={t('certificates:down_private_key')}>
                                        <i className="fa fa-arrow-circle-down" /> {t('certificates:down_private_key')}
                                    </a>
                                </div>
                                <div>
                                    <a href={`data:application/pkcs8,${encodeURIComponent(crt)}`}
                                        title={t('certificates:down_crt')}
                                        download={`${nameFile}.crt`}
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
                            className="name-value "
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
                                        onClick={handleClickCACert}
                                        disabled={!!caCrt}>
                                        {t('certificates:btn_load')}
                                            &nbsp; &nbsp;
                                        <i className="fa fa-lock" />
                                    </button>

                                </div>
                                <div>
                                    <a href={`data:application/pkcs8,${encodeURIComponent(caCrt)}`}
                                        download='ca.crt'
                                        className={caCrt ? '' : 'hide'}>
                                        <i className="fa fa-arrow-circle-down" /> {t('certificates:down_ca_crt')}
                                    </a>
                                </div>
                                <div />
                            </div>
                        </div>
                    </div>
                </div>
            </Can>
            <hr />
        </Fragment>
    );
}
CertificateComponent.defaultProps = {
    loginStore: { user: {} },
    certStore: {}
}
CertificateComponent.propTypes = {
    deviceId: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
    certStore: PropTypes.shape({
        privateKey: PropTypes.shape({}),
        crt: PropTypes.shape({}),
        caCrt: PropTypes.shape({}),
    }),
    loginStore: PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            name: PropTypes.string,
            email: PropTypes.string,
            tenant: PropTypes.string,
        }).isRequired,
    }),
}


class GenericList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            truncate: false,
            visibleMaps: [],
        };

        this.openMap = this.openMap.bind(this);
        this.verifyIsGeo = this.verifyIsGeo.bind(this);
        this.limitSizeField = this.limitSizeField.bind(this);
    }

    componentWillMount() {
        this.limitSizeField(this.props.attrs);
    }

    openMap(attr) {
        let { visibleMaps } = this.state;
        // if exists, we should remove it
        if (visibleMaps.filter(i => i === attr.id).length) {
            visibleMaps = visibleMaps.filter(i => i !== attr.id);
        } else {
            visibleMaps.push(attr.id);
        }

        const { device } = this.props;
        for (const k in device.attrs) {
            for (const j in device.attrs[k]) {
                if (device.attrs[k][j].value_type === 'geo:point') {
                    if (device.attrs[k][j].static_value !== '') {

                        this.setState({
                            visibleMaps,
                        });
                        this.props.openStaticMap(visibleMaps);
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
                        this.setState({ truncate: true });
                    }
                } else {
                    if (attr.label.length > 20 || attr.value_type > 20) {
                        this.setState({ truncate: true });
                    }
                    // Values of static attributes
                    if (attr.static_value.length > 20) {
                        this.setState({ truncate: true });
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
                        <img src={img} alt={boxTitle} />
                    </div>
                    <label>{boxTitle}</label>
                </div>
                <div className="col s12 body">
                    {boxTitle === t('text.properties') ? (
                        <Fragment>
                            <div className="line">
                                <div className="display-flex-column flex-1">
                                    <div
                                        className="name-value "
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
                            <hr />
                            <AltContainer stores={{
                                certStore: CertificateStore,
                                loginStore: LoginStore,
                            }}
                            >
                                <CertificateComponent
                                    deviceId={device.id}
                                    t={t} />

                            </AltContainer>

                        </Fragment>
                    ) : ('')}
                    {attrs.map(attr => (
                        attr.isGeo ? (
                            <Fragment key={attr.label}>
                                <div
                                    role="button"
                                    tabIndex="0"
                                    key={attr.label}
                                    className="line col s12"
                                    id="static-geo-attribute"
                                    onKeyUp={() => this.openMap(attr)}
                                    onClick={() => this.openMap(attr)}
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
                                                <i className={`fa ${this.state.visibleMaps.filter(i => i === attr.id).length ? 'fa-star' : 'fa-star-o'}`} />
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
                                {Object.prototype.hasOwnProperty.call(attr, 'metadata') ?
                                    <div className="line line-meta-btn"><Metadata attr={attr} />
                                    </div> : null}
                                <hr />
                            </Fragment>
                        ) : (
                            <Fragment key={attr.label}>
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
                                {Object.prototype.hasOwnProperty.call(attr, 'metadata') ?
                                    <div className="line line-meta-btn"><Metadata attr={attr} />
                                    </div> : null}
                                <hr />
                            </Fragment>
                        )
                    ))}
                </div>
            </div>
        );
    }
}


export default GenericList;