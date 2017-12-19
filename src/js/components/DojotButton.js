import React, { Component } from 'react';

class DojotButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    let color = 'red';

    return (
      <button type="button" onClick={this.props.click}  className={"waves-effect waves-dark btn-flat "+color}>
        {this.props.label}
      </button>
    )
  }
}


class DojotBtnFlat extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <button type="button" className='btn new-btn-circle' onClick={this.props.click}>
        <i className={this.props.icon} aria-hidden="true"></i>
      </button>
    )
  }
}

export default { DojotButton, DojotBtnFlat };
