import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import backend from 'i18next-xhr-backend';
import { APP_URL } from 'Src/config';

i18n.use(LanguageDetector)
    .use(backend)
    .init({
        backend: {
            loadPath: `${APP_URL}locales/{{lng}}/{{ns}}.json`,
        },
        resGetPath: '__ns__-__lng__.json',
        load: 'All',
        nonExplicitSupportedLngs: true,
        supportedLngs: ['pt-br', 'en'],
        fallbackLng: {
            'pt-br': ['pt-br'],
            'pt-pt': ['pt-br'],
            pt: ['pt-br'],
            default: ['en'],
        },
        lowerCaseLng: true,
        debug: false,
        nsSeparator: ':',
        ns: ['common', 'menu', 'groups', 'importExport', 'users', 'flows', 'templates', 'devices', 'login', 'notifications', 'firmware', 'report', 'certificates'],
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
