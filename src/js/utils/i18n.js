import i18n from 'i18next';
import backend from 'i18next-xhr-backend';

const browserLng = navigator.language || navigator.userLanguage;
const dictLng = {
    'pt-br': 'pt-br',
    'pt-pt': 'pt-br',
    pt: 'pt-br',
    'en-us': 'en',
    'en': 'en',
};
const castLng = dictLng[browserLng.toLowerCase()] || 'en';

i18n.use(backend).init({
    backend: {
        loadPath: `/locales/{{lng}}/{{ns}}.json`,
    },
    resGetPath: '__ns__-__lng__.json',
    load: 'All',
    nonExplicitSupportedLngs: true,
    supportedLngs: ['pt-br', 'en'],
    fallbackLng: 'en',
    lowerCaseLng: true,
    debug: false,
    nsSeparator: ':',
    ns: ['common', 'menu', 'importExport', 'flows', 'templates', 'devices', 'login', 'notifications', 'firmware', 'report', 'certificates'],
    fallbackNS: 'common',
    lng: castLng,
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
