import React from 'react';
import {
    Router, Route, IndexRoute, hashHistory,
} from 'react-router';

import { Devices, ViewDevice, NewDevice } from 'Views/devices';
import Templates from 'Views/templates';
import Notifications from 'Views/notifications/index';
import { Flows, EditFlow } from 'Views/flows';
import Alarms from 'Views/alarms';
import Full from 'Containers/full/Full';
import NotFound from './utils/404';

export default (
    <Router history={hashHistory}>
        <Route path="/" component={Full}>
            <IndexRoute component={Devices} />
            <Route name="Device manager">
                <Route path="deviceManager" name="Device manager" component={Devices} />
                <Route path="device" name="Devices">
                    <IndexRoute component={Devices} />
                    <Route path="list" name="Device list" component={Devices} />
                    <Route path="new" name="" component={NewDevice} />
                    <Route path="id/:device/detail" name="Device detail" component={ViewDevice} />
                    <Route path="id/:device/edit" name="Device edit" component={NewDevice} />
                </Route>
                <Route path="template" name="Templates">
                    <IndexRoute component={Templates} />
                    <Route path="list" name="Template list" component={Templates} />
                </Route>
            </Route>

            <Route path="flows" name="Information Flows">
                <IndexRoute component={Flows} />
                <Route path="id/:flowid" name="Flow detail" component={EditFlow} />
                <Route path="new" name="New flow" component={EditFlow} />
            </Route>

            <Route path="alarm" name="Alarm" component={Alarms} />

            <Route path="notifications" name="Notifications">
                <IndexRoute component={Notifications} />
                <Route path="notifications" name="Notifications" component={Notifications} />
            </Route>

            <Route path="*" name="default" component={NotFound} />
        </Route>
    </Router>
);
