import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withNamespaces } from 'react-i18next';
import notificationType from './PropTypes';

const MetaNotification = (props) => {
    const {
        keyName, value,
    } = props;

    let valueToShow = 'undefined';
    if (((typeof value) === 'boolean')) {
        valueToShow = (value ? 'true' : 'false');
    } else if ((typeof value) === 'number' || (typeof value) === 'string') {
        valueToShow = value;
    }

    return (
        <div className="meta-row">
            <div className="main">
                {valueToShow}
            </div>
            <div className="sub">
                {keyName}
            </div>
        </div>
    );
};

class CardNotification extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isShowMetas: false,
        };

        this.clickToggle = this.clickToggle.bind(this);
    }

    clickToggle() {
        this.setState((prevState) => ({
            isShowMetas: !prevState.isShowMetas,
        }));
    }

    render() {
        const {
            notification: {
                date, time, message, metas,
            }, t: i18n,
        } = this.props;

        const { isShowMetas } = this.state;

        return (
            <li>
                <div
                    className="dojot-collapsible-header"
                    role="button"
                    onClick={this.clickToggle}
                    tabIndex={0}
                    onKeyDown={this.clickToggle}
                >
                    <div className="card-notification">
                        <div className="first-col-noti">
                            <i
                                className="fa fa-clock-o icon-clock "
                                aria-hidden="true"
                            />
                            <div className="datetime">
                                <div className="date">{date}</div>
                                <div className="time">
                                    {time}
                                </div>
                            </div>
                        </div>
                        <div className="second-col-noti">
                            <div className="info-row">
                                <div className={typeof message === 'string' ? 'main' : 'error'}>
                                    {typeof message === 'string' ? message : i18n('notifications:message_error') }
                                </div>
                                <div className="sub">
                                    {i18n('notifications:message')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr />
                <div className={`dojot-collapsible-body${isShowMetas ? '-active' : ''}`}>
                    <div className="card-notification">
                        <div className="meta-body">
                            {Object.keys((metas))
                                .map((key) => (
                                    <MetaNotification
                                        value={metas[key]}
                                        keyName={key}
                                        key={Math.random()}
                                    />
                                ))}
                        </div>
                    </div>
                    <hr />
                </div>
            </li>
        );
    }
}

CardNotification.propTypes = {
    t: PropTypes.func.isRequired,
    notification: notificationType,
};

CardNotification.defaultProps = {
    notification: {
        date: '',
        time: '',
        message: '',
        metas: {},
    },
};

MetaNotification.propTypes = {
    keyName: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool,
    ]),
};

MetaNotification.defaultProps = {
    keyName: 'key',
    value: 'undefined',
};

export default withNamespaces()(CardNotification);
