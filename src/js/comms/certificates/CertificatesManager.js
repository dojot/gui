import util from '../util';

class CertificatesManager {
    constructor() {
        this.baseUrl = '';
    }

    getCAChain(caName) {
        return util.GET(`${this.baseUrl}/ca/${caName}`);
    }


    signCert(commonName, csrPEM) {
        const req = {
            certificate: csrPEM,
            passwd: 'dojot',
        };
        return util.POST(`${this.baseUrl}/sign/${commonName}/pkcs10`, req);
    }
}

const certificatesManager = new CertificatesManager();
export default certificatesManager;
