/* eslint-disable */
import React, { Component } from 'react';
import ReactPaginate from 'react-paginate';
import { DojotBtnCircle } from '../../components/DojotButton';
import MaterialSelect from '../../components/MaterialSelect';
import { withNamespaces } from 'react-i18next';

class GenericOperations {
    constructor() {
    }

    setDefaultPageNumber() {
        this.paginationParams.page_num = 1;
    }

    setDefaultPaginationParams() {
        this.paginationParams = {
            page_size: 6,
            page_num: 1,
        };
    }

    hasFilter() {
        if (Object.keys(this.filterParams).length > 1) { // sortBy attribute
            return true;
        }
        return false;
    }

    getCurrentQuery() {
        return this.filterParams;
    }
}

class FilterLabelComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { t } = this.props;
        if (this.props.ops.hasFilter()) {
            return (
                <div className="col s2 p0 filter-information">
                    <i className="fa fa-info-circle "/>
                    {t('text.filtering')}
                </div>
            );
        }
        return <div className="col s2 p0 filter-information"/>;
    }
}


class PaginationComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            page_size: 6,
            page_num: 1,
        };
        this.handlePageClick = this.handlePageClick.bind(this);
        this.changeNelements = this.changeNelements.bind(this);
    }

    handlePageClick(data) {
        const state = this.state;
        state.page_num = data.selected + 1;
        this.setState(state);
        this.props.ops.whenUpdatePagination(state);
    }

    changeNelements(event) {
        const state = this.state;
        state.page_size = event.target.value;
        state.page_num = 1; // we need restart to the first page
        this.setState(state);
        this.props.ops.whenUpdatePagination(state);
    }

    render() {
        const { t } = this.props;

        if (!this.props.pagination || !this.props.show_pagination || !this.props.pagination.total) {
            return <div className="col s7 p0"/>;
        }

        const pageCount = this.props.pagination.total;
        const currentPage = this.props.pagination.page - 1;

        return (
            <div className="col s12 l7 p0">
                <div className="pagination_div">
                    <ReactPaginate previousLabel={t('text.prev')} nextLabel={t('text.next')}
                                   pageCount={pageCount}
                                   marginPagesDisplayed={1} pageRangeDisplayed={3}
                                   forcePage={currentPage} onPageChange={this.handlePageClick}
                                   containerClassName="pagination"
                                   subContainerClassName="pages pagination"
                                   activeClassName="active"/>
                </div>
                <div className="elements_page_div">
                    <MaterialSelect new_style label={`# ${t('text.per_page')}`}
                                    value={this.state.elements_page}
                                    onChange={this.changeNelements}>
                        <option key="six" value="6">
                            6
                        </option>
                        <option key="twelve" value="12">
                            12
                        </option>
                        <option key="eighteen" value="18">
                            18
                        </option>
                        <option key="thirtysix" value="36">
                            36
                        </option>
                        <option key="sixtyfour" value="64">
                            64
                        </option>
                    </MaterialSelect>
                </div>
            </div>
        );
    }
}

class NewPaginationComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            page_size: 6,
            page_num: 1,
        };
        this.handlePageClick = this.handlePageClick.bind(this);
        this.changeNelements = this.changeNelements.bind(this);
    }

    handlePageClick(data) {
        const state = this.state;
        state.page_num = data.selected + 1;
        this.setState(state);
        this.props.ops.whenUpdatePagination(state);
    }

    changeNelements(event) {
        const state = this.state;
        state.page_size = event.target.value;
        state.page_num = 1; // we need restart to the first page
        this.setState(state);
        this.props.ops.whenUpdatePagination(state);
    }

    render() {
        const { t } = this.props;
        if (!this.props.pagination || !this.props.show_pagination || !this.props.pagination.total) {
            return <div className="pagination-wrapper"/>;
        }

        const pageCount = this.props.pagination.total;
        const currentPage = this.props.pagination.page - 1;

        return (
            <div className="pagination-wrapper">
                <div className="elements_page_div">
                    <MaterialSelect new_style label={`# ${t('text.per_page')}`}
                                    value={this.state.elements_page}
                                    onChange={this.changeNelements}>
                        <option key="six" value="6">6</option>
                        <option key="twelve" value="12">12</option>
                        <option key="eighteen" value="18">18</option>
                        <option key="thirtysix" value="36">36</option>
                        <option key="sixtyfour" value="64">64</option>
                    </MaterialSelect>
                </div>
                <div className="pagination_div">
                    <ReactPaginate previousLabel={t('text.previous')}
                                   nextLabel={t('text.next_full')}
                                   pageCount={pageCount}
                                   marginPagesDisplayed={1} pageRangeDisplayed={3}
                                   forcePage={currentPage} onPageChange={this.handlePageClick}
                                   containerClassName="pagination"
                                   subContainerClassName="pages pagination"
                                   activeClassName="active"/>
                </div>
            </div>
        );
    }
}


class FilterComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasData: false,
            order: 'asc',
            nElements: 0,
            query: { sortBy: 'label' },
        };
        this.handleChange = this.handleChange.bind(this);
        this.updateQuery = this.updateQuery.bind(this);
        this.doSearch = this.doSearch.bind(this);
        this.handleKey = this.handleKey.bind(this);
    }

    updateQuery(element) {
        const qy = this.state.query;
        qy[element.label] = element.value;
        if (element.value.trim() == '') delete qy[element.label];
        this.setState({ query: qy });
    }

    doSearch() {
        //go to the first page when user search
        this.props.ops.paginationParams.page_num = 1;
        this.props.ops.whenUpdateFilter(this.state.query);
    }

    handleChange(event) {
        event.preventDefault();
        const f = event.target.name;
        const v = event.target.value;
        this.updateQuery({
            label: f,
            value: v
        });
    }

    componentDidMount() {
        if (this.props.ops.hasFilter()) {
            const qry = this.props.ops.getCurrentQuery();
            this.setState({ query: qry });
        }
    }

    handleKey(e) {
        if (e.key === 'Enter') {
            this.doSearch();
        }
    }

    render() {

        const Fields = this.props.fields;
        const { t } = this.props;

        return (
            <div
                className={`row z-depth-2 templatesSubHeader ${this.props.showPainel ? 'show-dy' : 'hide-dy'}`}
                id="inner-header">
                <div className="col s3 m3 main-title">
                    {`${t('text.filtering')} ${this.props.metaData.alias}(s)`}
                </div>
                <div className="col s6 m6">
                    <Fields fields={this.state.query} onChange={this.handleChange}
                            KeyUp={this.handleKey.bind(this)}/>
                </div>
                <div className="col s1 m1 pt10">
                    <DojotBtnCircle click={this.doSearch} icon="fa fa-search"/>
                </div>
            </div>
        );
    }
}

class SimpleFilter extends Component {
    constructor(props) {
        super(props);

        this.state = { filter: '' };
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
                    <div className="input-field">
                        <label htmlFor="deviceFiltering">Filter</label>
                        <input id="deviceFiltering" type="text" onChange={this.handleChange}/>
                    </div>
                </form>
            </div>
        );
    }
}

const Filter = withNamespaces()(FilterComponent);
const Pagination = withNamespaces()(PaginationComponent);
const NewPagination = withNamespaces()(NewPaginationComponent);
const FilterLabel = withNamespaces()(FilterLabelComponent);
export {
    SimpleFilter, Filter, Pagination, FilterLabel, GenericOperations, NewPagination,
};
