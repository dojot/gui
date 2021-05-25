import React, { Component, Fragment } from 'react';
import * as i18next from 'i18next';
import * as PropTypes from 'prop-types';

const Truncate = (props) => {
    const { value } = props;
    return (
        <>
            {value.length > 25
                ? `${value.substr(0, 21)}...`
                : value}
        </>
    );
};

Truncate.propTypes = { value: PropTypes.string.isRequired };

class Metadata extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };

        this.showMetadata = this.showMetadata.bind(this);
    }

    showMetadata() {
        this.setState(prevState => ({ open: !prevState.open }));
    }

    render() {
        const { attr: { metadata } } = this.props;
        const { open } = this.state;

        function formatName(item) {
            return `${item.label} (${item.type})`;
        }

        return (
            <div className="metadata-wrapper">
                <div
                    className="button-meta"
                    onClick={this.showMetadata}
                    onKeyPress={this.showMetadata}
                    role="button"
                    tabIndex={0}
                >
                    {`${i18next.t('devices:meta_attributes')} (${metadata.length})`}
                    <i className={`fa ${open ? 'fa-angle-up' : 'fa-angle-down'}`} />
                </div>
                {metadata.map(item => (
                    open && (
                        <div
                            key={item.id}
                            className="display-flex-column flex-1 line-meta"
                        >
                            <div
                                className="name-value truncate"
                                title={formatName(item)}
                            >
                                <Truncate value={formatName(item)} />
                            </div>
                            <div className="display-flex-no-wrap space-between">
                                <div
                                    className="value-value truncate"
                                    title={item.static_value}
                                >
                                    <Truncate value={item.static_value} />
                                </div>
                                <div
                                    className="value-label "
                                    title={item.value_type}
                                >
                                    {i18next.exists(`types.${item.value_type}`)
                                        ? i18next.t(`types.${item.value_type}`) : item.value_type}
                                </div>

                            </div>
                        </div>
                    )
                ))}

            </div>
        );
    }
}

Metadata.propTypes = {
    attr: PropTypes.shape({
        metadata: PropTypes.arrayOf(
            PropTypes.shape,
        ),
    }).isRequired,
};

export default Metadata;
