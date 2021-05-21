import React from 'react';
import { render } from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import i18n from './utils/i18n';

render(
    <I18nextProvider i18n={i18n}>
        <App />
    </I18nextProvider>,
    document.getElementById('app'),
);
