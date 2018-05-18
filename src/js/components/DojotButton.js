import React, { Component } from 'react';
import { Link } from 'react-router';

class DojotBtnLink extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <Link to={this.props.linkto} className={"new-btn-flat red " + this.props.className } title={this.props.alt}>
      {this.props.label} <i className={this.props.icon} />
    </Link>;
  }
}

class DojotBtnClassic extends Component {
  constructor(props) {
    super(props);
  }

  render() {
  return (
    <Link to={this.props.linkto}  title={this.props.alt} className="waves-effect waves-light btn-flat">
     {this.props.label}
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


class DojotBtnRedCircle extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    // using Link
    if (this.props.to !== undefined)
    {
      return <Link to={this.props.to} className="btn waves-effect waves-light new-btn-circle btn-red" tabIndex="-1" title={this.props.tooltip}>
          <i className={"clickable " + this.props.icon} aria-hidden="true" />
        </Link>;

    }

    return (
      <button type="button" className='btn waves-effect waves-light new-btn-circle btn-red' onClick={this.props.click}>
        <i className={this.props.icon} aria-hidden="true"></i>
      </button>
    )
  }
}


class DojotBtnCircle extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <button type="button" className='btn waves-effect waves-light new-btn-circle' onClick={this.props.click}>
        <i className={this.props.icon} aria-hidden="true"></i>
      </button>
    )
  }
}

export {
  DojotBtnRedCircle, DojotBtnCircle,
  DojotBtnClassic,
  DojotBtnLink,
  DojotButton
};
