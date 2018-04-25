import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { DojotBtnCircle, DojotButton } from "../../components/DojotButton";
import ReactPaginate from 'react-paginate';

class Pagination extends Component {

  constructor(props) {
    super(props);
    this.handlePageClick = this.handlePageClick.bind(this);
  }

  handlePageClick(data) {
    let pag = { page_num: data.selected + 1};
    this.props.ops.whenUpdatePagination(pag);
  }

  render() {
    // console.info("Rendering Filter");
    // console.info("Props and States ",this.props,this.state);
    // console.log("this.props.showPainel", this.props.showPainel);
    if (!this.props.pagination)
      return <div className='col s7 p0'></div>;

    let pageCount = this.props.pagination.total;
    let currentPage = this.props.pagination.page - 1; 

    return (
      <div className='col s7 p0'>
        <ReactPaginate previousLabel={"previous"}
          nextLabel={"next"}
          pageCount={pageCount}
          marginPagesDisplayed={1}
          pageRangeDisplayed={4}
          forcePage={currentPage}
          onPageChange={this.handlePageClick}
          containerClassName={"pagination"}
          subContainerClassName={"pages pagination"}
          activeClassName={"active"} />
      </div>
      )
  }
}



class Filter extends Component {

  constructor(props) {
    super(props);
    this.state = {
      hasData: false,
      hasPainel: true,
      order: 'asc',
      nElements: 0,
      query: {}
    };
    this.filterByLabel = this.filterByLabel.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.doSearch = this.doSearch.bind(this);
  }

  updateQuery(element) {
    // console.log("Update query...");
    let qy = this.state.query;
    qy[element.label] = element.value;
    if (element.value.trim() == "")
      delete qy[element.label];
    this.setState({ query: qy});
  }

  doSearch(){
    this.props.ops.whenUpdateFilter(this.state.query);
  }
  
  filterByLabel(e) {
    e.preventDefault();
    this.updateQuery({ 'label': 'label', 'value':e.target.value});
  }

  componentDidMount() {
    this.setState({ hasPainel: this.props.showSearchBox });
  }
  
  render() {
    // console.info("Rendering Filter");
    // console.info("Props and States ",this.props,this.state);
    console.log("this.props.showPainel", this.props.showPainel);
 
    // if (this.props.showPainel) {
    //   return null;
    // }
    let Fields = this.props.fields;

    return ( 
      <div className={"row z-depth-2 templatesSubHeader " + (this.props.showPainel ? "show-dy" : "hide-dy")} id="inner-header">
        <div className="col s3 m3 main-title">
          Filtering {this.props.metaData.alias}(s)
          {/* Showing {this.state.nElements}  {this.metaData.alias}(s) */}
        </div>
        <div className="col s1 m1 header-info" />
        <div className="col s6 m6">
          <Fields value={this.state.query.label} onChange={this.filterByLabel} />
        </div>
        <div className="col s1 m1 pt10">
          <DojotBtnCircle click={this.doSearch} icon={"fa fa-search"} />
        </div>
      </div>
      )
  }
}

class SimpleFilter extends Component {
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
            <input id="deviceFiltering" type="text" onChange={this.handleChange} />
          </div>
        </form>
      </div>
    )
  }
}

// export default Filter;
export { SimpleFilter, Filter, Pagination };
