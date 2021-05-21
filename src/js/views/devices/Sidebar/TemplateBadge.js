import React from 'react';
import PropTypes from 'prop-types';

const TemplateBagde = ({ template }) => (
    <div className="template-bagde">
        <div className="total-attrs">{template.attrs.length}</div>
        <div className="template-name">{template.label}</div>
    </div>
);

TemplateBagde.defaultProps = {
    template: {
        attrs: [],
        label: '',
    },
};

TemplateBagde.propTypes = {
    template: PropTypes.shape({
        attrs: PropTypes.arrayOf(
            PropTypes.shape({})),
        label: PropTypes.string,
    }),
};

export default TemplateBagde;
