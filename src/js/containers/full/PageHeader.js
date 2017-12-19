import React, { Component } from 'react';
import { Link } from 'react-router'

class SubMenu extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let children = {};
      children['device'] = [
        { target: "/device/list", iconClass: "", label: "device", title: "Devices list", siblings: ['/device/id', '/device/new']},
        { target: "/template/list", iconClass: "", label: "template", title: "Templates list", siblings: ['/template/id', '/template/new']},
        { target: "/alarm?q=device", iconClass: "", label: "alarm", title: "Alarms list"}
      ];
      children['auth'] = [
        { target: "/auth/user", iconClass: "", label: "users", title: "Users list"},
        { target: "/auth/permissions", iconClass: "", label: "permissions", title: "Permissions list"}
      ];
      children['deploy'] = [
        { target: "/deploy/plugins", iconClass: "", label: "plugins", title: "Plugins list"},
        { target: "/deploy/applications", iconClass: "", label: "applications", title: "Applications list"},
        { target: "/alarm?q=deploy", iconClass: "", label: "alarm", title: "Alarms list"},
      ];

       if (children[this.props.page]) {
        return (
            <ul className="sub-nav">
            { children[this.props.page].map((item) => <SubMenuItem item={item}  key={item.label}  /> )}
            </ul>
        )
      }
      else
      return null;
  }
}


function SubMenuItem(props) {
  // let isActive = props.router.location.pathname === props.item.target;
  // isActive  = true;
  // const entryClass = "nav-link" + (isActive ? " active" : "");
    return (
      <li className="nav-item">
        <Link to={props.item.target} className="sub-menu-item" tabIndex="-1">
          <div className="icon">
            <div className={"icon-"+props.item.iconClass+" icon-prop"}></div>
          </div>
          <div className="title">{props.item.title}</div>
        </Link>
      </li>
    )
}



function NewPageHeader(props) {
  // let isActive = props.router.location.pathname === props.item.target;

  return (
    <div className="header-box">
      <div className="title-box">
        <div className="icon">
        {props.icon != "" &&
          (
            <img src={"images/header/"+props.icon+"-icon.png"} />)
          }
        </div>
        <div className="title">{props.title}</div>
      </div>
      <div className="col m12">
        <div className="sub-menu">
          <SubMenu page={props.icon} />
        </div>
        <div className="page-actions">
          {props.children}
        </div>
      </div>
    </div>

  )
}

function PageHeader(props) {
  return (
    <div className={(props.shadow=="true") ? "page-header box-shadow" : "page-header"}>
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
  )
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
  )
}

export { NewPageHeader, PageHeader, ActionHeader };
