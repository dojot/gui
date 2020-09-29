import PropTypes from 'prop-types';

export const metadataType = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    static_value: PropTypes.string,
    value_type: PropTypes.string,
    type: PropTypes.string,
};

export const attrsType = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    static_value: PropTypes.string,
    value_type: PropTypes.string,
    type: PropTypes.string,
    metadata: PropTypes.arrayOf(
        PropTypes.shape(metadataType),
    ),
};

export const templateType = {
    label: PropTypes.string,
    attrs: PropTypes.arrayOf(PropTypes.shape(attrsType)),
    config_attrs: PropTypes.arrayOf(PropTypes.shape(attrsType)),
    data_attrs: PropTypes.arrayOf(PropTypes.shape(attrsType)),
    newTemplate: PropTypes.bool,
};

// @TODO create a default propsType to Operation Header's implementations
export const tempOpxType = {
    whenUpdatePagination: PropTypes.func,
    whenUpdateFilter: PropTypes.func,
    whenRemoveItemFromLastPage: PropTypes.func,
    _fetch: PropTypes.func,
    setDefaultPageNumber: PropTypes.func,
    setDefaultPaginationParams: PropTypes.func,
    hasFilter: PropTypes.func,
    getCurrentQuery: PropTypes.func,
};
