import React, { Component } from 'react';

class Paginator extends Component {
  constructor() {
    super();

    this.state = { slice: 0 };

    this.triggerNextPage = this.triggerNextPage.bind(this);
    this.triggerPreviousPage = this.triggerPreviousPage.bind(this);
    this.triggerGoToPage = this.triggerGoToPage.bind(this);
    this.getLast = this.getLast.bind(this);
  }

  triggerNextPage(){
    if (this.getLast() > this.state.slice + 1) {
      this.setState({slice: this.state.slice + 1});
    }
  }

  triggerPreviousPage(){
    if (this.state.slice > 0) {
      this.setState({slice: this.state.slice - 1})
    }
  }

  triggerGoToPage(page) {
    if (typeof page !== 'number') {
      console.error("Given page is not a number");
    }

    if (this.getLast() > page) {
      this.setState({slice: page});
    }
  }

  getLast() {
    const hasTail = this.props.values.length % this.props.entriesPerPage;
    return (Math.floor(this.props.values.length / this.props.entriesPerPage)) + (hasTail ? 1 : 0);
  }

  render() {
    let listSlice = []
    let i = this.state.slice * this.props.entriesPerPage;
    let k = 0;
    const values = this.props.values;
    while (i < values.length && k < this.props.entriesPerPage) {
      listSlice.push(values[i]);
      i++; k++;
    }

    const children = React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        values: listSlice,
        isFirst: this.state.slice === 0,
        isLast: this.state.slice === (this.getLast() - 1),
        currentPage: this.state.slice,
        next: this.triggerNextPage,
        prev: this.triggerPreviousPage,
        goto: this.triggerGoToPage,
      });
    })

    return (
      <span>
        {children}
      </span>
    )
  }
}

export default Paginator;
