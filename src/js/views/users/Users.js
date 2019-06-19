/* eslint-disable */
import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import AltContainer from 'alt-container';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { NewPageHeader } from '../../containers/full/PageHeader';
import {
    Trans,  withNamespaces
} from 'react-i18next';
import MaterialSelect from '../../components/MaterialSelect';
import LoginStore from '../../stores/LoginStore';
import UserActions from '../../actions/UserActions';
import GroupActions from '../../actions/GroupActions';
import toaster from '../../comms/util/materialize';
import { RemoveModal } from '../../components/Modal';
import UserStore from '../../stores/UserStore';
import { DojotBtnLink } from '../../components/DojotButton';
import ability from 'Components/permissions/ability';
import Can from '../../components/permissions/Can';
import SideBarRight from 'Views/groups/SideBarRight';

class SideBar extends Component {
    constructor() {
        super();
        this.state = {
            user: {
                name: '',
                username: '',
                email: '',
                confirmEmail: '',
                profile: '',
                service: ''
            },
            show_modal: false,
            confirmEmail: '',
            isInvalid: {
                username: false,
                name: false,
                email: false,
                confirmEmail: false,
            },
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleCreate = this.handleCreate.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.loadUsers = this.loadUsers.bind(this);
        this.checkValidation = this.checkValidation.bind(this);
        this.hideSideBar = this.hideSideBar.bind(this);
        this.formUser = this.formUser.bind(this);
        this.setModal = this.setModal.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.fieldValidation = this.fieldValidation.bind(this);
    }

    componentDidMount() {
        this.loadUsers();
    }

    static getDerivedStateFromProps(props, state) {
        if (props.user !== state.user) {
            return {
                user: props.user,
                isInvalid: {
                    username: false,
                    name: false,
                    email: false,
                    confirmEmail: false
                }
            };
        }
        // Return null to indicate no change to state.
        return null;
    }

    loadUsers() {
        UserActions.fetchUsers.defer();
    }

    checkValidation() {
        const { t } = this.props;
        if (this.checkUsername(this.state.user.username)) {
            toaster.warning(t('users:username.error'));
            return false;
        }

        if (this.checkName(this.state.user.name.trim())) {
            toaster.warning(t('users:name.error'));
            return false;
        }
        if (this.checkEmail(this.state.user.email)) {
            toaster.warning(t('users:email.error'));
            return false;
        }

        if (this.checkConfirmEmail(this.state.user.email, this.state.user.confirmEmail)) {
            toaster.warning(t('users:confirm_email.error'));
            return false;
        }

        if (this.state.user.profile === '') {
            toaster.warning(t('users:profile.error'));
            return false;
        }
        return true;
    }

    handleChange(event) {
        const target = event.target;
        const user = this.state.user;
        user[target.name] = target.value;
        this.fieldValidation(user, target.name);
    }

    handleSave() {
        const tmp = JSON.parse(JSON.stringify(this.state.user));
        delete tmp.created_by;
        delete tmp.created_date;
        delete tmp.passwd;
        delete tmp.password;
        const { t } = this.props;
        if (this.checkValidation()) {
            UserActions.triggerUpdate(
                tmp,
                () => {
                    toaster.success(t('users:alerts.user_update'));
                    this.hideSideBar();
                },
                () => {
                    toaster.error(t('users:alerts.user_update_err'));
                },
            );
        }
    }

    handleCreate() {
        if (this.checkValidation()) {
            const { userTenant } = this.props;
            const temp = this.state.user;
            temp.service = userTenant;
            temp.email = String(temp.email)
                .toLowerCase();
            const { t } = this.props;
            UserActions.addUser(
                temp,
                () => {
                    toaster.success(t('users:alerts.user_create'));
                    this.hideSideBar();
                },
                (user) => {
                    this.formUser(user);
                },
            );
        }
    }


    formUser(user) {
        this.props.formUser(user);
    }

    hideSideBar() {
        this.props.formUser({
            name: '',
            username: '',
            email: '',
            confirmEmail: '',
            profile: '',
            service: ''
        });
        this.props.hide();
        this.loadUsers();
    }


    handleDelete() {
        this.setState({ show_modal: true });
    }

    setModal(status) {
        this.setState({ show_modal: status });
    }

    removeUser() {
        const { t } = this.props;
        UserActions.triggerRemoval(this.state.user, () => {
            this.hideSideBar();
            toaster.success(t('users:alerts.user_remove'), 4000);
            this.setState({ show_modal: false });
        });
    }

    checkName(name) {
        const regex = /^([ \u00c0-\u01ffa-zA-Z'\-])+$/;
        return !regex.test(name);
    }

    checkUsername(username) {
        const regex = /^([a-z0-9_])+$/;
        return !regex.test(username);
    }

    checkEmail(email) {
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return !regex.test(String(email)
            .toLocaleLowerCase());
    }

    checkConfirmEmail(email, confirmEmail) {
        return (email !== confirmEmail);
    }

    fieldValidation(user, field) {
        const tmpState = JSON.parse(JSON.stringify(this.state));
        tmpState.user = user;

        if (field === 'name') {
            tmpState.isInvalid.name = this.checkName(user[field]);
        } else if (field === 'username') {
            tmpState.isInvalid.username = this.checkUsername(user[field]);
        } else if (field === 'email' || field === 'confirmEmail') {
            if (field === 'email') tmpState.isInvalid.email = this.checkEmail(String(user[field]));
            tmpState.isInvalid.confirmEmail = this.checkConfirmEmail(user.email, user.confirmEmail);
        }
        this.setState(tmpState);
    }

    render() {
        let myContent;
        const cannotEdit = !ability.can('modifier', 'user');
        const { t } = this.props;

        const buttonsFooter = [
            {
                label: t('common:discard.label'),
                click: this.hideSideBar,
                type: 'secondary',
            },
        ];

        if (!cannotEdit) {
            if (this.props.edit &&  this.state.user.username !== 'admin') {
                buttonsFooter.push({
                    label: t('common:remove.label'),
                    click: this.handleDelete,
                    type: 'secondary',
                });
            }
            if (this.props.edit)
            {
                buttonsFooter.push({
                    label: t('common:save.label'),
                    click: this.handleSave,
                    color: 'red',
                    type: 'primary',
            });}
            else    
            {
                buttonsFooter.push({
                label: t('common:save.label'),
                click: this.handleCreate,
                color: 'red',
                type: 'primary',
            });}
        }


        if (this.props.visible) {
            myContent = (
                    <Fragment>
                    <div className="pl20 pr20">
                        <div id="auth-name" className="input-field icon-space">
                            <input
                                id="userName46465"
                                value={this.state.user.username}
                                name="username"
                                disabled={this.props.edit || cannotEdit}
                                onChange={this.handleChange}
                                style={{ fontSize: '16px' }}
                                className={
                                    `validate${this.state.isInvalid.username ? ' invalid' : ''}`
                                }
                                maxLength="40"
                            />
                            <label
                                htmlFor="userName"
                                data-error={t('users:username.error')}
                                className="active"
                            >
                                {t('users:username.label')}
                            </label>
                        </div>
                        <div id="auth-usr" className="input-field">
                            <input
                                id="name"
                                value={this.state.user.name}
                                name="name"
                                onChange={this.handleChange}
                                style={{ fontSize: '16px' }}
                                className={
                                    `validate${this.state.isInvalid.name ? ' invalid' : ''}`
                                }
                                maxLength="40"
                                disabled={cannotEdit}
                            />
                            <label
                                htmlFor="name"
                                data-error={t('users:name.error')}
                                className="active"
                            >
                                {t('users:name.label')}
                            </label>
                        </div>
                        <div id="auth-email" className="input-field">
                            <input
                                id="email"
                                value={this.state.user.email}
                                name="email"
                                onChange={this.handleChange}
                                style={{ fontSize: '16px' }}
                                className={
                                    `validate${this.state.isInvalid.email ? ' invalid' : ''}`
                                }
                                maxLength="40"
                                disabled={cannotEdit}
                            />
                            <label
                                htmlFor="email"
                                data-error={t('users:email.error')}
                                className="active"
                            >
                                {t('users:email.label')}
                            </label>
                        </div>
                        <div id="auth-confirm" className="input-field">
                            <input
                                id="confirm-email"
                                value={this.state.user.confirmEmail}
                                name="confirmEmail"
                                onChange={this.handleChange}
                                style={{ fontSize: '16px' }}
                                className={
                                    `validate${
                                        this.state.isInvalid.confirmEmail ? ' invalid' : ''}`
                                }
                                maxLength="40"
                                disabled={cannotEdit}
                            />
                            <label
                                htmlFor="confirm-email"
                                data-error={t('users:confirm_email.error')}
                                className="active"
                            >
                                {t('users:confirm_email.label')}
                            </label>
                        </div>
                        <div>
                            <label htmlFor="profile">{t('users:profile.label')}</label>
                        </div>

                        <div id="auth-select-role" className="input-field">
                            <MaterialSelect
                                id="flr_profiles"
                                name="profile"
                                value={this.state.user.profile}
                                onChange={this.handleChange}
                                isDisable={cannotEdit || this.props.edit || this.state.user.username === 'admin'}
                            >
                                <option value="" disabled>
                                    {t('users:profile.alt')}
                                </option>
                                {this.props.groups.map(obj => (
                                    <option value={obj.name} id={obj.name + '-option'}
                                            key={obj.name + '-option'}>
                                        {obj.name}
                                    </option>
                                ))}
                            </MaterialSelect>
                        </div>
                    </div>
                    </Fragment>);
        }
        return (
            <ReactCSSTransitionGroup
                transitionName="sidebar"
                transitionAppear
                transitionAppearTimeout={500}
                transitionEnterTimeout={500}
                transitionLeaveTimeout={500}
            >
               { this.props.visible ? (
                <SideBarRight
                    icon="user"
                    title={this.props.edit ? t('users:title_sidebar.edit')
                        : t('users:title_sidebar.new')}
                    content={myContent}
                    headerColor={'bg-gradient-light-blue'}
                    visible
                    buttonsFooter={buttonsFooter}
                />
                ) : null}
                {this.state.show_modal ? (
                    <RemoveModal
                        name={t('users:user')}
                        remove={this.removeUser}
                        openModal={this.setModal}
                    />
                ) : (
                    <div/>
                )}
            </ReactCSSTransitionGroup>
        );
    }
}

function SummaryItem(props) {
    return (
        <div className="card-size card-hover lst-entry-wrapper z-depth-2 mg0px pointer">
            <div className="lst-entry-title col s12 bg-gradient-light-blue">
                <img className="title-icon" src="images/generic-user-icon.png"/>
                <div className="title-text truncate" title={props.user.name}>
                    <span className="text">
                        {props.user.name}
                    </span>
                </div>
            </div>
            <div className="attr-list">
                <div className="attr-area light-background">
                    <div className="attr-row">
                        <div className="icon">
                            <img src="images/usr-icon.png"/>
                        </div>
                        <div className="user-card attr-content" title={props.user.username}>
                            <input className="truncate" type="text" value={props.user.username}
                                   disabled/>
                            <span>
                                <Trans i18nKey="users:username.label"/>
                            </span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon">
                            <img src="images/email-icon.png"/>
                        </div>
                        <div className="user-card attr-content" title={props.user.email}>
                            <input className="truncate" type="text" value={props.user.email}
                                   disabled/>
                            <span>
                                <Trans i18nKey="users:email.label"/>
                            </span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon">
                            <img src="images/profile-icon.png"/>
                        </div>
                        <div className="user-card attr-content">
                            <input
                                className="truncate"
                                type="text"
                                value={props.user.profile}
                                disabled
                            />
                            <span>
                                <Trans i18nKey="users:profile.label"/>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

class ListItem extends Component {
    constructor(props) {
        super(props);
        this.handleDetail = this.handleDetail.bind(this);
    }

    handleDetail(e) {
        e.preventDefault();
        this.props.editUser(this.props.user);
    }

    render() {
        const active = (this.props.user.id === this.props.detail);
        return (
            <div className="mg20px fl flex-order-2" id={this.props.user.id}
                 onClick={this.handleDetail}>
                <SummaryItem user={this.props.user} isActive={active}/>
            </div>
        );
    }
}


class RemoveDialog extends Component {
    constructor(props) {
        super(props);

        this.dismiss = this.dismiss.bind(this);
        this.remove = this.remove.bind(this);
    }

    componentDidMount() {
        // materialize jquery makes me sad
        const modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement)
            .ready(() => {
                $('.modal')
                    .modal();
            });
    }

    dismiss(event) {
        event.preventDefault();
        const modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement)
            .modal('close');
    }

    remove(event) {
        event.preventDefault();
        const modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement)
            .modal('close');
        this.props.callback(event);
    }

    render() {
        return (
            <div className="modal" id={this.props.target} ref="modal">
                <div className="modal-content full">
                    <div className="row center background-info">
                        <div><i className="fa fa-exclamation-triangle fa-4x"/></div>
                        <div><Trans i18nKey="users:alerts.qst_remove"/></div>
                        <div><Trans i18nKey="users:alerts.qst_confirm_remove"/></div>
                    </div>
                </div>
                <div className="modal-footer right">
                    <button
                        type="button"
                        className="btn-flat btn-ciano waves-effect waves-light"
                        onClick={this.dismiss}
                    >
                        <Trans i18nKey="discard.label"/>
                    </button>
                    <button
                        type="submit"
                        className="btn-flat btn-red waves-effect waves-light"
                        onClick={this.remove}
                    >
                        <Trans i18nKey="remove.label"/>
                    </button>
                </div>
            </div>
        );
    }
}

class UserList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            create: false,
            edit: false,
            user: {
                name: '',
                username: '',
                email: '',
                confirmEmail: '',
                profile: '',
                service: ''
            }
        };

        this.editUser = this.editUser.bind(this);
        this.createUser = this.createUser.bind(this);
        this.hideSideBar = this.hideSideBar.bind(this);
        this.formUser = this.formUser.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.createUser && !state.create) {
            return {
                create: true,
                edit: false,
                user: {
                    name: '',
                    username: '',
                    email: '',
                    confirmEmail: '',
                    profile: '',
                    service: ''
                }
            };
        }
        // Return null to indicate no change to state.
        return null;
    }

    formUser(user) {
        let temp = this.state;
        temp.create = true;
        temp.edit = false;
        temp.user = user;
        this.setState(temp);

    }

    editUser(user) {
        const temp = this.state;
        temp.user = user;
        temp.user.confirmEmail = user.email;
        temp.create = false;
        temp.edit = true;
        this.setState(temp);
        this.props.visibility(true, 'edit');
    }

    createUser() {
        const temp = this.state;
        temp.create = true;
        temp.edit = false;
        temp.user = {
            name: '',
            username: '',
            email: '',
            confirmEmail: '',
            profile: '',
            service: '',
        };
        this.setState(temp);
    }

    hideSideBar() {
        this.props.visibility(false, 'hide');
    }

    render() {
        const {t, user : {service}} = this.props;
        return (
                <div className="full-height flex-container pos-relative overflow-x-hidden">
                    <AltContainer store={UserStore}>
                        <SideBar userTenant={service} {...this.state} t={t} hide={this.hideSideBar}
                                visible={this.props.visible}
                                formUser={this.formUser}/>
                    </AltContainer>
                    <RemoveDialog callback={this.deleteUser} target="confirmDiag"/>
                    <div className="col s12 lst-wrapper w100 hei-100-over-scroll flex-container">
                        {this.props.values.map(user => (
                            <ListItem
                                user={user}
                                key={user.id}
                                detail={this.state.detail}
                                editUser={this.editUser}
                            />
                        ))}
                </div>
            </div>
        );
    }
}

function UserFilter(props) {
    const filter = props.filter;

    // parse the given field, searching for special selectors on the form <field name>:<value>
    const tokens = filter.match(/([a-z]+)\W*:\W*(\w+)\W*/g);
    let parsed;
    if (tokens !== null) {
        parsed = tokens.map((t) => {
            const k = t.match(/([a-z]+)\W*:\W*(\w+)\W*/);
            if (k !== null) {
                return {
                    id: k[1],
                    val: k[2].toLowerCase()
                };
            }
            return null;
        });
    }

    // does the actual filtering
    const filteredList = props.users.filter((e) => {
        if (tokens !== undefined && parsed !== undefined) {
            let match = true;
            for (let i = 0; i < parsed.length; i++) {
                if (e.hasOwnProperty(parsed[i].id)) {
                    // all special selectors must match.
                    match = match && e[parsed[i].id].toLowerCase()
                        .includes(parsed[i].val);
                }
            }
            return match;
        }
        // if no special selector was found in the search box, use the whole search term to compare
        // to selected user fields.
        return (
            e.name.toLowerCase()
                .includes(filter)
            || e.name.includes(filter)
            || e.username.toLowerCase()
                .includes(filter)
            || e.email.toLowerCase()
                .includes(filter)
            || e.profile.toLowerCase()
                .includes(filter)
        );
    });


    return (
        <UserList values={filteredList} {...props} />
    );
}

class UsersContent extends Component {
    constructor() {
        super();
        this.state = {
            filter: '',
            createUser: false,
            visible: false
        };
        this.filterChange = this.filterChange.bind(this);
        this.newUser = this.newUser.bind(this);
        this.visibility = this.visibility.bind(this);
    }

    // Uses Users' internal state as store for the filter field. No sync issues since the
    // rendering of the affected view is done on the lower order compoenent (UserFilter).
    filterChange(e) {
        this.setState({ filter: e });
    }

    newUser() {
        const tmp = this.state;
        tmp.createUser = true;
        this.setState(tmp);
        this.visibility(true, 'new');
    }

    visibility(bool, operation) {
        const tmp = this.state;
        if (operation !== 'new') tmp.createUser = false;
        tmp.visible = bool;
        this.setState(tmp);
    }

    componentDidMount() {
        UserActions.fetchUsers.defer();
        GroupActions.fetchGroups.defer();
    }

    render() {
        const { t } = this.props;
        return (
            <div className="full-device-area">
                <AltContainer store={UserStore}>
                    <NewPageHeader title={t('users:title')} subtitle={t('users:title')}
                                    icon='user'>
                    <OperationsHeader newUser={this.newUser} {...this.props}/>
                    </NewPageHeader>
                    <UserFilter filter={this.state.filter} {...this.state} {...this.props}
                                visibility={this.visibility}/>
                </AltContainer>
            </div>
        );

    }
}


class Users extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <AltContainer store={LoginStore}>
                <UsersContent {...this.props}/>
            </AltContainer>
        );
    }
}


function OperationsHeader(props) {
    const { t } = props;
    return (
        <div className="col s12 pull-right pt10">
            <Can do="modifier" on="user">
                <DojotBtnLink
                    responsive="true"
                    onClick={props.newUser}
                    label={t('users:header_btn_new.label')}
                    alt={t('users:header_btn_new.alt')}
                    icon="fa fa-plus"
                    className="w130px"
                />
            </Can>
        </div>

    );
}

export default withNamespaces()(Users);
