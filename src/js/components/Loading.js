import React from 'react';

const Loading = () => (
    <div className="background-info valign-wrapper full-height full-width">
        <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center" />
    </div>
);

// TODO: take contents as children
const BackgroundMessage = () => (
    <div className="full-height valign-wrapper background-info subtle relative graph report-problem">
        <div className="horizontal-center">
            <i className="material-icons">report_problem</i>
            <div>No position data available</div>
        </div>
    </div>
);

export { Loading, BackgroundMessage };
