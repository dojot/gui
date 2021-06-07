import { baseURL } from 'Src/config';
import util from '../util';

class CertificatesManager {
    async getCAChain() {
        const { caPem } = await util.GET(`${baseURL}x509/v1/ca`);
        return caPem;
    }

    async signCert(csrPEM) {
        return await util.POST(`${baseURL}x509/v1/certificates`, { csr: csrPEM });
    }

    async associateCert(fingerPrint, deviceId) {
     await util.PATCH(`${baseURL}x509/v1/certificates/${fingerPrint}`,
            {
            "belongsTo": {
              "device": deviceId
            }
        });
    }

}

const certificatesManager = new CertificatesManager();
export default certificatesManager;
