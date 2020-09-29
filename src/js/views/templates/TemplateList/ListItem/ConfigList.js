import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import PropTypes from 'prop-types';
import TemplateTypes from '../../TemplateTypes';

const attrType = new TemplateTypes();

class ConfigList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSuppressed: true,
            configFieldSizeStatus: false,
        };

        this.suppress = this.suppress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.removeAttribute = this.removeAttribute.bind(this);
        this.availableValueTypes = attrType.getConfigValueTypes();
        this.availableTypes = attrType.getConfigTypes();
    }

    componentWillMount() {
        if (this.props.attributes.hasOwnProperty('static_value')) {
            if (this.props.attributes.static_value.length > 18) {
                this.setState({ configFieldSizeStatus: true });
            }
        }
    }

    suppress() {
        const { state } = this;
        state.isSuppressed = !state.isSuppressed;
        this.setState(state);
    }

    handleChange(event) {
        this.props.onChangeValue(event, this.props.index);
    }

    removeAttribute(attribute) {
        this.props.removeAttribute(attribute, true);
    }

    render() {
        // console.log("this.props.attributes", this.props.attributes);
        if (this.props.attributes.type == 'fw_version') {
            return null;
        }

        const staticValue = this.props.attributes.static_value || '';
        const { t } = this.props;
        return (
            <div className={`attr-area ${this.state.isSuppressed ? 'suppressed' : ''}`}>
                <div className="attr-row">
                    <div className="icon">
                        <img src="images/gear-dark.png" />
                    </div>
                    <div className="attr-content">
                        <select
                            id="select_attribute_type"
                            className="card-select"
                            name="label"
                            value={this.props.attributes.label}
                            disabled={!this.props.editable}
                            onChange={this.handleChange}
                        >
                            <option value="">Select type</option>
                            {this.availableValueTypes.map((opt) => (
                                <option
                                    value={opt.value}
                                    key={opt.label}
                                >
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <span>Type</span>
                    </div>
                    <div
                        className="center-text-parent material-btn right-side"
                        onClick={this.suppress}
                    >
                        <i className={`${this.state.isSuppressed ? 'fa fa-angle-down' : 'fa fa-angle-up'} center-text-child text`} />
                    </div>
                </div>
                <div className="attr-row">
                    <div className="icon" />
                    <div className="attr-content">
                        <input
                            className={(this.props.attributes.label === 'protocol' ? 'none' : '') || (this.state.configFieldSizeStatus ? 'truncate' : '')}
                            type="text"
                            name="static_value"
                            value={staticValue}
                            disabled={!this.props.editable}
                            onChange={this.handleChange}
                            title={staticValue}
                            maxLength={128}
                        />
                        <select
                            id="select_attribute_type"
                            className={`${this.props.attributes.label === 'protocol' ? '' : 'none'} card-select`}
                            name="static_value"
                            value={staticValue}
                            disabled={!this.props.editable}
                            onChange={this.handleChange}
                        >
                            <option value="">Select type</option>
                            {this.availableTypes.map((opt) => (
                                <option
                                    value={opt.value}
                                    key={opt.label}
                                >
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <span>Meta Value</span>
                    </div>
                    <div
                        className={`${this.props.editable ? '' : 'none'} center-text-parent material-btn right-side raised-btn`}
                        title={`${t('remove')} ${t('templates:template')} `}
                        onClick={this.removeAttribute.bind(this, this.props.index)}
                        role="button"
                    >
                        <i className="fa fa-trash center-text-child icon-remove" />
                    </div>
                </div>
            </div>
        );
    }
}

ConfigList.propTypes = {
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(ConfigList);
