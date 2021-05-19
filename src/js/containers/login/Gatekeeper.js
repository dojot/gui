/* eslint-disable */
import React from 'react';
import AltContainer from 'alt-container';
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

const Gatekeeper = ({ children }) => (
    <AltContainer store={LoginStore}>
        <GatekeeperRenderer>
            {children}
        </GatekeeperRenderer>
    </AltContainer>
);

export default Gatekeeper;
