import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Materialize from 'materialize-css';
import AltContainer from 'alt-container';
import {NewPageHeader} from "../../containers/full/PageHeader";
import Filter from "../utils/Filter";
import MaterialSelect from '../../components/MaterialSelect';
import AutheticationFailed from "../../components/AuthenticationFailed";
import LoginStore from "../../stores/LoginStore";
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import UserActions from '../../actions/UserActions';

let UserStore = require('../../stores/UserStore');

class SideBar extends Component {
    constructor() {
        super();
        this.state = {
            user: {},
            confirmEmail: '',
            isInvalid: {
                username: false,
                name: false,
                email: false,
                confirmEmail: false
            }
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleCreate = this.handleCreate.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.checkValidation = this.checkValidation.bind(this);
        this.hideSideBar = this.hideSideBar.bind(this);
    }

    componentDidMount() {
        if (LoginStore.getState().user.profile === "admin") {
            UserActions.fetchUsers.defer();
        }
    }

    componentWillReceiveProps(next) {
        let context = this.state;
        context.user = JSON.parse(JSON.stringify(next.user));
        if (context.user !== '')
            (context.user.confirmEmail = context.user.email);
        context.isInvalid = {
            username: false,
            name: false,
            email: false,
            confirmEmail: false
        };
        this.setState(context);
    }

    checkValidation() {
        if (this.state.user.profile === "") {
            Materialize.toast("Select a profile", 4000);
            return false;
        }
        return !(this.state.isInvalid.confirmEmail ||
            this.state.isInvalid.email ||
            this.state.isInvalid.name ||
            this.state.isInvalid.username)
    }

    handleChange(event) {
        const target = event.target;
        let state = this.state;
        state.user[target.name] = target.value;
        this.setState(state);
        this.filedValidation(state.user, target.name);
    }

    handleSave() {
        let tmp = JSON.parse(JSON.stringify(this.state.user));
        delete tmp.created_by;
        delete tmp.created_date;
        delete tmp.passwd;
        delete tmp.password;
        console.log(this.checkValidation());
        if (this.checkValidation()) {
            UserActions.triggerUpdate(tmp, () => {
                Materialize.toast("User updated", 4000);
                this.hideSideBar();
            }, () => {
                Materialize.toast("Failed to update user", 4000);
            });

        }
    }

    handleCreate() {
        if (this.checkValidation()) {
            let temp = this.state.user;
            temp.email = String(temp.email).toLowerCase();
            UserActions.addUser(temp, () => {
                Materialize.toast('User created', 4000);
                this.hideSideBar();
            }, () => {
                Materialize.toast("Failed to create user", 4000);
            })
        }
    }

    hideSideBar() {
        this.props.hide();
    }

    handleDelete(event) {
        event.preventDefault();
        this.hideSideBar();
        UserActions.triggerRemoval(this.state.user, () => {
            Materialize.toast('User removed', 4000);
        });

    }


    filedValidation(user, field) {
        let regex;
        let tmpState = JSON.parse(JSON.stringify(this.state));
        if (field === 'name') {
            regex = /^([ \u00c0-\u01ffa-zA-Z'\-])+$/;
            tmpState.isInvalid.name = !regex.test(user[field]);
            this.setState(tmpState);
        } else if (field === 'username') {
            regex = /^([a-z0-9_])+$/;
            tmpState.isInvalid.username = !regex.test(user[field]);
            this.setState(tmpState);
        } else if (field === 'email' || field === 'confirmEmail') {
            regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (field === 'email') tmpState.isInvalid.email = !regex.test(String(user[field]).toLocaleLowerCase());
            tmpState.isInvalid.confirmEmail = !(user['email'] === user['confirmEmail']);
            this.setState(tmpState);
        } else {
        }
    }

    render() {
        let sideBar;
        if (this.props.visible) {
            sideBar =
                <div id={"sidebar"} className={'sidebar-auth' + (this.props.visible ? ' visible' : '')}>
                    <div id={'auth-title'} className={'title' + (this.props.edit ? ' ' : ' hide')}>
                        <span id={'title-text'} className={'title-text'}>Edit User</span>
                    </div>
                    <div id={'auth-title'} className={'title' + (this.props.edit ? ' hide' : '')}>
                        <span id={'title-text'} className={'title-text'}>New User</span>
                    </div>
                    <div id={'auth-icon'} className={'user-icon'}>
                        <img src={'images/generic-user-icon.png'}/>
                    </div>
                    <div id={'auth-name'} className="input-field icon-space">
                        <input id="userName46465" value={this.state.user.username} name="username"
                               disabled={this.props.edit}
                               onChange={this.handleChange} style={{fontSize: '16px'}}
                               className={"validate" + (this.state.isInvalid.username ? ' invalid' : '')} maxLength="40" />
                        <label htmlFor="userName" data-error="Please use only letters (a-z) and numbers (0-9)"
                               className="active">User Name</label>
                    </div>
                    <div id={'auth-usr'} className="input-field">
                        <input id="name" value={this.state.user.name} name="name" onChange={this.handleChange}
                               style={{fontSize: '16px'}}
                               className={"validate" + (this.state.isInvalid.name ? ' invalid' : '')} maxLength="40" />
                        <label htmlFor="name" data-error="Invalid name" className="active">Name</label>
                    </div>
                    <div id={'auth-email'} className="input-field">

                        <input id="email" value={this.state.user.email} name="email" onChange={this.handleChange}
                               style={{fontSize: '16px'}}
                               className={"validate" + (this.state.isInvalid.email ? ' invalid' : '')} maxLength="40" />
                        <label htmlFor="email" data-error="Please enter a valid email address."
                               className="active">Email</label>
                    </div>
                    <div id={'auth-confirm'} className="input-field">
                        <input id="confirm-email" value={this.state.user.confirmEmail} name="confirmEmail"
                               onChange={this.handleChange} style={{fontSize: '16px'}}
                               className={"validate" + (this.state.isInvalid.confirmEmail ? ' invalid' : '')} maxLength="40"/>
                        <label htmlFor="confirm-email" data-error="Email address mismatch" className="active">Confirm
                            Email</label>
                    </div>
                    <div id={'auth-select-role'} className="input-field">
                        <MaterialSelect id="flr_profiles" name="profile" label="Profile"
                                        value={this.state.user.profile}
                                        onChange={this.handleChange}>
                            <option value="" disabled>Choose your option</option>
                            <option value="admin" id={'adm-option'}>Administrator</option>
                            <option value="user" id={'user-option'}>User</option>
                        </MaterialSelect>
                    </div>
                    <div id={'edit-footer'} className={'action-footer' + (this.props.edit ? '' : ' hide')}>
                        <div id={'auth-save'} className={"material-btn center-text-parent center-middle-flex"}
                             title="Edit Attributes" onClick={this.handleSave}>
                            <span className="text center-text-child">save</span>
                        </div>
                        <div id={'auth-cancel'} className={"material-btn center-text-parent center-middle-flex"}
                             title="Edit Attributes" onClick={this.hideSideBar}>
                            <span className="text center-text-child">cancel</span>
                        </div>
                        <div id={'auth-delete'} className={"material-btn center-text-parent center-middle-flex"}
                             title="Edit Attributes" onClick={this.handleDelete}>
                            <span className="text center-text-child">delete</span>
                        </div>
                    </div>

                    <div id={'create-footer'} className={'action-footer' + (this.props.edit ? ' hide' : '')}>
                        <div id={'auth-save'} className={"material-btn center-text-parent center-middle-flex"}
                             title="Create a new user" onClick={this.handleCreate}>
                            <span className="text center-text-child">create</span>
                        </div>
                        <div id={'auth-cancel'} className={"material-btn center-text-parent center-middle-flex"}
                             title="Discard changes" onClick={this.hideSideBar}>
                            <span className="text center-text-child">discard</span>
                        </div>

                    </div>
                </div>
        }
        return (
            <ReactCSSTransitionGroup
                transitionName="sidebar"
                transitionAppear={true} transitionAppearTimeout={500}
                transitionEnterTimeout={500} transitionLeaveTimeout={500}>
                {sideBar}
            </ReactCSSTransitionGroup>
        )
    }
}

function SummaryItem(props) {
    return (
        <div className={"card-size card-hover lst-entry-wrapper z-depth-2 fullHeight"}>
            <div className="lst-entry-title col s12">
                <img className="title-icon" src={"images/generic-user-icon.png"}/>
                <div className="title-text truncate" title={props.user.name}>
                    <span className="text"> {props.user.name} </span>
                </div>
            </div>
            <div className="attr-list">
                <div className={"attr-area light-background"}>
                    <div className="attr-row">
                        <div className="icon">
                            <img src={"images/usr-icon.png"}/>
                        </div>
                        <div className={"user-card attr-content"} title={props.user.username}>
                            <input className="truncate" type="text" value={props.user.username} disabled={true}/>
                            <span>User Name</span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon">
                            <img src={"images/email-icon.png"}/>
                        </div>
                        <div className={"user-card attr-content"} title={props.user.email}>
                            <input className="truncate" type="text" value={props.user.email} disabled={true}/>
                            <span>Email</span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon">
                            <img src={"images/profile-icon.png"}/>
                        </div>
                        <div className={"user-card attr-content"}>
                            <input className="truncate" type="text" value={props.user.profile === 'admin' ? 'Administrator' : 'User'}
                                   disabled={true}/>
                            <span>Profile</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
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
            <div className="col s12 no-padding clickable" id={this.props.user.id} onClick={this.handleDetail}>
                <SummaryItem user={this.props.user} isActive={active}/>
            </div>
        )
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
        let modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement).ready(function () {
            $('.modal').modal();
        })
    }

    dismiss(event) {
        event.preventDefault();
        let modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement).modal('close');
    }

    remove(event) {
        event.preventDefault();
        let modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement).modal('close');
        this.props.callback(event);
    }

    render() {
        return (
            <div className="modal" id={this.props.target} ref="modal">
                <div className="modal-content full">
                    <div className="row center background-info">
                        <div><i className="fa fa-exclamation-triangle fa-4x"/></div>
                        <div>You are about to remove this user.</div>
                        <div>Are you sure?</div>
                    </div>
                </div>
                <div className="modal-footer right">
                    <button type="button" className="btn-flat btn-ciano waves-effect waves-light"
                            onClick={this.dismiss}>cancel
                    </button>
                    <button type="submit" className="btn-flat btn-red waves-effect waves-light"
                            onClick={this.remove}>remove
                    </button>
                </div>
            </div>
        )
    }
}

class UserList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            create: false,
            edit: false,
            user: {}
        };

        this.editUser = this.editUser.bind(this);
        this.createUser = this.createUser.bind(this);
        this.hideSideBar = this.hideSideBar.bind(this);
    }

    componentWillReceiveProps(next) {

        if (next.createUser) {
            this.createUser();
        }
    }

    editUser(user) {
        let temp = this.state;
        temp.user = user;
        temp.create = false;
        temp.edit = true;
        this.setState(temp);
        this.props.visibility(true, 'edit');
    }

    createUser() {
        let temp = this.state;
        temp.create = true;
        temp.edit = false;
        temp.user = {
            name: '',
            username: '',
            email: '',
            profile: '',
            service: 'admin'
        };
        this.setState(temp);
    }

    hideSideBar() {
        this.props.visibility(false, 'hide');
    }

    render() {
        return (
            <div className="fill">
                <SideBar {...this.state} hide={this.hideSideBar} visible={this.props.visible}/>
                <RemoveDialog callback={this.deleteUser} target="confirmDiag"/>
                <div className="col s12  lst-wrapper extra-padding scroll-bar">
                    {this.props.values.map((user) =>
                        <ListItem user={user}
                                  key={user.id}
                                  detail={this.state.detail}
                                  editUser={this.editUser}/>
                    )}
                </div>
            </div>
        )
    }
}

function UserFilter(props) {
    const filter = props.filter;

    // parse the given field, searching for special selectors on the form <field name>:<value>
    const tokens = filter.match(/([a-z]+)\W*:\W*(\w+)\W*/g);
    let parsed = undefined;
    if (tokens !== null) {
        parsed = tokens.map((t) => {
            const k = t.match(/([a-z]+)\W*:\W*(\w+)\W*/);
            if (k !== null) {
                return {id: k[1], val: k[2].toLowerCase()};
            } else {
                return null;
            }
        });
    }

    // does the actual filtering
    const filteredList = props.users.filter(function (e) {
        if (tokens !== undefined && parsed !== undefined) {
            let match = true;
            for (let i = 0; i < parsed.length; i++) {
                if (e.hasOwnProperty(parsed[i].id)) {
                    // all special selectors must match.
                    match = match && e[parsed[i].id].toLowerCase().includes(parsed[i].val)
                }
            }
            return match;
        } else {
            // if no special selector was found in the search box, use the whole search term to compare
            // to selected user fields.
            return (
                e.name.toLowerCase().includes(filter) ||
                e.name.includes(filter) ||
                e.username.toLowerCase().includes(filter) ||
                e.email.toLowerCase().includes(filter) ||
                e.profile.toLowerCase().includes(filter)
            )
        }
    });


    return (
        <UserList values={filteredList} {...props}/>
    )
}

class Users extends Component {
    constructor() {
        super();
        this.state = {filter: '', createUser: false, visible: false};
        this.filterChange = this.filterChange.bind(this);
        this.newUser = this.newUser.bind(this);
        this.visibility = this.visibility.bind(this);
    }

    // Uses Users' internal state as store for the filter field. No sync issues since the
    // rendering of the affected view is done on the lower order compoenent (UserFilter).
    filterChange(e) {
        this.setState({filter: e});
    }

    newUser() {
        let tmp = this.state;
        tmp.createUser = true;
        this.setState(tmp);
        this.visibility(true, 'new');
    }

    visibility(bool, operation) {
        let tmp = this.state;
        if (operation !== 'new') tmp.createUser = false;
        tmp.visible = bool;
        this.setState(tmp);
    }

    componentDidMount() {
        if (LoginStore.getState().user.profile === "admin") {
            UserActions.fetchUsers.defer();
        }
    }

    render() {
        if (LoginStore.getState().user.profile === "admin") {
            return (
                <span id="userMain">
                    <NewPageHeader title="Auth" subtitle="Users" icon='user'>
                    <div className={'pt10'}>
                        <Filter onChange={this.filterChange}/>
                        <div onClick={this.newUser} className="new-btn-flat red waves-effect waves-light"
                             title="Create a new user">
                            New User<i className="fa fa-plus"/>
                        </div>
                    </div>
                    </NewPageHeader>
                    <AltContainer store={UserStore}>
                        <UserFilter filter={this.state.filter} {...this.state} visibility={this.visibility}/>
                    </AltContainer>
                </span>
            )
        } else {
            return (
                <span id="userMain" className="flex-wrapper">
                    <AutheticationFailed/>
                </span>
            );
        }
    }
}

export default Users;
