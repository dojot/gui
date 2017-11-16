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
      <div className="row m0">
        <div className="login col s12 p0 bg-left">
          <div className="col  s4 p0 left-side">
          </div>
          <div className="col s8 login-area-right-side bg-right">
            <div className="col s7">
              <div className="row">
                <div className="col s12  offset-m1">
                  <div className="login-page-title">[&nbsp;&nbsp;Login&nbsp;&nbsp;]</div>
                </div>
              </div>
              <div className="row">
                <div className="col s12  offset-m2">
                  <div className="login-page-subtitle">Sign in to start your session</div>
                </div>
              </div>
              { this.props.error && (
                <div className="row">
                  <div className="col s12 m4 offset-m2">
                    <div className="login-page-error">
                      {getError()}<i className="material-icons prefix">info_outline</i>
                    </div>
                  </div>
                </div>
            )}
              <form onSubmit={this.login}>
                <div className="row">
                    <div className="input-field col s12 m6 offset-m2">
                      <input id="fld_user" type="text"
                             name="username"  className={getClass('username')}
                             onChange={this.handleChange}
                             value={this.state.login.user} />
                      <label htmlFor="fld_user" data-success=""
                             data-error={this.state.invalid.username}>Username</label>
                      <i className="material-icons prefix">account_circle</i>
                    </div>
                    <div className="input-field col s12 m6 offset-m2">
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
                  <div className="col s12 m5 offset-m1 forget-password">
                    <div><i> Forgot your password?</i></div>
                  </div>
                </div>
                <div className="row">
                  <div className="col s12 m1 offset-m7">
                      { this.props.loading ? (
                        <button type="submit" className="waves-effect waves-dark red btn-flat">
                          <i className="fa fa-circle-o-notch fa-spin fa-fw"/>
                        </button>
                      ) : (
                        <button type="submit" className="waves-effect waves-dark red btn-flat">
                          Login
                        </button>
                      )}
                  </div>
                </div>
              </form>
            </div>
            <div className="col s5 right-side">
              <div className="dojot-logo">
                <img src="images/dojot_white.png" />
              </div>
              <div className="slogan">
                <b>Do IoT</b><br />Fácil<br />
                Rápido<br /> e Seguro
              </div>
            </div>
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
