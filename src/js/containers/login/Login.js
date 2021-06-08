import React, {
    useEffect, useState,
} from 'react';
import PropTypes from 'prop-types';
import AltContainer from 'alt-container';
import { withNamespaces } from 'react-i18next';
import LoginActions from 'Actions/LoginActions';
import LoginStore from 'Stores/LoginStore';
import TextField from '@material-ui/core/TextField';
import { LOGIN_URL } from 'Src/config';

import toaster from 'Comms/util/materialize';

const LoginContent = (props) => {
    const [tenant, setTenant] = useState('');
    const { t, authenticated } = props;

    // this value will be returned upon return from the login,
    // it can be useful to identify something,
    // with what page the user was on for example.
    const state = 'login-gui';

    useEffect(() => {
        // Since the react route failed to capture the query string, I used
        // javascript's location method.
        const { location: { href } } = window;
        const url = new URL(href);
        const stateQueryString = url.searchParams.get('state');
        // getting the parameter state e error (if it exists) in the query string
        const errorQueryString = url.searchParams.get('error');
        if (errorQueryString) {
            // shows toast with the error message;
            toaster.error(errorQueryString);
        }
        // only if isn't authenticated in login store yet
        if (!authenticated && stateQueryString === 'login-state') {
            LoginActions.getUserData();
        }
    }, []);


    const titleLogin = `[  ${t('login:title')}  ]`;

    // const returnPath = '/#return';
    const returnPath = '/';

    const redirectLogin = (e) => {
        e.preventDefault();
        if (tenant.length)
            window.location.href = `${LOGIN_URL}?tenant=${tenant}&state=${state}&return=${returnPath}`;
    };


    return (
        <div className="row m0">
            <div className="login col s12 p0 bg-left">
                <div className="col  s4 p0 left-side" />
                <div className="col s8 login-area-right-side bg-right">
                    <div className="col s7">
                        <form autoComplete="on">
                            <div className="row">
                                <div className="col s12  offset-m1">
                                    <div className="login-page-title">
                                        {titleLogin}
                                    </div>
                                </div>
                            </div>
                            <div className="row mb0">
                                <div className="col s12  offset-m2">
                                    <div className="login-page-subtitle">
                                        {t('login:sign_in_desc')}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s8 m6 offset-m2">
                                    <input
                                        type="text"
                                        value={tenant}
                                        maxLength="25"
                                        onChange={(e) => { setTenant(e.target.value); }}
                                        name="tenant"
                                    />
                                </div>
                                <div className="col s8 m6 offset-m2">
                                    <br />
                                    <button
                                        type="submit"
                                        tabIndex="0"
                                        disabled={!tenant.length}
                                        onKeyPress={e => redirectLogin(e)}
                                        onClick={e => redirectLogin(e)}
                                        className="clear-btn new-btn-flat red sp-btn-login"
                                    >
                                        {t('login:go_to_login')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="col s5 right-side">
                        <div className="dojot-logo">
                            <img alt="dojot logo" src="images/dojot_white.png" />
                        </div>
                        <div className="slogan">
                            <b>Do IoT</b>
                            <br />
                            Easy to use
                            <br />
                            Fast to develop
                            <br />
                            {' '}
                            Safe to deploy
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

LoginContent.defaultProps = {
    authenticated: false,
};

LoginContent.propTypes = {
    authenticated: PropTypes.bool,
    t: PropTypes.func.isRequired,
}


const Login = ({ t }) => (
    <AltContainer store={LoginStore}>
        <LoginContent t={t} />
    </AltContainer>
);


Login.propTypes = {
    t: PropTypes.func.isRequired,
};


export default withNamespaces()(Login);
