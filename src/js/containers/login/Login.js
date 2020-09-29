import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Fade from 'react-reveal/Fade';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import AltContainer from 'alt-container';
import MaterialInput from 'Components/MaterialInput';
import { withNamespaces } from 'react-i18next';
import LoginActions from 'Actions/LoginActions';
import LoginStore from 'Stores/LoginStore';
import { RecoveryPasswordModal } from 'Components/Modal';

class Content extends Component {
    constructor(props) {
        super(props);

        this.state = {
            login: {
                username: '',
                password: '',
            },
            valid: {
                state: true,
                currentError: '',
            },
            appear: true,
            showPasswordModal: false,
            hasBeError: false,
            error: '',
        };
        this.login = this.login.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.validate = this.validate.bind(this);
        this.openPasswordModal = this.openPasswordModal.bind(this);
        this.handlePasswordModal = this.handlePasswordModal.bind(this);
        this.checkUsername = this.checkUsername.bind(this);
        this.getError = this.getError.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.hasError !== state.hasBeError || props.error !== state.error) {
            return {
                ...state,
                hasBeError: props.hasError,
                error: props.error,
            };
        }
        return null;
    }

    getError() {
        const { valid, hasBeError, error } = this.state;
        // GUI checking
        if (!valid.state) { return valid.currentError; }
        // Backend checking
        if (hasBeError) {
            return error;
        }
        return '';
    }

    checkUsername(username) {
        const regex = /^([a-z0-9_])+$/;
        return regex.test(username);
    }

    validate(user, password) {
        const { t } = this.props;
        const valid = { state: true, currentError: '' };

        if (user.trim().length === 0) {
            valid.state = false;
            valid.currentError = t('login:alerts.empty_user');
            return valid;
        }

        if (password.trim().length === 0) {
            valid.state = false;
            valid.currentError = t('login:alerts.empty_pass');
            return valid;
        }

        if (!this.checkUsername(user)) {
            valid.state = false;
            valid.currentError = t('login:alerts.invalid_user');
            return valid;
        }

        return valid;
    }

    login(e) {
        e.preventDefault();
        const { login } = this.state;
        const { username, password } = login;
        const valid = this.validate(username, password);
        if (valid.state) {
            LoginActions.authenticate(JSON.parse(JSON.stringify(login)));
        }
        this.setState({ valid, appear: true });
    }

    handleChange(event) {
        const { target: { name, value } } = event;
        const { login } = this.state;
        login[name] = value;
        this.setState({ login });
    }

    openPasswordModal(status) {
        this.setState({ showPasswordModal: status });
    }

    handlePasswordModal() {
        this.setState({ showPasswordModal: true });
    }

    render() {
        const {
            appear, valid, showPasswordModal, hasBeError,
            login: { username, password },
        } = this.state;
        const { t, loading } = this.props;

        const titleLogin = `[  ${t('login:title')}  ]`;
        return (
            <div className="row m0">
                <div className="login col s12 p0 bg-left">
                    <div className="col  s4 p0 left-side" />
                    <div className="col s8 login-area-right-side bg-right">
                        <div className="col s7">
                            <form>
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

                                <div className="row mb0">
                                    <div className="input-field col s12 m8 offset-m2">
                                        <MaterialInput
                                            name="username"
                                            id="fld_user"
                                            className="attribute-type-login pointer"
                                            maxLength={40}
                                            value={username}
                                            onChange={(e) => this.handleChange(e)}
                                        >
                                            {t('username.label')}
                                        </MaterialInput>
                                    </div>
                                    <div className="input-field col s12 m8 offset-m2">
                                        <MaterialInput
                                            name="password"
                                            type="password"
                                            id="fld_password"
                                            className="attribute-type-login pointer"
                                            maxLength={40}
                                            value={password}
                                            onChange={(e) => this.handleChange(e)}
                                        >
                                            {t('login:password.label')}
                                        </MaterialInput>
                                        <div className="row">
                                            <div className="forget-password col s12">
                                                <span
                                                    tabIndex="-1"
                                                    role="button"
                                                    onKeyPress={this.handlePasswordModal}
                                                    onClick={this.handlePasswordModal}
                                                >
                                                    {t('login:forgot_password')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s11">
                                        {loading ? (
                                            <button
                                                type="button"
                                                className="clear-btn new-btn-flat red sp-btn-loading"
                                            >
                                                <i className="fa fa-circle-o-notch fa-spin fa-fw" />
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                tabIndex="0"
                                                onKeyPress={this.login}
                                                onClick={this.login}
                                                className="clear-btn new-btn-flat red sp-btn-login"
                                            >
                                                {t('login:title')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m8 offset-m2">
                                        { (hasBeError || !valid.state) ? (
                                            <Fade
                                                bottom
                                                when={appear}
                                                onReveal={() => setTimeout(() => {
                                                    this.setState({ appear: false });
                                                }, 3000)}
                                            >
                                                <div className="login-page-error">
                                                    <span>{this.getError()}</span>
                                                    <i className="fa fa-exclamation-triangle" />
                                                </div>
                                            </Fade>
                                        ) : <div className="no-error" />}
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
                {showPasswordModal
                    ? (
                        <RecoveryPasswordModal
                            openPasswordModal={this.openPasswordModal}
                        />
                    ) : <div />}
            </div>
        );
    }
}

Content.propTypes = {
    t: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

const Login = ({ t }) => (
    <ReactCSSTransitionGroup
        transitionName="first"
        transitionAppear
        transitionAppearTimeout={500}
        transitionEnterTimeout={500}
        transitionLeaveTimeout={500}
    >
        <AltContainer store={LoginStore}>
            <Content t={t} />
        </AltContainer>
    </ReactCSSTransitionGroup>
);

Login.propTypes = {
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(Login);
