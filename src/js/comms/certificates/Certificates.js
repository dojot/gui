import * as asn1js from 'asn1js';
import CertificationRequest from 'pkijs/src/CertificationRequest';
import Attribute from 'pkijs/src/Attribute';
import AttributeTypeAndValue from 'pkijs/src/AttributeTypeAndValue';
import Extension from 'pkijs/src/Extension';
import Extensions from 'pkijs/src/Extensions';
import GeneralName from 'pkijs/src/GeneralName';
import GeneralNames from 'pkijs/src/GeneralNames';
import BasicConstraints from 'pkijs/src/BasicConstraints';
import { getAlgorithmParameters, getCrypto } from 'pkijs/src/common';
import { arrayBufferToString, toBase64 } from 'pvutils';
import certManager from './CertificatesManager';


class Certificates {
    constructor() {
        this.hashAlgorithm = 'SHA-256';
        this.signAlgorithm = 'RSASSA-PKCS1-V1_5';

        this.caName = 'IOTmidCA';

        this.subjAltCSR = {
            // ex ['localhost', 'localhost2']
            dns: [],
            // ex ['192.168.1.1', '192.168.1.2', '192.168.1.3']
            ip: [],
            // ex ['email@address.com', 'email2@address.com']
            email: [],
        };

        this.typesAndValues = {
            organizationUnit: '',
            country: '',
            state: '',
            locality: '',
            organization: '',
        };


        this._privateKeyPkcs8 = null;
        this._publicKeyPkcs8 = null;

        this._csrPEM = null;
        this._privateKeyPEM = null;
        this._crtPEM = null;
        this._caCrtPEM = null;
    }

    /**
     * Create CSR (public key with some infos and sign with private key )
     * @param commonName The common name attribute type specifies an identifier Ex.: ID
     * @returns {Promise<void>}
     * @private
     */
    async _createCSR(commonName) {
        const pkcs10 = new CertificationRequest();
        pkcs10.attributes = [];
        pkcs10.version = 0;

        this._optionalTypesAndValuesCSR(pkcs10);

        if (commonName) {
            pkcs10.subject.typesAndValues.push(new AttributeTypeAndValue({
                type: '2.5.4.3',
                value: new asn1js.Utf8String({
                    value: commonName,
                }),
            }));
        }

        this._setExtensionsCSR(pkcs10);

        await pkcs10.subjectPublicKeyInfo.importKey(this._publicKeyPkcs8);
        await pkcs10.sign(this._privateKeyPkcs8, this.hashAlgorithm);
        const _csrRaw = pkcs10.toSchema().toBER(false);
        this._setCsrPEM(_csrRaw);
    }

    /**
     * Generate key par (private and public key)
     * and set in properties of class
     * @returns {Promise<void>}
     * @private
     */
    async _generateKeyPar() {
        const crypto = getCrypto();
        if (!crypto) {
            throw new Error('No crypto');
        }

        const algorithm = getAlgorithmParameters(this.signAlgorithm, 'generatekey');
        if ('hash' in algorithm.algorithm) {
            algorithm.algorithm.hash.name = this.hashAlgorithm;
        }

        const keyPair = await crypto.generateKey(algorithm.algorithm, true, algorithm.usages);
        const { publicKey, privateKey } = keyPair;
        this._publicKeyPkcs8 = publicKey;
        this._privateKeyPkcs8 = privateKey;

        this._setPrivateKeyPEM(
            await Certificates._extractPrivateKeyStringKeyPar(crypto, privateKey),
        );
    }

    /**
     *
     * Aux method to extract string from private key
     *
     * @param crypto
     * @param privateKey
     * @returns {Promise<string>}
     * @private
     */
    static async _extractPrivateKeyStringKeyPar(crypto, privateKey) {
        const exportPrivateKey = await crypto.exportKey('pkcs8', privateKey);
        return String.fromCharCode.apply(
            null,
            new Uint8Array(exportPrivateKey),
        );
    }

    /**
     * Set extensions for CSR
     * Aux method to _createCSR
     * @param pkcs10
     * @private
     */
    _setExtensionsCSR(pkcs10) {
        const bitArray = new ArrayBuffer(1);
        const bitView = new Uint8Array(bitArray);
        // eslint-disable-next-line no-bitwise
        bitView[0] |= 0x0020; // Key usage "KeyEncipherment" flag
        // eslint-disable-next-line no-bitwise
        bitView[0] |= 0x0040; // Key usage "NonRepudiation" flag
        // eslint-disable-next-line no-bitwise
        bitView[0] |= 0x0080; // Key usage "DigitalSignature" flag

        // region "BasicConstraints" extension
        const basicConstr = new BasicConstraints({
            cA: false,
        });

        const extensions = [
            new Extension({
                extnID: '2.5.29.15', // KeyUsage
                critical: false,
                extnValue:
                    (new asn1js.BitString({ valueHex: bitArray })).toBER(false),
            }),
            new Extension({
                extnID: '2.5.29.19', // BasicConstraints
                critical: false,
                extnValue: basicConstr.toSchema().toBER(false),
                // Parsed value for well-known extensions
                parsedValue: basicConstr,
            }),
        ];

        // Subject alternative name
        const altNames = this._subjectAltNameCSR();
        if (altNames) {
            extensions.push(new Extension({
                extnID: '2.5.29.17', // subjectAltName
                critical: false,
                extnValue: altNames.toSchema().toBER(false),
                parsedValue: altNames,
            }));
        }

        // set all extensions
        pkcs10.attributes.push(new Attribute({
            type: '1.2.840.113549.1.9.14', // pkcs-9-at-extensionRequest
            values: [(new Extensions({
                extensions,
            })).toSchema()],
        }));
    }

    /**
     * Create part of extensions
     * bases on emails, dns and ips v4
     * Aux method for _createCSR
     * @returns {GeneralNames|null}
     * @private
     */
    _subjectAltNameCSR() {
        if (!((this.subjAltCSR.email && this.subjAltCSR.email.length > 0)
            || (this.subjAltCSR.dns && this.subjAltCSR.dns.length > 0)
            || (this.subjAltCSR.ip && this.subjAltCSR.ip.length > 0))) {
            return null;
        }

        const emailAlt = this.subjAltCSR.email.map((email) => new GeneralName({
            type: 1, // rfc822Name
            value: email,
        }));

        const dnsAlt = this.subjAltCSR.dns.map((dns) => new GeneralName({
            type: 2, // dNSName
            value: dns,
        }));

        const ipsAlt = this.subjAltCSR.ip.map((ip) => new GeneralName({
            type: 7, // iPAddress
            value: new asn1js.OctetString({ valueHex: (new Uint8Array(ip.split('.'))).buffer }),
        }));


        return new GeneralNames({ names: [...emailAlt, ...dnsAlt, ...ipsAlt] });
    }

    /**
     * Set addictions incarnations in CSR
     * Like country, state...
     * Aux method for _createCSR
     * @param pkcs10
     * @private
     */
    _optionalTypesAndValuesCSR(pkcs10) {
        if (this.typesAndValues.country) {
            pkcs10.subject.typesAndValues.push(new AttributeTypeAndValue({
                type: '2.5.4.6',
                value: new asn1js.PrintableString({
                    value: this.typesAndValues.country,
                }),
            }));
        }

        if (this.typesAndValues.state) {
            pkcs10.subject.typesAndValues.push(new AttributeTypeAndValue({
                type: '2.5.4.8',
                value: new asn1js.Utf8String({
                    value: this.typesAndValues.state,
                }),
            }));
        }

        if (this.typesAndValues.locality) {
            pkcs10.subject.typesAndValues.push(new AttributeTypeAndValue({
                type: '2.5.4.7',
                value: new asn1js.Utf8String({
                    value: this.typesAndValues.locality,
                }),
            }));
        }

        if (this.typesAndValues.organization) {
            pkcs10.subject.typesAndValues.push(new AttributeTypeAndValue({
                type: '2.5.4.11',
                value: new asn1js.Utf8String({
                    value: this.typesAndValues.organization,
                }),
            }));
        }

        if (this.typesAndValues.organizationUnit) {
            pkcs10.subject.typesAndValues.push(new AttributeTypeAndValue({
                type: '2.5.4.10',
                value: new asn1js.Utf8String({
                    value: this.typesAndValues.organizationUnit,
                }),
            }));
        }
    }

    /**
     * Get from PKI the CA certificate and return in PEM format
     *
     * @returns {Promise<string>}
     */
    async retrieveCACertificate() {
        const caPem = await certManager.getCAChain();
        this._setCACrtPEM(caPem);
        return this._caCrtPEM;
    }

    /**
     * Generate private key and sign certificate crt for  a commonName
     * and return both
     * @param commonName The common name attribute type specifies an identifier Ex.: ID
     * @returns {Promise<{privateKey: string, crtPEM: string}>}
     */
    async generateCertificates(commonName) {
        await this._generateKeyPar().catch((error) => {
            throw error;
        });

        await this._createCSR(commonName).catch((error) => {
            throw error;
        });

        const certificatePem = await certManager
            .signCert(commonName, this._csrPEM)
            .catch((error) => {
                throw error;
            });

        this._setCrtPEM(certificatePem);

        return {
            privateKey: this._privateKeyPEM,
            crtPEM: this._crtPEM,
        };
    }

    /**
     * Set private key pem in properties of class
     * @param privateKeyString
     * @private
     */
    _setPrivateKeyPEM(privateKeyString) {
        this._privateKeyPEM = '-----BEGIN PRIVATE KEY-----\r\n';
        this._privateKeyPEM += Certificates._formatPEM(toBase64((privateKeyString)));
        this._privateKeyPEM += '\r\n-----END PRIVATE KEY-----';
    }

    /**
     * Set csr pem in properties of class
     * @param csrRaw
     * @private
     */
    _setCsrPEM(csrRaw) {
        this._csrPEM = '-----BEGIN CERTIFICATE REQUEST-----\r\n';
        this._csrPEM += Certificates._formatPEM(toBase64(arrayBufferToString(csrRaw)));
        this._csrPEM += '\r\n-----END CERTIFICATE REQUEST-----';
    }

    /**
     * Set crt pem in properties of class
     * @param certificatePem
     * @private
     */
    _setCrtPEM(certificatePem) {
        this._crtPEM = certificatePem;
    }

    /**
     *Set ca crt pem in properties of class
     * @param caPem
     * @private
     */
    _setCACrtPEM(caPem) {
        this._caCrtPEM = caPem;
    }

    /**
     * Format PEM
     * @param pemString
     * @returns {string}
     * @private
     */
    static _formatPEM(pemString) {
        let resultString = '';
        if (pemString) {
            for (let i = 0, count = 0; i < pemString.length; i += 1, count += 1) {
                if (count > 63) {
                    resultString = `${resultString}\r\n`;
                    count = 0;
                }
                resultString = `${resultString}${pemString[i]}`;
            }
        }
        return resultString;
    }
}


export default Certificates;
