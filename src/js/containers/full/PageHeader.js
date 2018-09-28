/* eslint-disable */
import React from 'react';

function NewPageHeader(props) {
    const childrenWithProps = React.Children.map(props.children, child => React.cloneElement(child, { ...props }));
    // console.log('newPageHeader', props);
    return (
        <div className="header-box">
            <div className="title-box">
                <div className="icon">
                    {props.icon != '' && (
                        <img src={`images/header/${props.icon}-icon.png`} />
                    )}
                </div>
                <div className="title">{props.title}</div>
            </div>
            <div className="row col m12 second-bar">
                <div className="page-actions col s12 pull-right text-right p0">
                    {childrenWithProps}
                </div>
            </div>
        </div>
    );
}

function PageHeader(props) {
    return (
        <div className={(props.shadow == 'true') ? 'page-header box-shadow' : 'page-header'}>
            <div className="data">
                <div className="title-area">
                    <div className="page-title caps">{props.title}</div>
                    <div className="page-subtitle">{props.subtitle}</div>
                </div>
                <div className="page-actions">
                    {props.children}
                </div>
            </div>
        </div>
    );
}

function ActionHeader(props) {
    return (
        <span>
            <div className="inner-header">
                <div className="title">{props.title}</div>
                <div className="actions">{props.children}</div>
            </div>
            <div className="inner-header-placeholder">
                {/* Helps the positioning of content *below* the header */}
            </div>
        </span>
    );
}

function CustomHeader(props) {
    const childrenWithProps = React.Children.map(props.children, child => React.cloneElement(child, { ...props }));

    return (
        <div className="header-box">
            <div className="title-box">
                <div className="icon">
                    {props.icon != '' && (
                        <img src={`images/header/${props.icon}-icon.png`} />
                    )}
                </div>
                <div className="title">{props.title}</div>
            </div>
            <div className="content-header">
                {childrenWithProps}
            </div>
        </div>
    );
}

export {
    NewPageHeader, PageHeader, ActionHeader, CustomHeader,
};
