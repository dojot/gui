import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import backend from 'i18next-xhr-backend';

i18n.use(LanguageDetector)
    .use(backend)
    .init({
        resGetPath: '__ns__-__lng__.json',
        load: 'All',
        fallbackLng: {
            pt: ['pt-br'],
            'pt-pt': ['pt-br'],
            default: ['en'],
        },
        lowerCaseLng: true,
        debug: false,
        nsSeparator: ':',
        ns: ['common', 'menu', 'groups', 'importExport', 'users', 'flows', 'templates', 'devices', 'login', 'notifications', 'firmware', 'certificates'],
        fallbackNS: 'common',
        interpolation: {
            escapeValue: false, // not needed for react
            formatSeparator: ',',
        },
        react: {
            wait: false,
            withRef: false,
            bindI18n: 'languageChanged loaded',
            bindStore: 'added removed',
            nsMode: 'default',
        },
    });

export default i18n;
