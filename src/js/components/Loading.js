
import React, { Component } from 'react';

function Loading(props) {
  return (
    <div className="background-info valign-wrapper full-height">
      <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
    </div>
  )
}

// TODO: take contents as children
function BackgroundMessage(props) {
  return (
    <div className="full-height valign-wrapper background-info subtle relative graph report-problem">
      <div className="horizontal-center">
        <i className="material-icons">report_problem</i>
        <div>No position data available</div>
      </div>
    </div>
  )
}

export { Loading, BackgroundMessage };
