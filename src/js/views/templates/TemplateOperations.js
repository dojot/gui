import TemplateActions from 'Actions/TemplateActions';
import { GenericOperations } from '../utils/Manipulation';

class TemplateOperations extends GenericOperations {
    constructor() {
        super();
        this.filterParams = { sortBy: 'label' };
        this.paginationParams = {};
        this.setDefaultPaginationParams();
    }

    whenUpdatePagination(config) {
        for (const key in config) this.paginationParams[key] = config[key];
        this._fetch();
    }

    whenUpdateFilter(config) {
        // set default parameters
        this.setDefaultPageNumber();
        this.filterParams = config;
        this._fetch();
    }

    whenRemoveItemFromLastPage() {
        if (this.paginationParams.page_num > 0) {
            this.paginationParams.page_num = this.paginationParams.page_num - 1;
        }
    }

    _fetch() {
        const res = { ...this.paginationParams, ...this.filterParams };
        // console.log('fetching: ', res);
        TemplateActions.fetchTemplates(res);
    }
}

export default TemplateOperations;
