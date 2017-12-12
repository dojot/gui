import React from 'react';
import { Router, Route, IndexRoute, Redirect, hashHistory } from 'react-router';

import Login from './containers/login/';
import Dashboard from './views/dashboard/';
import Full from './containers/full/';

import { Devices, ViewDevice, NewDevice }  from './views/devices';
import DeviceDashboard from './views/dashboard/DeviceDashboard';

import { TemplateList, NewTemplate } from './views/templates';
import Users from './views/users/';
import { Flows, EditFlow } from './views/flows';

import Todo from './views/utils/todo';

export default (
  <Router history={hashHistory}>
    <Route path="/" component={Full}>
      <IndexRoute component={Devices} />
      <Route name="Device manager" >
        <Route path="deviceManager" name="Device manager" component={Devices} />
        <Route path="device" name="Devices">
          <IndexRoute component={Devices} />
          <Route path="list" name="Device list" component={Devices} />
          <Route path="stats" name="Device Dashboard" component={Devices} />
          <Route path="new" name="" component={NewDevice} />
          <Route path="id/:device/detail" name="Device detail" component={ViewDevice} />
          <Route path="id/:device/edit" name="Device edit" component={NewDevice} />
        </Route>
        <Route path="template" name="Templates">
          <IndexRoute component={TemplateList} />
          <Route path="list" name="Template list" component={TemplateList} />
          <Route path="stats" name="Template Dashboard" component={Todo} />
          <Route path="new" name="" component={NewTemplate} />
          <Route path="id/:templateId" name="Template detail" component={TemplateList} />
          <Route path="id/:template/edit" name="Template detail" component={NewTemplate} />
        </Route>
      </Route>

      <Route path="config" name="Settings" component={Todo} />

      <Route path="flows" name="Information Flows">
        <IndexRoute component={Flows} />
        <Route path="id/:flowid" name="Flow detail" component={EditFlow} />
        <Route path="new" name="New flow" component={EditFlow} />
      </Route>

      <Route path="alarm" name="Alarm" component={Todo} />
      <Route path="auth" name="Authentication">
        <IndexRoute component={Users} />
        <Route path="user" name="User detail" component={Users} />
        <Route path="permissions" name="Permissioning detail" component={Todo} />
      </Route>

      <Route path="deploy" name="Deployment" component={Todo} >
        <Route path="plugins" name="Template detail" component={Todo} />
        <Route path="applications" name="Template detail" component={Todo} />
      </Route>

      <Route path="todo" name="To be implemented" component={Todo} />
    </Route>
  </Router>
);
