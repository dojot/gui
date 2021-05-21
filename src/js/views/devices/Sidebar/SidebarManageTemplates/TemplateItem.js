import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withNamespaces } from 'react-i18next';

const InputCheckbox = ({
    name, onChange, checked, label,
}) => (
    <span>
        <input
            name={name}
            id={name}
            onChange={() => onChange()}
            value={name}
            checked={!!checked}
            type="checkbox"
        />
        <label htmlFor={name}>{label}</label>
    </span>
);

InputCheckbox.defaultProps = {
    checked: false,
    label: '',
}

InputCheckbox.propTypes = {
    checked: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
}


const TemplateItem = ({
    template, checked, handleSelectTemplate, t,
}) => (
    <Fragment>
        <div
            tabIndex="0"
            role="button"
            className="template-item"
            title={template.label}
            onClick={() => handleSelectTemplate(checked, template)}
            onKeyDown={() => handleSelectTemplate(checked, template)}
        >
            <div className="template-labels">
                <div className="template-name">
                    {template.label}
                </div>
                <div className="total-attrs">
                    {`${template.attrs.length} ${t('text.attributes')}`}
                </div>
            </div>
            <div className="select-template">
                <InputCheckbox
                    name={template.id}
                    checked={checked}
                    onChange={() => handleSelectTemplate(!checked, template)}
                />
            </div>
        </div>
    </Fragment>
);


TemplateItem.defaultProps = {
    checked: false,
};

TemplateItem.propTypes = {
    template: PropTypes.shape({
        label: PropTypes.string,
        id: PropTypes.string,
        attrs: PropTypes.arrayOf(
            PropTypes.shape),
    }).isRequired,
    checked: PropTypes.bool,
    handleSelectTemplate: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(TemplateItem);
