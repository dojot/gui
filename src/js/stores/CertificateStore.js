const alt = require('../alt');
const CertActions = require('../actions/CertificateActions');


class CertificateStore {
    constructor() {
        this.privateKey = null;
        this.crt = null;
        this.caCrt = null;

        this.error = null;

        this.bindListeners({
            handleUpdatePrivateKey: CertActions.setStorePrivateKey,
            handleUpdateCRT: CertActions.setStoreCRT,
            handleUpdateCACRT: CertActions.setStoreCACRT,
            handleFailure: CertActions.failed,

            handleCleanStorePrivateKey: CertActions.cleanStorePrivateKey,
            handleCleanStoreCRL: CertActions.cleanStoreCRL,
            handleCleanStoreCACRL: CertActions.cleanStoreCACRL,

        });
    }

    handleCleanStorePrivateKey() {
        this.privateKey = null;
    }

    handleCleanStoreCRL() {
        this.crt = null;
    }

    handleCleanStoreCACRL() {
        this.caCrt = null;
    }

    handleUpdatePrivateKey(privateKey) {
        this.privateKey = privateKey;
        this.error = null;
    }

    handleUpdateCRT(crt) {
        this.crt = crt;
        this.error = null;
    }


    handleUpdateCACRT(caCrt) {
        this.caCrt = caCrt;
        this.error = null;
    }

    handleFailure(error) {
        this.error = error;
    }
}

export default alt.createStore(CertificateStore, 'CertificateStore');
