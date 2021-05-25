
import PropTypes from "prop-types";
import React, {
    Component, useEffect, useState,
} from 'react';
import { Link } from 'react-router';
import AltContainer from 'alt-container';
import { Trans, withNamespaces } from 'react-i18next';
import ability from 'Components/permissions/ability';
import MenuActions from '../../actions/MenuActions';
import MenuStore from '../../stores/MenuStore';
import LoginStore from '../../stores/LoginStore';
import ConfigActions from '../../actions/ConfigActions';
import RightSideBar from './RightSideBar';

const createMenu = () => {
    const entriesLocal = [];
    if (ability.can('viewer', 'device-manager-devices') || ability.can('modifier', 'device-manager-devices')) {
        entriesLocal.push({
            image: 'chip',
            target: '/device',
            iconClass: 'material-icons mi-ic-memory',
            label: <Trans i18nKey="menu:devices.text" />,
            desc: <Trans i18nKey="menu:devices.alt" />,
            children: [
                {
                    target: '/device/list',
                    iconClass: '',
                    label: 'device',
                    title: 'Devices list',
                    siblings: ['/device/id', '/device/new'],
                },
                {
                    target: '/alarm?q=device',
                    iconClass: '',
                    label: 'alarm',
                    title: 'Alarms list',
                },
            ],
        });
    }

    if (ability.can('viewer', 'device-manager-template') || ability.can('modifier', 'device-manager-template')) {
        entriesLocal.push({
            image: 'template',
            target: '/template/list',
            iconClass: 'fa fa-cubes',
            label: <Trans i18nKey="menu:templates.text" />,
            desc: <Trans i18nKey="menu:templates.alt" />,
        });
    }

    if (ability.can('viewer', 'flows') || ability.can('modifier', 'flows')) {
        entriesLocal.push({
            image: 'graph',
            target: '/flows',
            iconClass: 'material-icons mi-device-hub',
            label: <Trans i18nKey="menu:flows.text" />,
            desc: <Trans i18nKey="menu:flows.alt" />,
        });
    }

    if (ability.can('viewer', 'history')) {
        entriesLocal.push({
            image: 'bell',
            target: '/notifications',
            iconClass: 'fa fa-unlock-alt',
            label: <Trans i18nKey="menu:notifications.text" />,
            desc: <Trans i18nKey="menu:notifications.alt" />,
        });
    }
    return entriesLocal;
}


class Navbar extends Component {
    // TODO: header widgets should be received as children to this (Navbar) node
    constructor(props) {
        super(props);

        this.state = {
            page: '',
            page_icon: false,
        };
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        const { toggleSidebar } = this.props;
        e.preventDefault();
        toggleSidebar();
    }

    render() {
        const { page, page_icon: pageIcon } = this.state;
        const { user: { name }, open } = this.props;

        return (
            <nav className="nav outer-header">
                <div className="nav-line">
                    <div className="nav-status">
                        <div className="status-item status-icon">
                            {page}
                            {' '}
                            {pageIcon}
                        </div>
                        <div className="status-item user-area">
                            <div
                                className="user-name clickable"
                                tabIndex="0"
                                role="button"
                                onKeyPress={this.handleClick}
                                onClick={this.handleClick}
                            >
                                {name}
                            </div>
                            <div
                                className="clickable"
                                tabIndex="0"
                                role="button"
                                onKeyPress={this.handleClick}
                                onClick={this.handleClick}
                                title="Login details"
                            >
                                {!open && <i className="fa fa-caret-down line-normal center-caret" />}
                                {open && <i className="fa fa-caret-up line-normal center-caret" />}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }
}
Navbar.defaultProps = {
    user: {},
}

Navbar.propTypes = {
    open: PropTypes.bool.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    user: PropTypes.shape({
        username: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
        tenant: PropTypes.string,
    }),
}

function SidebarItem(props) {
    let isActive = false;
    const { router: { location: { pathname } }, item, open } = props;
    const { target, image, label, desc } = item;

    if (pathname !== target) {
        if (pathname === '/') {
            if (target === '/device') {
                isActive = true;
            }
        }
    } else isActive = true;

    if (!isActive && ('children' in item)) {
        item.children.forEach((child) => {
            let inner = false;
            if (child.hasOwnProperty('siblings')) {
                child.siblings.forEach((sibling) => {
                    inner = inner || pathname.startsWith(sibling);
                });
            }
            isActive = isActive || (pathname === child.target) || inner;
        });
    }

    const entryClass = `nav-link${isActive ? ' active' : ''}`;

    if (open) {
        return (
            <li className="nav-item">
                <Link to={target} className={entryClass} activeClassName="active" tabIndex="-1">
                    <div className="nav-icon">
                        <div className={`icon-${image} icon-prop`} />
                    </div>
                    <div className="nav-title">{label}</div>
                    <div className="nav-desc">{desc}</div>
                </Link>
            </li>
        );
    }
    return (
        <li className="nav-item">
            <Link to={target} className={entryClass} activeClassName="active" tabIndex="-1">
                <div className="nav-icon">
                    <div className={`icon-${image} icon-prop`} />
                </div>
            </Link>
        </li>
    );
}

SidebarItem.defaultProps = {
    item: [],
    open: false,
}

SidebarItem.propTypes = {
    item: PropTypes.arrayOf({
        children: PropTypes.shape({}),
        desc: PropTypes.shape({}),
        image: PropTypes.shape({}),
        label: PropTypes.shape({}),
        target: PropTypes.string,
    }),
    router: PropTypes.shape({
        location: PropTypes.shape({
            pathname: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
    open: PropTypes.bool,
}


const width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
class LeftSidebar extends Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        if (width > 800) {
            e.preventDefault();
            MenuActions.toggleLeft();
        }
    }

    render() {
        const entries = createMenu();
        const { router, open } = this.props;
        return (
            <div className="sidebar expand z-depth-4" tabIndex="-1">
                <div className="header">
                    {open
                        && (
                            <div className="logo-n-bars">
                                <img alt="menu" className="logo" src="images/logo-bl.png" />
                                <div
                                    role="button"
                                    className="bars action waves-effect waves-light"
                                    tabIndex="0"
                                    onKeyPress={this.handleClick}
                                    onClick={this.handleClick}
                                >
                                    <img alt="" className="img-bars" src="images/menu.png" />
                                </div>
                            </div>
                        )}
                    {!open
                        && (
                            <div className="logo-n-bars">
                                <img alt="menu" className="closed-logo" src="images/logo-bl.png" />
                                <div
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={this.handleClick}
                                    className={`bars action waves-effect waves-light ${(width > 800) ? '' : 'hidden'} `}
                                    onClick={this.handleClick}
                                >
                                    <img alt="" className="img-bars" src="images/menu.png" />
                                </div>
                            </div>
                        )}
                </div>

                <nav className="sidebar-nav line-normal">
                    <ul className="nav">
                        {entries.map(item => <SidebarItem item={item} key={Math.random()} open={open} router={router} />)}
                    </ul>
                </nav>
            </div>
        );
    }
}

LeftSidebar.propTypes = {
    open: PropTypes.bool.isRequired,
    router: PropTypes.shape({}).isRequired,
}


const Content = ({ leftSideBar: { open }, router, children }) => (
    <div className={`app-body full-height ${(open && width > 800) ? ' open' : ' closed'}`}>
        <AltContainer store={LoginStore}>
            <LeftSidebar open={open} router={router} />
        </AltContainer>
        <div className="content expand relative">
            {children}
        </div>
    </div>
)

Content.defaultProps = {
    leftSideBar: true,
}

Content.propTypes = {
    leftSideBar: PropTypes.bool,
    children: PropTypes.shape({}).isRequired,
    router: PropTypes.shape({}).isRequired,
}


const Full = ({ t, router, children }) => {
    const [isOpenedUserSidebar, setIsOpenedUserSidebar] = useState(false);

    const toggleUserSidebar = () => {
        setIsOpenedUserSidebar(!isOpenedUserSidebar);
    };

    useEffect(() => {
        ConfigActions.fetchCurrentConfig.defer(true);
    }, []);


    return (
        <div className="full-height overflow-x-hidden">
            <AltContainer store={LoginStore}>
                {
                    (isOpenedUserSidebar)
                        ? (
                            <RightSideBar
                                toggleSidebar={toggleUserSidebar}
                                t={t}
                            />
                        )
                        : <div />
                }
                <Navbar
                    toggleSidebar={toggleUserSidebar}
                    open={isOpenedUserSidebar}
                />
            </AltContainer>
            <AltContainer store={MenuStore}>
                <Content router={router}>
                    {children}
                </Content>
            </AltContainer>
        </div>
    );
};

Full.propTypes = {
    children: PropTypes.shape({}).isRequired,
    router: PropTypes.shape({}).isRequired,
    t: PropTypes.func.isRequired,
}


export default withNamespaces()(Full);
