import React, { Component } from 'react';
import { Link } from 'react-router'

class DojotBtnLink extends Component {
  constructor(props) {
    super(props);
  }

  render() {
  return (
    <Link to={this.props.to} className="new-btn-flat red waves-effect waves-light " title={this.props.alt}>
      {this.props.label} <i className={this.props.icon} />
    </Link>
    )
  }
}


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

export default { DojotBtnLink, DojotButton, DojotBtnFlat };
