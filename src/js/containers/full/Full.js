/* eslint-disable */
import React, { Component } from 'react';
import { Link, browserHistory } from 'react-router';
import AltContainer from 'alt-container';
import MenuActions from '../../actions/MenuActions';
import { Trans, withNamespaces } from 'react-i18next';
import MenuStore from '../../stores/MenuStore';
import LoginStore from '../../stores/LoginStore';
import LoginActions from '../../actions/LoginActions';
import { ChangePasswordModal } from '../../components/Modal';
import ConfigActions from "../../actions/ConfigActions";
import ImportExportMain from '../../components/importExport/ImportExportMain';
import ability from '../../components/permissions/ability';
import { guiVersion } from '../../config';

class Navbar extends Component {
    // TODO: header widgets should be received as children to this (Navbar) node
    constructor(props) {
        super(props);

        this.state = {
            page: '',
            page_icon: false,
        };
        this.handleClick = this.handleClick.bind(this);
        this.gravatar = `https://www.gravatar.com/avatar/${btoa(this.props.user.username)}?d=identicon`;
    }

    handleClick(e) {
        e.preventDefault();
        this.props.toggleSidebar();
    }

    render() {
        if (this.props.user == undefined) {
            console.error('no active user session');
            return null;
        }

        return (
            <nav className="nav outer-header">
                <div className="nav-line">
                    <div className="nav-status">
                        <div className="status-item status-icon">
                            {this.state.page}
                            {' '}
                            {this.state.page_icon}
                        </div>
                        <div className="status-item user-area">
                            <div className="user-name clickable" onClick={this.handleClick}>{(this.props.user.name ? this.props.user.name : this.props.user.username)}</div>
                            <div className="clickable" onClick={this.handleClick} title="Login details">
                                {this.props.open === false && <i className="fa fa-caret-down line-normal center-caret" />}
                                {this.props.open === true && <i className="fa fa-caret-up line-normal center-caret" />}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }
}

class RightSideBar extends Component {
    constructor(props) {
        super(props);

        this.state = { open_change_password_modal: false };

        this.logout = this.logout.bind(this);
        this.dismiss = this.dismiss.bind(this);
        this.openChangePasswordModal = this.openChangePasswordModal.bind(this);
        this.handleChangePasswordModal = this.handleChangePasswordModal.bind(this);
        this.openImportExportMain = this.openImportExportMain.bind(this);
        this.handleImportExport = this.handleImportExport.bind(this);
    }

    logout(event) {
        event.preventDefault();
        LoginActions.logout();
        browserHistory.push('/');
    }

    dismiss(event) {
        event.preventDefault();
        this.props.toggleSidebar();
    }

    openImportExportMain(status) {
        this.setState({ openImportExportMain: status });
    }

    handleImportExport() {
        this.setState({ openImportExportMain: true });
    }

    openChangePasswordModal(status) {
        this.setState({ open_change_password_modal: status });
    }

    handleChangePasswordModal() {
        this.setState({ open_change_password_modal: true });
    }

    render() {
        if (this.props.user == undefined) {
            console.error('no active user session');
            return null;
        }


        const gravatar = `https://www.gravatar.com/avatar/${btoa(this.props.user.username)}?d=identicon`;
        const { t } = this.props;
        const canSeeImportOrExport = ability.can('modifier', 'import')
            || ability.can('viewer', 'export')
            || ability.can('modifier', 'export');

        return (
            <div className="">
                <div className="rightsidebarchild">
                    <div className="logout-page-header">
                        <div className="col s12 m12">
                            <div className="logout-page-subtitle">{t('text.logged_as')}</div>
                        </div>

                        <div className="col s12 m12">
                            <div className="logout-page-info col s12 truncate">
                                {this.props.user.username}
                            </div>
                        </div>

                        {this.props.user.email != undefined && (
                            <div>
                                <div className="col s12 m12">
                                    <div className="logout-page-subtitle"> {t('email.label')}</div>
                                </div>

                                <div className="col s12 m12">
                                    <div className="logout-page-info truncate">
                                        {this.props.user.email}
                                    </div>
                                </div>
                            </div>                            
                        )}
                        
                        <div className="col s12 m12">
                            <div className="logout-page-subtitle">{t('text.tenant')}</div>
                        </div>

                        <div className="col s12 m12">
                            <div className="logout-page-info col s12 truncate">
                                {this.props.user.service}
                            </div>
                        </div>

                        <div>
                            <div className="col s12 m12">
                                <div className="logout-page-subtitle">{t('text.version')}</div>
                            </div>

                            <div className="col s12 m12">
                                <div className="logout-page-info truncate">
                                    {guiVersion || t('text.not_found')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="horizontal-line" />

                    <div className="logout-page-settings">
                        <div className="logout-page-changePassword col s12 m12" onClick={this.handleChangePasswordModal}>
                            {t('text.change_password')}
                        </div>
                    </div>

                    <div className="horizontal-line" />
                    {canSeeImportOrExport ? (
                        <div className="logout-page-settings">
                            <div className="logout-page-changePassword col s12 m12"
                                 onClick={this.handleImportExport}>
                                {t('text.import_export')}
                            </div>
                        </div>) : <div/>
                    }

                    <div className="horizontal-line" />

                    <div className="logout-page-buttons">
                        <div className="btn-logout" onClick={this.logout}>
                            {t('text.logout')}
                        </div>
                    </div>
                </div>
                {this.state.open_change_password_modal ? <ChangePasswordModal openChangePasswordModal={this.openChangePasswordModal} toggleSidebar={this.props.toggleSidebar} /> : <div />}
                {this.state.openImportExportMain ?
                    <ImportExportMain
                    type='main'
                    openModal={this.openImportExportMain}
                    toggleSidebar={this.props.toggleSidebar}/>
                 : <div />
                }
            </div>
        );
    }
}

function SidebarItem(props) {
    let isActive = false;

    if (props.router.location.pathname !== props.item.target) {
        if (props.router.location.pathname === '/') {
            if (props.item.target === '/device') {
                isActive = true;
            }
        }
    } else isActive = true;

    if (!isActive && ('children' in props.item)) {
        props.item.children.map((child) => {
            let inner = false;
            if (child.hasOwnProperty('siblings')) {
                child.siblings.map((sibling) => {
                    inner = inner || props.router.location.pathname.startsWith(sibling);
                });
            }
            isActive = isActive || (props.router.location.pathname === child.target) || inner;
        });
    }

    const entryClass = `nav-link${isActive ? ' active' : ''}`;

    if (props.open) {
        return (
            <li className="nav-item">
                <Link to={props.item.target} className={entryClass} activeClassName="active" tabIndex="-1">
                    <div className="nav-icon">
                        <div className={`icon-${props.item.image} icon-prop`} />
                    </div>
                    <div className="nav-title">{props.item.label}</div>
                    <div className="nav-desc">{props.item.desc}</div>
                </Link>
            </li>
        );
    }
    return (
        <li className="nav-item">
            <Link to={props.item.target} className={entryClass} activeClassName="active" tabIndex="-1">
                <div className="nav-icon">
                    <div className={`icon-${props.item.image} icon-prop`} />
                </div>
            </Link>
        </li>
    );
}
const width =
window.innerWidth ||
document.documentElement.clientWidth ||
document.body.clientWidth;
class LeftSidebar extends Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {

        if(width > 800){
            e.preventDefault();
            MenuActions.toggleLeft();
        }else{
            return
        }

    }
    componentDidUpdate(){
        LeftSidebar.createMenu();
    }

    componentDidMount(){
        LeftSidebar.createMenu();
    }

    static createMenu() {
        const entriesLocal = [];
        if (ability.can('viewer', 'device') || ability.can( 'modifier', 'device')) {
            entriesLocal.push({
                image: 'chip',
                target: '/device',
                iconClass: 'material-icons mi-ic-memory',
                label: <Trans i18nKey="menu:devices.text"/>,
                desc: <Trans i18nKey="menu:devices.alt"/>,
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

        if (ability.can('viewer', 'template') || ability.can( 'modifier', 'template')) {
            entriesLocal.push({
                image: 'template',
                target: '/template/list',
                iconClass: 'fa fa-cubes',
                label: <Trans i18nKey="menu:templates.text"/>,
                desc: <Trans i18nKey="menu:templates.alt"/>,
            });
        }

        if (ability.can('viewer', 'flows') || ability.can( 'modifier', 'flows')) {
            entriesLocal.push({
                image: 'graph',
                target: '/flows',
                iconClass: 'material-icons mi-device-hub',
                label: <Trans i18nKey="menu:flows.text"/>,
                desc: <Trans i18nKey="menu:flows.alt"/>,
            });
        }

        if (ability.can('viewer', 'socketio')) {
            entriesLocal.push({
                image: 'bell',
                target: '/notifications',
                iconClass: 'fa fa-unlock-alt',
                label: <Trans i18nKey="menu:notifications.text"/>,
                desc: <Trans i18nKey="menu:notifications.alt"/>,
            });
        }

        if (ability.can('viewer', 'user') || ability.can( 'modifier', 'user')) {
            entriesLocal.push({
                image: 'user',
                target: '/auth',
                iconClass: 'fa fa-unlock-alt',
                label: <Trans i18nKey="menu:users.text"/>,
                desc: <Trans i18nKey="menu:users.alt"/>,
            });
        }

        if (ability.can( 'viewer', 'permission') || ability.can( 'modifier', 'permission')) {
            entriesLocal.push({
                image: 'groups',
                target: '/groups',
                iconClass: 'fa fa-unlock-alt',
                label: <Trans i18nKey="menu:groups.text"/>,
                desc: <Trans i18nKey="menu:groups.alt"/>,
            });
        }
        return entriesLocal;
    }

    render() {
        const entries= LeftSidebar.createMenu();
        return (
            <div className="sidebar expand z-depth-4" tabIndex="-1">
                <div className="header">
                    {this.props.open
            && (
                <div className="logo-n-bars">
                    <img className="logo" src="images/logo-bl.png" />
                    <div className="bars action waves-effect waves-light" onClick={this.handleClick}>
                        <img className="img-bars" src="images/menu.png" />
                    </div>
                </div>
            )
                    }
                    {!this.props.open
            && (
                <div className="logo-n-bars">
                    <img className="closed-logo" src="images/logo-bl.png" />
                    <div className={`bars action waves-effect waves-light ${(width > 800) ? '' : 'hidden'} `} onClick={this.handleClick}>
                        <img className="img-bars" src="images/menu.png" />
                    </div>
                </div>
            )
                    }
                </div>

                <nav className="sidebar-nav line-normal">
                    <ul className="nav">
                        { entries.map(item => <SidebarItem item={item} key={Math.random()} open={this.props.open} router={this.props.router} />)}
                    </ul>
                </nav>
            </div>
        );
    }
}

function Content(props) {
    return (
        <div className={`app-body full-height ${(props.leftSideBar.open && width > 800) ? ' open' : ' closed'}`}>
            <AltContainer store={LoginStore}>
                <LeftSidebar open={props.leftSideBar.open} router={props.router} />
            </AltContainer>
            <div className="content expand relative">
                {props.children}
            </div>
        </div>
    );
}


function SpanWrapper(props) {
    function renderChildren() {
        return React.Children.map(props.children, child => React.cloneElement(child, props));
    }

    return (
        <span>
            { renderChildren() }
        </span>
    );
}

class Full extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user_sidebar: false,
        };

        this.toggleUserSidebar = this.toggleUserSidebar.bind(this);
    }

    componentDidMount() {
        ConfigActions.fetchCurrentConfig.defer(true);
    }

    toggleUserSidebar() {
        this.setState({ user_sidebar: !this.state.user_sidebar });
    }

    render() {
        return (
            <div className="full-height overflow-x-hidden">
                <AltContainer store={LoginStore}>

                    {
                        (this.state.user_sidebar)
                            ? <RightSideBar toggleSidebar={this.toggleUserSidebar} t={this.props.t}/>
                            : <div />
                    }

                    <Navbar toggleSidebar={this.toggleUserSidebar} open={this.state.user_sidebar} />
                </AltContainer>
                <AltContainer store={MenuStore}>
                    <Content router={this.props.router}>{this.props.children}</Content>
                </AltContainer>
            </div>
        );
    }
}

export default withNamespaces()(Full);
