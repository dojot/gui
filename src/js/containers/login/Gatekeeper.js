import React from 'react';
import AltContainer from 'alt-container';
import PropTypes from 'prop-types';
import { Router, hashHistory } from 'react-router';
import LoginStore from '../../stores/LoginStore';
import routes from '../../outsideRoutes';

const GatekeeperRenderer = ({ authenticated, children }) => {
    if (authenticated) {
        return (
            <span>
                {children}
            </span>
        );
    }
    return (
        <Router routes={routes} history={hashHistory} />
    );
};

GatekeeperRenderer.defaultProps = {
    authenticated: false,
};


GatekeeperRenderer.propTypes = {
    children: PropTypes.shape({}).isRequired,
    authenticated: PropTypes.bool,
};


const Gatekeeper = ({ children }) => (
    <AltContainer store={LoginStore}>
        <GatekeeperRenderer>
            {children}
        </GatekeeperRenderer>
    </AltContainer>
);

Gatekeeper.propTypes = {
    children: PropTypes.shape({}).isRequired,
};


export default Gatekeeper;
