import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import locales from 'i18next';
import AltContainer from 'alt-container';
import PropTypes from 'prop-types';
import { NewPageHeader } from '../../containers/full/PageHeader';
import NotificationsStore from '../../stores/NotificationStore';
import NotificationActions from '../../actions/NotificationActions';
import SocketIO from './SocketIONotification';
import CardNotification from './CardNotification';
import notificationType from './PropTypes';

const NotificationList = (props) => {
    const { notifications } = props;

    return (
        notifications.length > 0
            ? (
                <div>
                    <ul>
                        {notifications.map((notification) => (
                            <CardNotification
                                notification={notification}
                                key={Math.random()}
                            />
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="full-height flex-container pos-relative overflow-x-hidden">
                    <div className="background-info valign-wrapper full-height">
                        <span className="horizontal-center">{`${locales.t('notifications:no_data_avaliable')}`}</span>
                    </div>
                </div>
            )
    );
};

class Notifications extends Component {
    componentDidMount() {
        NotificationActions.fetchNotificationsFromHistory('user_notification');
        SocketIO.connect();
    }

    componentWillUnmount() {
        SocketIO.disconnect();
    }

    render() {
        const { t: i18n } = this.props;
        return (
            <div className="full-notification-area">
                <AltContainer store={NotificationsStore}>
                    <NewPageHeader
                        title={i18n('notifications:title')}
                        subtitle={i18n('notifications:subtitle')}
                        icon="alarm"
                    />
                    <NotificationList />
                </AltContainer>
            </div>
        );
    }
}

Notifications.propTypes = {
    t: PropTypes.func.isRequired,
};

NotificationList.propTypes = {
    notifications: PropTypes.arrayOf(notificationType),
};

NotificationList.defaultProps = {
    notifications: [],
};

export default withNamespaces()(Notifications);
