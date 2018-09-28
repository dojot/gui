/* eslint-disable */
import React, { Component } from 'react';
import { Link } from 'react-router';

class DojotBtnLink extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const width =
            window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;

        if (this.props.responsive && width < 1226) {
          return <DojotBtnRedCircle click={this.props.onClick} to={this.props.linkTo} icon={this.props.icon} tooltip={this.props.alt} />;
        }
        // we should check if contains 'to' props or onclick props
        else if (this.props.linkTo) {
          return <Link to={this.props.linkTo} className={`new-btn-flat red ${this.props.className}`} title={this.props.alt}>
              {this.props.label} <i className={this.props.icon} />
            </Link>;
        } else {
          return <div onClick={this.props.onClick} className="new-btn-flat red" title={this.props.alt}>
              {this.props.label} <i className={this.props.icon} />
            </div>;
        }
    }
}

class DojotBtnClassic extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let is_secondary = 'main';
        if (this.props.is_secondary) is_secondary = 'secondary';

        let color = 'clr-none';
        if (this.props.color) color = this.props.color;

        if (this.props.to) {
            return (
                <Link to={this.props.to} title={this.props.title} className={`new-btn-flat style-2 ${color} ${is_secondary}`}>
                    {this.props.label}
                </Link>
            );
        }
        return (
            <button type="button" title={this.props.title} onClick={this.props.onClick} className={`new-btn-flat style-2 ${color} ${is_secondary}`}>
                {this.props.label}
            </button>
        );
    }
}

class DojotButton extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let color = 'clr-none';
        if (this.props.color) color = this.props.color;

        if (this.props.linkto) {
            return (
                <Link to={this.props.linkto} title={this.props.alt} className={`btn-flat ${color}`}>
                    {this.props.label}
                </Link>
            );
        }

        return (
            <button type="button" title={this.props.alt} onClick={this.props.click} className={`btn-flat ${color}`}>
                {this.props.label}
            </button>
        );
    }
}


class DojotBtnRedCircle extends Component {
    constructor(props) {
        super(props);
    }

    render() {
    // using Link
        if (this.props.to !== undefined) {
            return (
                <Link to={this.props.to} className="btn new-btn-circle btn-red" tabIndex="-1" title={this.props.tooltip}>
                    <i className={`clickable ${this.props.icon}`} aria-hidden="true" />
                </Link>
            );
        }

        return (
            <button type="button" className="btn new-btn-circle btn-red" onClick={this.props.click} title={this.props.tooltip}>
                <i className={this.props.icon} aria-hidden="true" />
            </button>
        );
    }
}


class DojotBtnCircle extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <button type="button" className="btn new-btn-circle" onClick={this.props.click}>
                <i className={this.props.icon} aria-hidden="true" />
            </button>
        );
    }
}

export {
    DojotBtnRedCircle, DojotBtnCircle,
    DojotBtnClassic,
    DojotBtnLink,
    DojotButton,
};
