import util from '../util';

class CertificatesManager {
    constructor() {
        this.baseUrl = '/x509/v1';
    }

    async getCAChain() {
        const { caPem } = await util.GET(`${this.baseUrl}/ca`);
        return caPem;
    }


    async signCert(commonName, csrPEM) {
        const { certificatePem } = await util.POST(`${this.baseUrl}/certificates`, { csr: csrPEM });
        return certificatePem;
    }
}

const certificatesManager = new CertificatesManager();
export default certificatesManager;
