import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import detail from '../views/devices/detail';
import LoginActions from '../actions/LoginActions';


class ConfirmModal extends Component {
  constructor(props) {
    super(props)

    this.openModal = this.openModal.bind(this);
    this.confirm = this.confirm.bind(this);
  }

  openModal(statusModal){
    this.props.openModal(statusModal);
  }

  confirm(event){
    //TODO - make this button work
    console.log("TODO - Makes this operation work");
  }

  render(){
    let title = "Confirm Operation";
    let message = "Are you confirm this operation";
    return(
        <GenericModal title={title} first_message={message} btnLabel={"Confirm"} openModal={this.openModal}/>
    )
  }
}


class RemoveModal extends Component {
  constructor(props) {
    super(props);

    this.openModal = this.openModal.bind(this);
    this.remove = this.remove.bind(this);
  }

  openModal(statusModal){
    this.props.openModal(statusModal);
  }

  remove(event){
    event.preventDefault();
    this.props.remove(event);
  }

  render(){
    let title = "Remove " + this.props.name;
    let first_message = "Are you sure you want remove this";
    let second_message = this.props.name;
    return(
      <GenericModal title={title} first_message={first_message} second_message={second_message}
                            openModal={this.openModal} remove={this.remove} btnLabel={"Remove"}/>
    )
  }
}

class RecoveryPasswordModal extends Component {
  constructor(props){
    super(props);

    this.state = {
      username: '',
      modalSentEmail: false
    }

    this.dismiss = this.dismiss.bind(this);
    this.recoveryPassword = this.recoveryPassword.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  dismiss(){
    this.props.openPasswordModal(false);
  }

  handleChange(event){
    this.setState({username: event.target.value});
  }

  recoveryPassword(){
    LoginActions.resetPassword(this.state.username);
    this.setState({modalSentEmail: true});
  }

  render(){
    if(this.state.modalSentEmail){
      return (
        <div className="row">
          <div className="sent-email-message">
            <div className="col s12 sent-email-message-title">
              <div className="col s10">Sent Email</div>
              <div className="col s2 modal-close-icon" onClick={this.dismiss}><i className="material-icons">close</i></div>
            </div>
            <div className="col s12 sent-email-message-body">
              We sent you an email with the instructions and the link for you to change the password 
              (remember to check your spam box). If you do not receive the email, repeat the process.
            </div>
          </div>
          <div className="modal-background" onClick={this.dismiss}></div>
        </div>
      ) 
    } else {
      return(
        <div className="row">
          <div className="recovery-password-modal">
            <div className="row">
              <div className="recovery-password-title">[&nbsp;&nbsp;Forgot your password?&nbsp;&nbsp;]</div>
            </div>
            <div className="row">
              <div className="recovery-password-body">
                <div className = "recovery-password-message">
                  Enter the username associated with your dojot account.
                </div>
                <div className="input-field-username col s12 m6">
                  <input name="username" type="text" value={this.state.username} onChange={this.handleChange}/>
                </div>           
              </div>
            </div>
            <div className="row">
              <div className="col s12 m1 offset-m7">
                <button type="submit" className="waves-effect waves-dark red btn-flat" onClick={this.recoveryPassword}>
                  Submit
                </button>
              </div>
            </div>
          </div>
          <div className="modal-background" onClick={this.dismiss}></div>
        </div>
      )
    }    
  }
}

class ChangePasswordModal extends Component {
  constructor(props){
    super(props);

    this.state = {
      password: "",
      confirmPassword: "",
      oldPassword: "",
      invalid: {confirm: "", password: ""},     
    }

    this.dismiss = this.dismiss.bind(this);
    this.password = this.password.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.validate = this.validate.bind(this);
  }

  dismiss(){
    this.props.openChangePasswordModal(false);
    this.props.toggleSidebar();
  }

  componentWillMount(){
    this.setState({username: this.props.username});
  }

  validate() {
    let errorMessage = this.state.invalid;

    if (this.state.password.trim().length < 8) {
        errorMessage.password = "Password must be at least 8 characters";
        this.setState({invalid: errorMessage});
        return false;
    } else {
        delete errorMessage.password;
        this.setState({invalid: errorMessage});
    }
    if (this.state.confirmPassword !== this.state.password) {
        errorMessage.confirm = "Password mismatch";
        this.setState({invalid: errorMessage});
        return false;
    } else {
        delete errorMessage.confirm;
        this.setState({invalid: errorMessage});
    }
    return true;
  }

  password(e) {
    e.preventDefault();
    let errorMsg = this.state.invalid

    if (this.validate()){
        let password = {"passwd": this.state.password, "token": this.state.token};
        let passwordData = {"oldpasswd":this.state.oldPassword, "newpasswd": this.state.password};
        LoginActions.updatePassword(passwordData);
        this.dismiss();
    } else {
      errorMsg.confirm = "Password mismatch";
      this.setState({invalid: errorMsg});
    }
  }

  handleChange(event) {
    const inputValue = event.target;
    let stateValue = this.state;
    stateValue[inputValue.name] = inputValue.value;
    this.setState(stateValue);
    this.validate();
  }

  render(){
    const state = this.state;
    
    function getClass(field) {
      if (state.invalid.hasOwnProperty(field)) {
          return "react-validate invalid";
      } else {
          return "react-validate";
      }
    }
    return(
      <div className="row">
        <div className="confirm-password-modal">
          <div className="row">
            <div className="confirm-password-title">[&nbsp;&nbsp;Change Password&nbsp;&nbsp;]</div>
          </div>
          <form onSubmit={this.password}>
            <div className="row">
              <div className="confirm-password-body"> 
                <div className="input-field col s12 m12">
                  <input id="fld_oldPassword" type="password"
                          name="oldPassword"
                          onChange={this.handleChange}
                          value={this.state.oldPassword} />
                  <label htmlFor="fld_oldPassword" data-success=""
                          data-error={this.state.invalid.password}>Old password</label>                          
                </div>
                <div className="input-field col s12 m12">
                  <input id="fld_newPassword" type="password"
                          name="password" className={getClass('password')}
                          onChange={this.handleChange}
                          minLength={8}
                          value={this.state.password}/>
                  <label htmlFor="fld_newPassword" data-success=""
                          data-error={this.state.invalid.password}>Password</label>
                </div>
                <div className="input-field col s12 m12"> 
                  <input id="fld_confirmPassword" type="password"
                            name="confirmPassword" className={getClass('confirm')}
                            onChange={this.handleChange}
                            minLength={8}
                            value={this.state.confirm}/>
                  <label htmlFor="fld_confirmPassword" data-success=""
                            data-error={this.state.invalid.confirm}>Confirm your password</label>                 
                </div>
              </div>              
            </div>
            <div className="row">
              <div className="col s12 m1 offset-m7">
                <button type="submit" className="waves-effect waves-dark red btn-flat" >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="rightsidebar" onClick={this.dismiss}></div>
      </div>
    )
  }
}

class GenericModal extends Component {
  constructor(props) {
    super(props);

    this.dismiss = this.dismiss.bind(this);
    this.remove = this.remove.bind(this);
    this.confirm = this.confirm.bind(this);
  }

  dismiss(){
    this.props.openModal(false);
  }

  remove(event){
    event.preventDefault();
    this.props.remove(event);
  }

  confirm(event){
    //TODO - Make this operation work
  }

  render(){
    return (
      <div className="">
        <div className="row confirm-modal">
          <div className="confirm-modal-head">
            <div className="col s3 img-alert">
              <div><i className="fa fa-exclamation-triangle fa-4x" /></div>
            </div>
            <div className="col s9 message">
              <div className="message-title left">{this.props.title}</div>
              <div className="message-subtitle left">{this.props.first_message}</div>
              <div className="message-subtitle left">{this.props.second_message}?</div>
            </div>
          </div>
          <div className="confirm-modal-footer">
            <div  className="col s6"><a className="waves-effect waves-light btn btn-light" id="btn-dismiss" tabIndex="-1" title="Cancel" onClick={this.dismiss}>Cancel</a></div>
            <div className="col s6"><a className="waves-effect waves-light btn" id="btn-action" tabIndex="-1" title="Remove" onClick={this.remove}>{this.props.btnLabel}</a></div>
          </div>
        </div>
        <div className="modal-background" onClick={this.dismiss}></div>
      </div>
    )
  }
}

export { GenericModal, RemoveModal, RecoveryPasswordModal };
