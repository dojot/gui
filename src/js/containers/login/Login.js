import React, { Component } from 'react';
import { Link } from 'react-router'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ReactDOM from 'react-dom';
import AltContainer from 'alt-container';

import LoginActions from '../../actions/LoginActions';
import LoginStore from '../../stores/LoginStore';

class Content extends Component {
  constructor(props) {
    super(props);

    this.state = {
      login: {
        username: "",
        passwd: ""
      },
      invalid: {},
      error: ""
    }

    this.login = this.login.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.validate = this.validate.bind(this);
  }

  componentDidMount() {
    let callback = this.handleChange.bind(this);
  }

  validate() {
    let result = {};
    let invalid = {}
    const username = /^[a-z0-9_]+$/;
    if (this.state.login.username.trim().length == 0) {
      invalid['username'] = "This can't be empty";
    } else if (username.test(this.state.login.username) == false) {
      result.error = "Authentication failed";
    }

    if (this.state.login.passwd.trim().length == 0) {
      invalid['passwd'] = "This can't be empty";
    }

    if (Object.keys(invalid).length > 0) { result['invalid'] = invalid; }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  login(e) {
    e.preventDefault();
    const results = this.validate();
    if (results !== undefined) {
      this.setState(results);
    } else {
      this.setState({error: '', invalid: {}})
      LoginActions.authenticate(JSON.parse(JSON.stringify(this.state.login)));
    }
  }

  handleChange(event) {
    const target = event.target;
    let state = this.state.login;
    state[target.name] = target.value;
    this.setState({
      login: state
    });
  }

  render() {
    const state = this.state;
    const error = this.props.error;

    function getClass(field) {
      if (state.invalid.hasOwnProperty(field)) {
        return "react-validate invalid";
      } else {
        return "react-validate";
      }
    }

    function getError() {
      return state.error.length > 0 ? state.error : error;
    }

    return (
      <div className="login">
        <div className="row">
          <div className="col s12 m4 login-area-left-side">
            <div className="row icon">
              <p><img src="images/main.png"/></p>
            </div>
            <div className="row">
              {/* TODO This really should be in an i18n file somewhere */}
              <div className="info">
                dojot IoT platform provides an open and solid foundation for a series of
                applications that depend on data being collected from a myriad of devices,
                allowing developers to focus on the real value of their innovative applications.
              </div>
            </div>
          </div>
          <div className="col s12 m8 login-area-right-side">
            <div className="row">
              <div className="col s12 m5 offset-m3">
                <div className="login-page-title">Login</div>
              </div>
            </div>
            <div className="row">
              <div className="col s12 m4 offset-m4">
                <div className="login-page-subtitle">Sign in to start your session</div>
              </div>
            </div>
            { this.props.error && (
              <div className="row">
                <div className="col s12 m4 offset-m4">
                  <div className="login-page-error">
                    {getError()}<i className="material-icons prefix">info_outline</i>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={this.login}>
              <div className="row">
                  <div className="input-field col s12 m4 offset-m4">
                    <input id="fld_user" type="text"
                           name="username"  className={getClass('username')}
                           onChange={this.handleChange}
                           value={this.state.login.user} />
                    <label htmlFor="fld_user" data-success=""
                           data-error={this.state.invalid.username}>Username</label>
                    <i className="material-icons prefix">account_circle</i>
                  </div>
                  <div className="input-field col s12 m4 offset-m4">
                    <input id="fld_password" type="password"
                           name="passwd" className={getClass('passwd')}
                           onChange={this.handleChange}
                           value={this.state.login.password} />
                    <label htmlFor="fld_password" data-success=""
                           data-error={this.state.invalid.passwd}>Password</label>
                    <i className="material-icons prefix">lock_open</i>
                  </div>
              </div>
              <div className="row">
                <div className="col s12 m5 offset-m3">
                  <div><i> Forgot your password?</i></div>
                </div>
              </div>
              <div className="row">
                <div className="col s12 m1 offset-m7">
                    { this.props.loading ? (
                      <button type="submit" className="waves-effect waves-dark btn-flat">
                        <i className="fa fa-circle-o-notch fa-spin fa-fw"/>
                      </button>
                    ) : (
                      <button type="submit" className="waves-effect waves-dark btn-flat">
                        Login
                      </button>
                    )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}

class Login extends Component {
  constructor (props) {
    super(props);
  }

  render() {
    return (
      <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true}
          transitionAppearTimeout={500}
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500} >
        <AltContainer store={LoginStore}>
          <Content />
        </AltContainer>
      </ReactCSSTransitionGroup>
    );
  }
}

export default Login;
