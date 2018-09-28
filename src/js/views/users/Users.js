/* eslint-disable */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import AltContainer from 'alt-container';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { NewPageHeader } from '../../containers/full/PageHeader';
import { SimpleFilter } from '../utils/Manipulation';
import MaterialSelect from '../../components/MaterialSelect';
import AutheticationFailed from '../../components/AuthenticationFailed';
import LoginStore from '../../stores/LoginStore';
import UserActions from '../../actions/UserActions';
import toaster from '../../comms/util/materialize';
import { RemoveModal } from '../../components/Modal';
import UserStore from '../../stores/UserStore';
import { DojotBtnLink } from '../../components/DojotButton';


class SideBar extends Component {
  constructor() {
    super();
    this.state = {
      user:  {
        name: '',
        username: '',
        email: '',
        confirmEmail: '',
        profile: '',
        service: 'admin'
      },
      show_modal: false,
      confirmEmail: "",
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
      return { user: props.user,
               isInvalid : { username: false,
                             name: false,
                             email: false,
                             confirmEmail: false } };
    }
    // Return null to indicate no change to state.
    return null;
  }

  loadUsers() {
    //if (this.props.user.profile === 'admin') {
      UserActions.fetchUsers.defer();
    //}
  }

  checkValidation() {
    if (this.checkName(this.state.user.name)) {
      toaster.warning('Invalid name.');
      return false;
    }
    if (this.checkEmail(this.state.user.email)) {
      toaster.warning('Invalid email.');
      return false;
    }

    if (this.checkUsername(this.state.user.username)) {
      toaster.warning('Invalid username.');
      return false;
    }

    if (this.checkConfirmEmail(this.state.user.email, this.state.user.confirmEmail)) {
      toaster.warning('Email address mismatch.');
      return false;
    }

    if (this.state.user.profile === '') {
      toaster.warning('Missing profile.');
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
    if (this.checkValidation()) {
      UserActions.triggerUpdate(
        tmp,
        () => {
          toaster.success('User updated.');
          this.hideSideBar();
        },
        () => {
          toaster.error('Failed to update user.');
        },
      );
    }
  }

  handleCreate() {
    if (this.checkValidation()) {
      const temp = this.state.user;
      temp.email = String(temp.email).toLowerCase();
      console.log('User to be created: ', temp);
      UserActions.addUser(
        temp,
        () => {
          toaster.success('User created.');
          this.hideSideBar();
        },
        (user) => {
          this.formUser(user);
        },
      )}
    }


  formUser(user) {
    this.props.formUser(user);
  }

  hideSideBar() {
    this.props.formUser({ name: '',
                          username: '',
                          email: '',
                          confirmEmail: '',
                          profile: '',
                          service: 'admin' });
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
        UserActions.triggerRemoval(this.state.user, () => {
            this.hideSideBar();
            toaster.success('User removed', 4000);
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
        return !regex.test(String(email).toLocaleLowerCase());
    }

    checkConfirmEmail(email, confirmEmail) {
        return !(email === confirmEmail);
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
        let sideBar;
        if (this.props.visible) {
            sideBar = (
                <div id="sidebar" className="sidebar-auth visible">
                    <div
                        id="auth-title"
                        className={`title${this.props.edit ? ' ' : ' hide'}`}
                    >
                        <span id="title-text" className="title-text">
              Edit User
                        </span>
                    </div>
                    <div
                        id="auth-title"
                        className={`title${this.props.edit ? ' hide' : ''}`}
                    >
                        <span id="title-text" className="title-text">
              New User
                        </span>
                    </div>
                    <div className="fixed-height">
                        <div id="auth-icon" className="user-icon">
                            <img src="images/generic-user-icon.png" />
                        </div>
                        <div id="auth-name" className="input-field icon-space">
                            <input
                                id="userName46465"
                                value={this.state.user.username}
                                name="username"
                                disabled={this.props.edit}
                                onChange={this.handleChange}
                                style={{ fontSize: '16px' }}
                                className={
                                    `validate${this.state.isInvalid.username ? ' invalid' : ''}`
                                }
                                maxLength="40"
                            />
                            <label
                                htmlFor="userName"
                                data-error="Please use only letters (a-z) and numbers (0-9)"
                                className="active"
                            >
                User Name
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
                            />
                            <label
                                htmlFor="name"
                                data-error="Invalid name"
                                className="active"
                            >
                Name
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
                            />
                            <label
                                htmlFor="email"
                                data-error="Please enter a valid email address."
                                className="active"
                            >
                Email
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
                            />
                            <label
                                htmlFor="confirm-email"
                                data-error="Email address mismatch"
                                className="active"
                            >
                Confirm Email
                            </label>
                        </div>
                        <div>
                            <label htmlFor="profile">Profile</label>
                        </div>

                        <div id="auth-select-role" className="input-field">
                            <MaterialSelect
                                id="flr_profiles"
                                name="profile"
                                value={this.state.user.profile}
                                onChange={this.handleChange}
                            >
                                <option value="" disabled>
                  Choose your option
                                </option>
                                <option value="admin" id="adm-option">
                  Administrator
                                </option>
                                <option value="user" id="user-option">
                  User
                                </option>
                            </MaterialSelect>
                        </div>
                    </div>
                    <div
                        id="edit-footer"
                        className={`action-footer${this.props.edit ? '' : ' hide'}`}
                    >
                        <div
                            id="auth-save"
                            className="material-btn center-text-parent center-middle-flex"
                            title="Save Changes"
                            onClick={this.handleSave}
                        >
                            <span className="text center-text-child">save</span>
                        </div>
                        <div
                            id="auth-cancel"
                            className="material-btn center-text-parent center-middle-flex"
                            title="Discard Changes"
                            onClick={this.hideSideBar}
                        >
                            <span className="text center-text-child">discard</span>
                        </div>
                        <div
                            id="auth-delete"
                            className="material-btn center-text-parent center-middle-flex"
                            title="Delete User"
                            onClick={this.handleDelete}
                        >
                            <span className="text center-text-child">delete</span>
                        </div>
                    </div>

                    <div
                        id="create-footer"
                        className={`action-footer${this.props.edit ? ' hide' : ''}`}
                    >
                        <div
                            id="auth-save"
                            className="material-btn center-text-parent center-middle-flex"
                            title="Create a new user"
                            onClick={this.handleCreate}
                        >
                            <span className="text center-text-child">create</span>
                        </div>
                        <div
                            id="auth-cancel"
                            className="material-btn center-text-parent center-middle-flex"
                            title="Discard changes"
                            onClick={this.hideSideBar}
                        >
                            <span className="text center-text-child">discard</span>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <ReactCSSTransitionGroup
                transitionName="sidebar"
                transitionAppear
                transitionAppearTimeout={500}
                transitionEnterTimeout={500}
                transitionLeaveTimeout={500}
            >
                {sideBar}
                {this.state.show_modal ? (
                    <RemoveModal
                        name="user"
                        remove={this.removeUser}
                        openModal={this.setModal}
                    />
                ) : (
                    <div />
                )}
            </ReactCSSTransitionGroup>
        );
    }
}

function SummaryItem(props) {
    return (
        <div className="card-size card-hover lst-entry-wrapper z-depth-2 fullHeight">
            <div className="lst-entry-title col s12">
                <img className="title-icon" src="images/generic-user-icon.png" />
                <div className="title-text truncate" title={props.user.name}>
                    <span className="text">
                        {' '}
                        {props.user.name}
                        {' '}
                    </span>
                </div>
            </div>
            <div className="attr-list">
                <div className="attr-area light-background">
                    <div className="attr-row">
                        <div className="icon">
                            <img src="images/usr-icon.png" />
                        </div>
                        <div className="user-card attr-content" title={props.user.username}>
                            <input className="truncate" type="text" value={props.user.username} disabled />
                            <span>User Name</span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon">
                            <img src="images/email-icon.png" />
                        </div>
                        <div className="user-card attr-content" title={props.user.email}>
                            <input className="truncate" type="text" value={props.user.email} disabled />
                            <span>Email</span>
                        </div>
                    </div>
                    <div className="attr-row">
                        <div className="icon">
                            <img src="images/profile-icon.png" />
                        </div>
                        <div className="user-card attr-content">
                            <input
                                className="truncate"
                                type="text"
                                value={props.user.profile === 'admin' ? 'Administrator' : 'User'}
                                disabled
                            />
                            <span>Profile</span>
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
            <div className="col s12 no-padding clickable" id={this.props.user.id} onClick={this.handleDetail}>
                <SummaryItem user={this.props.user} isActive={active} />
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
        $(modalElement).ready(() => {
            $('.modal').modal();
        });
    }

    dismiss(event) {
        event.preventDefault();
        const modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement).modal('close');
    }

    remove(event) {
        event.preventDefault();
        const modalElement = ReactDOM.findDOMNode(this.refs.modal);
        $(modalElement).modal('close');
        this.props.callback(event);
    }

    render() {
        return (
            <div className="modal" id={this.props.target} ref="modal">
                <div className="modal-content full">
                    <div className="row center background-info">
                        <div><i className="fa fa-exclamation-triangle fa-4x" /></div>
                        <div>You are about to remove this user.</div>
                        <div>Are you sure?</div>
                    </div>
                </div>
                <div className="modal-footer right">
                    <button
                        type="button"
                        className="btn-flat btn-ciano waves-effect waves-light"
                        onClick={this.dismiss}
                    >
cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-flat btn-red waves-effect waves-light"
                        onClick={this.remove}
                    >
remove
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
              service: 'admin'
            }
        };

        this.editUser = this.editUser.bind(this);
        this.createUser = this.createUser.bind(this);
        this.hideSideBar = this.hideSideBar.bind(this);
        this.formUser = this.formUser.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.createUser && !state.create) {
        return { create: true,
                 edit: false,
                 user: {
                  name: '',
                  username: '',
                  email: '',
                  confirmEmail: '',
                  profile: '',
                  service: 'admin' }
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
            service: 'admin',
        };
        this.setState(temp);
    }

    hideSideBar() {
        this.props.visibility(false, 'hide');
    }

    render() {
        return (
            <div className="fill">
                <SideBar {...this.state} hide={this.hideSideBar} visible={this.props.visible} formUser={this.formUser}/>
                <RemoveDialog callback={this.deleteUser} target="confirmDiag"/>
                <div id="user-wrapper" className="col s12  lst-wrapper scroll-bar">
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
                return { id: k[1], val: k[2].toLowerCase() };
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
                    match = match && e[parsed[i].id].toLowerCase().includes(parsed[i].val);
                }
            }
            return match;
        }
        // if no special selector was found in the search box, use the whole search term to compare
        // to selected user fields.
        return (
            e.name.toLowerCase().includes(filter)
                || e.name.includes(filter)
                || e.username.toLowerCase().includes(filter)
                || e.email.toLowerCase().includes(filter)
                || e.profile.toLowerCase().includes(filter)
        );
    });


    return (
        <UserList values={filteredList} {...props} />
    );
}

class UsersContent extends Component {
    constructor() {
        super();
        this.state = { filter: '', createUser: false, visible: false };
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
        //if (this.props.user.profile === 'admin') {
            UserActions.fetchUsers.defer();
        //}
    }

    render() {
        console.log('entrou até aqui. ');
        if (this.props.user.profile === 'admin') {
            return (
                <span id="userMain">
                    <AltContainer store={UserStore}>
                      <NewPageHeader title="Auth" subtitle="Users" icon='user'>
                        <OperationsHeader newUser={this.newUser}/>
                      </NewPageHeader>
                      <UserFilter filter={this.state.filter} {...this.state} visibility={this.visibility}/>
                    </AltContainer>
                </span>
            );
        }
        return (
            <span id="userMain" className="flex-wrapper">
                <AutheticationFailed />
            </span>
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
                <UsersContent />
            </AltContainer>
        );
    }
}


function OperationsHeader(props) {
    return (
        <div className="col s12 pull-right pt10">
            <DojotBtnLink
                responsive="true"
                onClick={props.newUser}
                label="New User"
                alt="Create a new user"
                icon="fa fa-plus"
                className="w130px"
            />
        </div>

    );
}

export default Users;
