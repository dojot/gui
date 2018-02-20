import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import detail from '../views/devices/detail';

class ConfirmModal extends Component {
  constructor(props) {
    super(props);

    this.dismiss = this.dismiss.bind(this);
    this.remove = this.remove.bind(this);
  }

  dismiss(){
    this.props.openModal(false);
  }

  remove(event){
    event.preventDefault();
    this.props.remove(event);
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
              <div className="message-title left">Delete {this.props.name}</div>
              <div className="message-subtitle left">Are you sure you want remove this</div>
              <div className="message-subtitle left">{this.props.name}?</div>
            </div>
          </div>
          <div className="confirm-modal-footer">
            <div  className="col s6"><a className="waves-effect waves-light btn btn-light" id="btn-cancel" tabIndex="-1" title="Cancel" onClick={this.dismiss}>Cancel</a></div>
            <div className="col s6"><a className="waves-effect waves-light btn" id="btn-remove" tabIndex="-1" title="Remove" onClick={this.remove}>Remove</a></div>
          </div>
        </div>
        <div className="modal-background" onClick={this.dismiss}></div>
      </div>
    )
  }
}

export { ConfirmModal };
