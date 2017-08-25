import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Dropzone from 'react-dropzone'
import userManager from '../../comms/users/UserManager';

import alt from '../../alt';
import AltContainer from 'alt-container';
var UserStore = require('../../stores/UserStore');
var UserActions = require('../../actions/UserActions');

import { PageHeader } from "../../containers/full/PageHeader";
import Filter from "../utils/Filter";

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import MaterialSelect from "../../components/MaterialSelect";
import MaterialInput from "../../components/MaterialInput";
import AutheticationFailed from "../../components/AuthenticationFailed";
import Paginator from "../../components/Paginator";

import LoginStore from "../../stores/LoginStore";


function SummaryItem(props) {
  const selectedClass = "lst-entry-users " + (props.isActive ? " active" : "");
  const name = ((props.user.name && (props.user.name.length > 0)) ? props.user.name : props.user.username);
  return (
    <div className={selectedClass} title="View details">
     <div className="col hovered">
       <div className="col s12">
          <div className="col s9 title2 truncate">{name}</div>
       </div>
       <div className="col s12 paddingTop10">
          <div className="col s3 openSans8">Service:</div>
          <div className="col s9 text-right subtitle"><label className="badge center-align truncate">{props.user.service}</label></div>
       </div>
     </div>
      <div className="col div-img">
        {/* TODO set a custom image */}
        <img src="images/user.png"/>
      </div>
      <div className="lst-entry-users-title col div-with-img">
        <div className="title truncate">{name}</div>
        <div className="subtitle truncate">{props.user.email}</div>
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
    this.props.detailedUser(this.props.user);
  }

  render() {
    const active = (this.props.user.id == this.props.detail);
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
    $(modalElement).ready(function() {
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
            <div><i className="fa fa-exclamation-triangle fa-4x" /></div>
            <div>You are about to remove this user.</div>
            <div>Are you sure?</div>
          </div>
        </div>
        <div className="modal-footer right">
            <button type="button" className="btn-flat btn-ciano waves-effect waves-light" onClick={this.dismiss}>cancel</button>
            <button type="submit" className="btn-flat btn-red waves-effect waves-light" onClick={this.remove}>remove</button>
        </div>
      </div>
    )
  }
}


class DetailItem extends Component {
  constructor(props) {
    super(props);

    this.handleEdit = this.handleEdit.bind(this);
    this.handleDismiss = this.handleDismiss.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleDismiss(e) {
    e.preventDefault();
    this.props.clearSelection();
  }

  handleEdit(e) {
    e.preventDefault();
    this.props.editUser(this.props.user.id);
  }

  handleRemove(e) {
    e.preventDefault();
    this.props.deleteUser(this.props.user);
  }

  render() {
    return (
      <span>
        <div className="lst-user-detail" >
          <div className="lst-line col s12">
            <div className="col s3">
                <p><img className="photo_big" src="images/user.png"/></p>
            </div>
            <div className="lst-user-title col s6">
              <span>{this.props.user.name}</span>
              <p className="subTitle">ID:<b>{this.props.user.id}</b></p>
            </div>
            <div className="lst-title col s3">
              <div className="edit right inline-actions">
                <a className="btn-floating waves-red right" onClick={this.handleEdit} title="Edit user">
                  <i className="material-icons">mode_edit</i>
                </a>
                <a className="btn-floating waves-red right" onClick={(e) => {e.preventDefault(); $('#confirmDiag').modal('open');}}  title="Remove user">
                  <i className="fa fa-trash" />
                </a>
              </div>
            </div>
          </div>

          <div className="lst-user-line col s12">
            <span className="field">Name</span>
          </div>
          <div className="lst-user-line col s12">
            <span className='value'> {this.props.user.name} </span>
          </div>
          <div className="lst-user-line col s12">
            <span className="field">Email</span>
          </div>
          <div className="lst-user-line col s12 data">
            <span className='value'> {this.props.user.email} </span>
          </div>
          <div className="lst-user-line col s12">
            <span className="field">Username</span>
          </div>
          <div className="lst-user-line col s12 data">
            <span className='value'> {this.props.user.username} </span>
          </div>
          <div className="lst-user-line col s12">
            <span className="field">Service</span>
          </div>
          <div className="lst-user-line col s12 data">
            <span className='value'> {this.props.user.service} </span>
          </div>
          <div className="lst-user-line col s12">
            <span className="field">Profile</span>
          </div>
          <div className="lst-user-line col s12 data">
            <span className="value">{this.props.user.profile}</span>
          </div>
        </div>
      </span>
    )
  }
}

function userDataValidate(field, value, edit) {
  if (edit === undefined || edit === null) { edit = false; }

  // TODO those should come from i18n
  const mandatory = "You can't leave this empty.";
  const alnum = "Please use only letters (a-z), numbers (0-9) and underscores (_).";
  const email = "Please enter a valid email address.";
  let handlers = {
    email: function(value) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (value.length == 0) { return mandatory; }
      return re.test(value) ? undefined : email;
    },
    username: function(value) {
      const re = /^[a-z0-9_]+$/;
      if (value.length == 0) { return mandatory; }
      return re.test(value) ? undefined : alnum;
    },
    passwd: function(value) {
      if (edit == true && value.length == 0) { return undefined; }
      return (value.length == 0) ? mandatory : undefined;
    },
    name: function(value) {
      return (value.length == 0) ? mandatory : undefined;
    },
    profile: function(value) {
      return (value.length == 0) ? mandatory : undefined;
    },
    service: function(value) {
      const re = /^[a-z0-9_]+$/;
      if (value.length == 0) { return mandatory; }
      return re.test(value) ? undefined : alnum;
    }
  }

  if (field in handlers) {
    const result = handlers[field](value);
    return result;
  }

  return undefined;
}

const FormActions = alt.generateActions('set', 'update', 'edit', 'check', 'invalidate');
class FStore {
  constructor() {
    this.user = {};
    this.invalid = {};
    this.edit = false;
    this.bindListeners({
      set: FormActions.SET,
      update: FormActions.UPDATE,
      handleEdit: FormActions.EDIT,
      check: FormActions.CHECK,
      invalidate: FormActions.INVALIDATE,
    });
    this.set(null);
  }

  set(user) {
    if (user === null || user === undefined) {
      this.user = {
        name: "",
        email: "",
        username: "",
        passwd: "",
        service: "",
        profile: "admin"
      };
      // map used to tell whether a field is invalid or not
      this.invalid = {}
    } else {
      this.user = JSON.parse(JSON.stringify(user));
      for (let k in this.user) {
        if (this.user.hasOwnProperty(k)) {
          this.invalid[k] = userDataValidate(k, this.user[k], this.edit);
        }
      }
    }
  }

  check(field) {
    if (this.user.hasOwnProperty(field)){
      this.invalid[field] = userDataValidate(field, this.user[field], this.edit);
    }
  }

  update(diff) {
    this.user[diff.f] = diff.v;
    this.invalid[diff.f] = userDataValidate(diff.f, diff.v, this.edit);
  }

  invalidate(map) {
    this.invalid[map.key] = map.value;
  }

  handleEdit(flag) {
    if (flag === undefined || flag === null) {
      this.edit = false;
    } else {
      this.edit = flag;
    }
  }
}
var FormStore = alt.createStore(FStore, 'FormStore');

class UserForm extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <AltContainer store={FormStore}>
        <UserFormImpl {...this.props} />
      </AltContainer>
    )
  }
}

class UserFormImpl extends Component {
  constructor(props) {
    super(props);
    this.saveUser = this.saveUser.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    Materialize.updateTextFields();
  }

  componentDidUpdate() {
    Materialize.updateTextFields();
  }

  saveUser(e) {
    e.preventDefault();
    let valid = true;
    let user = JSON.parse(JSON.stringify(this.props.user));
    for (let k in user) {
      user[k] = user[k].trim();
      if (userDataValidate(k, user[k], this.props.edit) !== undefined) {
        FormActions.check(k);
        valid = false;
      }
    }

    if (valid) {
      this.props.save(user);
    } else {
      Materialize.toast('Failed to validate user data', 4000);
    }
  }

  handleChange(e) {
    e.preventDefault();
    const f = e.target.name;
    const v = e.target.value;
    FormActions.update({f: f, v: v, e: this.props.edit});
  }

  render() {
    return (
      <span>
        <form onSubmit={this.saveUser}>
          <div className="row">
            <div className="lst-line col s12">
              <div className="col s2">
                <p><img id="imgForm" src="images/user.png"/></p>
              </div>
              <div className="lst-user-title col s10">
                <span>{this.props.title}</span>
                <p className="subTitle"><b>ID:</b>{this.props.user.id}</p>
              </div>
            </div>
          </div>

          <div className="lst-user-detail row" >
            <div className="lst-user-line col s12 input-field">
              <MaterialInput id="fld_name" value={this.props.user.name}
                             error={this.props.invalid['name']}
                             name="name" onChange={this.handleChange}>
                Name
              </MaterialInput>
            </div>
            <div className="lst-user-line col s12 input-field">
              <MaterialInput id="fld_email" value={this.props.user.email}
                             error={this.props.invalid['email']}
                             name="email" onChange={this.handleChange}>
                Email
              </MaterialInput>
            </div>
            <div className="lst-user-line col s12 input-field">
              <MaterialInput id="fld_login" value={this.props.user.username}
                             error={this.props.invalid['username']}
                             name="username" onChange={this.handleChange}>
                Username
              </MaterialInput>
            </div>
            <div className="lst-user-line col s12 input-field">
              <MaterialInput id="fld_passwd" value={this.props.user.passwd}
                             error={this.props.invalid['passwd']} type="password"
                             name="passwd" onChange={this.handleChange}>
                Password
              </MaterialInput>
            </div>
            <div className="lst-user-line col s6 input-field">
              <MaterialInput id="fld_service" value={this.props.user.service}
                             error={this.props.invalid['service']}
                             name="service" onChange={this.handleChange}>
                Service
              </MaterialInput>
            </div>
            <div className="lst-user-line col s6 input-field">
              <MaterialSelect id="flr_profile" name="profile"
                              value={this.props.user.profile}
                              onChange={this.handleChange} >
                <option value="admin">admin</option>
                <option value="user">user</option>
              </MaterialSelect>
              <label htmlFor="fld_profile">Profile type</label>
            </div>
          </div>

          <div className="row right">
            <div className="col">
              <button type="submit" className="waves-light btn waves">
                { this.props.loading ? (
                  <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>
            <div className="col">
              <a onClick={this.props.dismiss} className="waves-light btn waves">Dismiss</a>
            </div>
          </div>
        </form>
      </span>
    )
  }
}

function errorTranslate(error) {
  const messages = [
    // TODO 'to' field should come from i18n
    {from: "email already in use", to: "E-mail already in use", field: 'email'},
    {from: "user already exists", to: "User already exists", field: 'username'}
  ]

  for (let i = 0; i < messages.length; ++i) {
    if (error === messages[i].from) {
      FormActions.invalidate({key: messages[i].field, value: messages[i].to});
      break;
    }
  }
}

class UserList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      detail: undefined,
      edit: undefined,
      create: undefined,
      height: undefined
    };

    this.clearSelection = this.clearSelection.bind(this);
    this.detailedUser = this.detailedUser.bind(this);
    this.editUser = this.editUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.newUser = this.newUser.bind(this);
  }

  clearSelection() {
    let temp = this.state;
    temp.edit = undefined;
    temp.detail = undefined;
    temp.create = undefined;
    this.setState(temp);
    return true;
  }

  detailedUser(user) {
    let temp = this.state;
    temp.detail = user.id;
    FormActions.edit(true);
    FormActions.set(user);
    temp.user = user;
    temp.create = undefined;
    temp.edit = undefined;
    this.setState(temp);
    return true;
  }

  editUser(id) {
    if (this.state.detail === id) {
      let temp = this.state;
      temp.edit = id;
      temp.create = undefined;
      this.setState(temp);
      return true;
    }
    return false;
  }

  updateUser(user) {
    UserActions.triggerUpdate(user, () => {
      Materialize.toast("User updated", 4000);
      FormActions.update({f: 'passwd', v: ''});
    }, (data) => {
      errorTranslate(data.message);
      Materialize.toast("Failed to update user", 4000);
    });
  }

  deleteUser(e) {
    e.preventDefault();
    UserActions.triggerRemoval(this.state.user, () => {
      Materialize.toast('User removed', 4000);
    });
    const state = {detail: undefined, create: undefined};
    this.setState(state);
  }

  handleCreate() {
    FormActions.edit(false);
    FormActions.set(null);
    this.clearSelection();
    let temp = this.state;
    temp.create = true;
    this.setState(temp);
    return true;
  }

  newUser(user) {
    UserActions.addUser(user, (data) => {
      Materialize.toast('User created', 4000);
      FormActions.update({f: 'passwd', v: ''});
      this.setState({detail: undefined, create: undefined, edit: undefined});
    }, (data) => {
      errorTranslate(data.message);
      Materialize.toast("Failed to create user", 4000);
    });
  }

  componentDidMount() {
    // TODO: use this later on to set the number of entries to be presented in each page
    // const height = document.getElementsByClassName('userCanvas')[0].clientHeight;
  }

  render() {
    let detailAreaStatus = "";
    if (this.state.create || this.state.edit) detailAreaStatus = " create";
    if (this.state.detail) detailAreaStatus = " selected";
    const prevPageClass = (this.props.isFirst ? " inactive" : "");
    const nextPageClass = (this.props.isLast ? " inactive" : "");


    return (
      <div className="fill">
        <RemoveDialog callback={this.deleteUser} target="confirmDiag" />
        <div className="flex-wrapper">
          {/* TODO promote this */}
          <div className="row z-depth-2 userSubHeader p0" id="inner-header">
            <div className="col s4 m4 main-title">List of Users</div>
            <div className="col s2 m2 header-card-info">
              <div className="title"># Users</div>
              <div className="subtitle">{this.props.total}</div>
            </div>
            <div className="col s4 header-card-info"></div>
            <div className="col s6 m2 button">
              <a id="btnNewUser" className="waves-effect waves-light btn-flat" onClick={this.handleCreate}>New User</a>
            </div>
          </div>

          <div className={"fill row userCanvas z-depth-2" + detailAreaStatus}>
            { this.props.values.length > 0 ? (
                <div className="col s4 no-padding" id="user-list">
                  { this.props.values.map((user) =>
                      <ListItem user={user}
                                key={user.id}
                                detail={this.state.detail}
                                detailedUser={this.detailedUser}/>
                  )}
                  <div className="col s4 userCanvasFooter">
                    <div id="labelShowing" className="col s12 m6">Showing {this.props.values.length} of {this.props.total}</div>
                    <div id="prevPageId" className="col s6 m3 clickable">
                      <a className={prevPageClass} onClick={this.props.prev}><i className="fa fa-chevron-left paddingRight10"></i>PREV</a>
                    </div>
                    <div id="nextPageId" className="col s6 m3 clickable">
                      <a className={nextPageClass} onClick={this.props.next}>NEXT<i className="fa fa-chevron-right paddingLeft10"></i></a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="col s4 background-info">
                  <span className="background-info">No configured users</span>
                </div>
              )
            }

            <div className={"col s8" + detailAreaStatus} id="detail-area">
              {this.state.create != undefined ? (
                  <UserForm dismiss={this.clearSelection}
                            save={this.newUser}
                            edit={false}
                            error={this.props.error}
                            loading={this.props.loading}
                            title="New User" />
              ) : this.state.edit != undefined ? (
                  <UserForm dismiss={this.clearSelection}
                            save={this.updateUser}
                            edit={true}
                            error={this.props.error}
                            loading={this.props.loading}
                            title={this.state.user.name} />
                  ) : (
                  this.state.detail != undefined ? (
                    <DetailItem user={this.state.user}
                                editUser={this.editUser}
                                clearSelection={this.clearSelection}
                                deleteUser={this.deleteUser}/>
                  ) : (
                    <div className="initialUserMessage">
                      <p>Select a user</p>
                      <p>to see its details</p>
                    </div>
                  ))}
            </div>
          </div>
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
      if (k !== null){
        return {id: k[1], val: k[2].toLowerCase()};
      } else {
        return null;
      }
    });
  }

  // does the actual filtering
  const filteredList = props.users.filter(function(e) {
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
        e.username.toLowerCase().includes(filter) ||
        e.service.toLowerCase().includes(filter)
      )
    }
  });

  return (
    <Paginator values={filteredList} entriesPerPage={6}>
      {/* Paginator forwards paginated values into UserList */}
      <UserList error={props.error} total={props.users.length}/>
    </Paginator>
  )
}

class Users extends Component {
  constructor() {
    super();
    this.state = { filter: '' };
    this.filterChange = this.filterChange.bind(this);
  }

  // Uses Users' internal state as store for the filter field. No sync issues since the
  // rendering of the affected view is done on the lower order compoenent (UserFilter).
  filterChange(e) {
    this.setState({ filter: e });
  }

  componentDidMount() {
    if(LoginStore.getState().user.profile == "admin"){
      UserActions.fetchUsers.defer();
    }
  }

  render() {
    if(LoginStore.getState().user.profile == "admin") {
      return (
        <span id="userMain" className="flex-wrapper">
          <PageHeader title="Auth" subtitle="Users">
            <Filter onChange={this.filterChange} />
          </PageHeader>
          <AltContainer store={UserStore} >
            <UserFilter filter={this.state.filter} />
          </AltContainer>
        </span>
      );
    } else {
      return (
        <span id="userMain" className="flex-wrapper">
         <AutheticationFailed />
        </span>
      );
    }
  }
}

export default Users;
