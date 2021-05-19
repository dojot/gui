import React from 'react';
import { Router, Route, hashHistory } from 'react-router';
import PasswordRecovery from './containers/login/PasswordRecovery';
import Login from './containers/login/Login';
import ReturnLogin from './containers/login/ReturnLogin';

export default (
    <Router history={hashHistory}>
        <Route path="/passwordrecovery/(:link)" component={PasswordRecovery} />
        <Route path="/setpassword/(:link)" component={PasswordRecovery} />
        <Route path="/login" component={Login} />
        <Route path="/return" component={ReturnLogin} />

        <Route path="/" component={Login} />
        <Route path="*" component={Login} />
    </Router>
);
