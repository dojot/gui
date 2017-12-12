import React, { Component } from 'react';
import { Link } from 'react-router'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import AltContainer from 'alt-container';

import MenuActions from '../../actions/MenuActions';
import MenuStore from '../../stores/MenuStore';
import LoginStore from '../../stores/LoginStore';
import LoginActions from '../../actions/LoginActions';

class Navbar extends Component {
  // TODO: header widgets should be received as children to this (Navbar) node
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      page: '',
      page_icon: false,
    };

    this.handleClick = this.handleClick.bind(this);
    this.gravatar = "https://www.gravatar.com/avatar/" + btoa(this.props.user.username) + "?d=identicon";
  }

  // changePage(page,icon) {
  //   console.log("new page/icon",page,icon);
  //   this.setState({page: page, page_icon:icon});
  // }

  handleClick(e) {
    e.preventDefault();

    if (this.state.open === true) {
      this.setState({open: false})
    } else {
      this.setState({open: true})
    }
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
            {/* TODO: add props for badge indicator */}
            <div className="status-item status-icon">
              <i className="fa fa-spinner fa-pulse fa-fw"></i>
            </div>
            <div className="status-item status-icon">
                {this.state.page} {this.state.page_icon}
            </div>
            <div className="status-item user-area">
                <div className="user-pic">
                  <img src={this.gravatar} />
                </div>
                <div className="user-name">{(this.props.user.name ? this.props.user.name : this.props.user.username)}</div>
                <div className="clickable" onClick={this.handleClick} title="Login details">
                  <i className="fa fa-caret-down line-normal center-caret" />
                  { this.state.open === true && <RightSideBar user={this.props.user} gravatar={this.gravatar} /> }
                </div>
            </div>
          </div>
        </div>
      </nav>
    )
  }
}

class RightSideBar extends Component {
  constructor(props) {
    super(props);

    this.logout = this.logout.bind(this);
    this.dismiss = this.dismiss.bind(this);
  }

  logout(event) {
    event.preventDefault();
    LoginActions.logout();
  }

  dismiss(event) {
    event.preventDefault();
  }

  render() {
    return (
      <div className="rightsidebar" onClick={this.dismiss}>
        <div className="rightsidebarchild logout-page">
          <div className="col s12 m12 logout-page-photo">
            <img src={this.props.gravatar} />
          </div>
          <div className="col s12 m12">
            <div className="logout-page-subtitle">You are logged in!</div>
          </div>

          <div className="col s12 m12">
            <div className="logout-page-info truncate">{this.props.user.username}</div>
          </div>

          <div className="col s12 m12">
            <div className="logout-page-label"> Username</div>
          </div>

          {(this.props.user.email != undefined) && (
            <div>
            <div className="col s12 m12">
              <div className="logout-page-info truncate">{this.props.user.email}</div>
            </div>

            <div className="col s12 m12">
              <div className="logout-page-label"> E-mail</div>
            </div>
            </div>
          )}

          <div className="row logout-page-buttons">
            <div className="s12 m6">
              <a className="btn waves-light" onClick={this.dismiss}>dismiss</a>
            </div>
            <div className="s12 m6">
              <button type="button" className="btn waves-light" onClick={this.logout}>logout</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function SidebarItem(props) {
  let isActive = props.router.location.pathname === props.item.target;
  if (!isActive && ('children' in props.item)) {
    props.item.children.map((child) => {
      let inner = false;
      if (child.hasOwnProperty('siblings')) {
        child.siblings.map((sibling) => {
          inner = inner || props.router.location.pathname.startsWith(sibling)
        });
      }
      isActive = isActive || (props.router.location.pathname == child.target) || inner;
    });
  }

  // isActive  = true;
  const entryClass = "nav-link" + (isActive ? " active" : "");

  function getSubItemClass(child) {
    let inner = false;
    if (child.hasOwnProperty('siblings')) {
      child.siblings.map((sibling) => {
        inner = inner || props.router.location.pathname.startsWith(sibling)
      });
    }

    return "nav-2nd-item" + (inner ? " active" : "");
  }

  if (props.open) {
    return (
      <li className="nav-item">
        <Link to={props.item.target} className={entryClass} activeClassName="active" tabIndex="-1">
          <div className="nav-icon">
            <div className={"icon-"+props.item.image+" icon-prop"}></div>
          </div>
          <div className="nav-title">{props.item.label}</div>
          <div className="nav-desc">{props.item.desc}</div>
        </Link>
      </li>
    )
  } else {
    return (
      <li className="nav-item">
        <Link to={props.item.target} className={entryClass} activeClassName="active" tabIndex="-1">
          <div className="nav-icon">
            <div className={"icon-"+props.item.image+" icon-prop"}></div>
          </div>
        </Link>
      </li>
    )
  }
}

class Sidebar extends Component {

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    MenuActions.toggleLeft();
  }

  render() {
    let entries = [
      { target: "/device", iconClass: "material-icons mi-ic-memory", label: "Devices", desc: "Known devices and configuration", children: [
        { target: "/device/list", iconClass: "", label: "device", title: "Devices list", siblings: ['/device/id', '/device/new']},
        { target: "/template/list", iconClass: "", label: "template", title: "Templates list", siblings: ['/template/id', '/template/new']},
        { target: "/alarm?q=device", iconClass: "", label: "alarm", title: "Alarms list"}
      ]},
      { target: "/flows", iconClass: "material-icons mi-device-hub", label: "data flows", desc: "Processing flows to be executed"},
      { target: "/alarm", iconClass: "fa fa-bell-o", label: "alarms", desc: "System events and alarms"},
      { target: "/auth", iconClass: "fa fa-unlock-alt", label: "auth", desc: "User and permissions management", children: [
        { target: "/auth/user", iconClass: "", label: "users", title: "Users list"},
        { target: "/auth/permissions", iconClass: "", label: "permissions", title: "Permissions list"}
      ]},
      { target: "/deploy", iconClass: "fa fa-cogs", label: "deploy", desc: "Application and plugin management", children: [
        { target: "/deploy/plugins", iconClass: "", label: "plugins", title: "Plugins list"},
        { target: "/deploy/applications", iconClass: "", label: "applications", title: "Applications list"},
        { target: "/alarm?q=deploy", iconClass: "", label: "alarm", title: "Alarms list"},
      ]}
    ];

    return (
      <div className="sidebar expand z-depth-5" tabIndex="-1">
        <div className="header">
          {this.props.open &&
            ( <div className="logo-n-bars">
              <img className="logo" src="images/logo-bl.png" />
              <div className="bars action waves-effect waves-light" onClick={this.handleClick} >
              <img className="img-bars" src="images/menu.png" />
              </div>
            </div>)
          }
          {!this.props.open &&
            ( <div className="logo-n-bars">
              <img className="closed-logo" src="images/logo-bl.png" />
              <div className="bars action waves-effect waves-light" onClick={this.handleClick} >
              <img className="img-bars" src="images/menu.png" />
              </div>
            </div>)
          }
        </div>

        <nav className="sidebar-nav line-normal">
          <ul className="nav">
            { entries.map((item) => <SidebarItem item={item} key={item.label} open={this.props.open} router={this.props.router}/> )}
          </ul>
        </nav>
      </div>
    )
  }
}

function Content(props) {
  return (
    <div className={"app-body full-height " + (props.leftSideBar.open ? " open" : " closed") }>
      <Sidebar open={props.leftSideBar.open} router={props.router}/>
      <div className="content expand relative">
        {props.children}
      </div>
    </div>
  )
}


function SpanWrapper(props) {

  function renderChildren() {
    return React.Children.map(props.children, child => {
      return React.cloneElement(child, props);
    })
  }

  return (
    <span>
      { renderChildren() }
    </span>
  )
}

class Full extends Component {
  render() {
    return (
      <span>
        <AltContainer store={LoginStore}>
          <Navbar/>
        </AltContainer>
        <AltContainer store={MenuStore}>
          <Content router={this.props.router}>{this.props.children}</Content>
        </AltContainer>
      </span>
    );
  }
}

export default Full;
