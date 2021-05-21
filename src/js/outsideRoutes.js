import React from 'react';
import { Router, Route, hashHistory } from 'react-router';
import Login from './containers/login/Login';

export default (
    <Router history={hashHistory}>
        <Route path="/login" component={Login} />
        <Route path="/" component={Login} />
        <Route path="*" component={Login} />
    </Router>
);
