import Certificates from '../comms/certificates/Certificates';
import toaster from '../comms/util/materialize';

const alt = require('../alt');

class CertificateActions {
    constructor() {
        this.error = null;

        this.privateKeyPEM = null;
        this.crtPEM = null;
        this.caCrtPEM = null;

        this.cert = new Certificates();
    }

    /**
     * trigger to clean Store
     * @returns {null}
     */
    cleanStorePrivateKey() {
        return null;
    }

    /**
     * trigger to clean Store
     * @returns {null}
     */
    cleanStoreCRL() {
        return null;
    }

    /**
     * trigger to clean Store
     * @returns {null}
     */
    cleanStoreCACRL() {
        return null;
    }

    /**
     * Works like a trigger for Store keep to updated
     * @param privateKeyPEM
     * @returns {null}
     */
    setStorePrivateKey(privateKeyPEM) {
        this.privateKeyPEM = privateKeyPEM;
        return this.privateKeyPEM;
    }

    /**
     * Works like a trigger for Store keep to updated
     * @param crtPEM
     * @returns {null}
     */
    setStoreCRT(crtPEM) {
        this.crtPEM = crtPEM;
        return this.crtPEM;
    }

    /**
     * Works like a trigger for Store keep to updated
     * @param caCrtPEM
     * @returns {null}
     */
    setStoreCACRT(caCrtPEM) {
        this.caCrtPEM = caCrtPEM;
        return this.caCrtPEM;
    }


    /**
     *
     * @param cb
     * @param errorCb
     * @returns {Function}
     */
    updateCACertificates(cb, errorCb) {
        return (dispatch) => {
            dispatch();
            this.cert.retrieveCACertificate().then((cert) => {
                if (cert) {
                    this.setStoreCACRT(cert);
                }

                if (cb) {
                    cb(cert);
                }
            }).catch((error) => {
                if (errorCb) {
                    errorCb();
                }
                this.failed(error);
            });
        };
    }

    /**
     *
     * @param deviceId
     * @param tenant
     * @param cb
     * @param errorCb
     * @returns {Function}
     */
    updateCertificates(deviceId, tenant, cb, errorCb) {
        return (dispatch) => {
            dispatch();
            this.cert.generateCertificates(`${tenant}:${deviceId}`).then((cert) => {
                const { crtPEM, privateKey } = cert;
                if (crtPEM && privateKey) {
                    this.setStoreCRT(crtPEM);
                    this.setStorePrivateKey(privateKey);
                }

                if (cb) {
                    cb(cert);
                }
            }).catch((error) => {
                if (errorCb) {
                    errorCb(`${tenant}:${deviceId}`);
                }
                this.failed(error);
            });
        };
    }

    /**
     * Just toast a error message
     * @param error
     * @returns {null}
     */
    failed(error) {
        this.error = error;
        toaster.error(this.error.message);
        return this.error;
    }
}

const certificateActions = alt.createActions(CertificateActions, exports);
export default certificateActions;
