import React, { Component } from 'react';
import { Link } from 'react-router'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ReactDOM from 'react-dom';
import AltContainer from 'alt-container';

import LoginActions from '../../actions/LoginActions';
import LoginStore from '../../stores/LoginStore';

class Recovery extends Component {
  constructor(props) {
    super(props);

    this.state = {
      password: {
        passwd: "",
        confirmPassword: ""
      },
      invalid: {}
    }

    this.password = this.password.bind(this);
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
    if (this.state.password.passwd.trim().length == 0) {
      invalid['password'] = "This can't be empty";
    }

    if (this.state.password.confirmPassword.trim().length == 0) {
      invalid['confirmPassword'] = "This can't be empty";
    }

    if (Object.keys(invalid).length > 0) { result['invalid'] = invalid; }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  password(e) {
    e.preventDefault();
    const results = this.validate();
    if (results !== undefined) {
      this.setState(results);
    } else {
      this.setState({error: '', invalid: {}})
    }
  }

  handleChange(event) {
    const target = event.target;
    let state = this.state.password;
    state[target.name] = target.value;
    this.setState({
      password: state
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

    return (
      <div className="row m0">
        <div className="login col s12 p0 bg-left">
          <div className="col  s4 p0 left-side">
          </div>
          <div className="col s8 recovery-password-area-right-side bg-right">
            <div className="col s7">
              <div className="row">
                <div className="col s12  offset-m1">
                  <div className="recovery-password-page-title">[&nbsp;&nbsp;Password recovery&nbsp;&nbsp;]</div>
                </div>
              </div>
              <div className="row">
                <div className="col s12  offset-m2">
                  <div className="recovery-password-page-subtitle">Type your password</div>
                </div>
              </div>
              <form onSubmit={this.password}>
                <div className="row">
                    <div className="input-field col s12 m6 offset-m2">
                      <input id="fld_password" type="password"
                             name="passwd"  className={getClass('password')}
                             onChange={this.handleChange}
                             value={this.state.password.passwd} />
                      <label htmlFor="fld_password" data-success=""
                        data-error={this.state.invalid.password}>Password</label>
                      <i className="material-icons prefix">lock</i>
                    </div>
                    <div className="input-field col s12 m6 offset-m2">
                      <input id="fld_confirmPassword" type="password"
                             name="confirmPassword" className={getClass('confirmPassword')}
                             onChange={this.handleChange}
                             value={this.state.password.confirmPassword} />
                      <label htmlFor="fld_confirmPassword" data-success=""
                        data-error={this.state.invalid.confirmPassword}>Confirm your password</label>
                      <i className="material-icons prefix">lock</i>
                    </div>
                </div>
                <div className="row">
                  <div className="col s12 m1 offset-m7">
                    <button type="submit" className="waves-effect waves-dark red btn-flat">
                      Submit
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="col s5 right-side">
              <div className="dojot-logo">
                <img src="images/dojot_white.png" />
              </div>
              <div className="slogan">
                <b>Do IoT</b><br />Easy to use<br />
                Fast to develop<br /> Safe to deploy
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

class PasswordRecovery extends Component {
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
          <Recovery />
        </AltContainer>
      </ReactCSSTransitionGroup>
    );
  }
}

export default PasswordRecovery;
