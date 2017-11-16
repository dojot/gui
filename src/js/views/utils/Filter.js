import React, { Component } from 'react';

class Filter extends Component {
  constructor(props) {
    super(props);

    this.state = { filter: "" };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({ filter: event.target.value });
    this.props.onChange(event.target.value);
  }

  render() {
    return (
      <div className="filter-wrapper relative-size">
        <form role="form">
          {/* filter selection  */}
          <div className="input-field">
            {/* <i className="prefix fa fa-search"></i>*/}
            <label htmlFor="deviceFiltering">Filter</label>
            <input id="deviceFiltering" type="text" onChange={this.handleChange}></input>
          </div>
        </form>
      </div>
    )
  }
}

export default Filter;
