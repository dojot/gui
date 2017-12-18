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

export default DojotButton;
