import React, { Component } from 'react';
import AltContainer from 'alt-container';
import { translate, Trans } from 'react-i18next';
import PropTypes from 'prop-types';
import * as i18next from 'i18next';
import GroupStore from '../../stores/GroupStore';
import GroupActions from '../../actions/GroupActions';
import GroupPermissionActions from '../../actions/GroupPermissionActions';
import { NewPageHeader } from '../../containers/full/PageHeader';
import { DojotBtnLink } from '../../components/DojotButton';
import GroupsSideBar from './GroupsSideBar';
import toaster from '../../comms/util/materialize';
import Can from '../../components/permissions/Can';

i18next.setDefaultNamespace('groups');

function GroupCard(obj) {
    return (
        <div
            className="card-size card-hover lst-entry-wrapper z-depth-2 mg0px pointer"
            id={obj.group.name}
            onClick={obj.onclick}
            role="none"
            tabIndex={obj.group.id}
        >
            <div className="lst-entry-title col s12 bg-gradient-dark-ciano">
                <img className="title-icon" src="images/groups-icon.png" alt="Group" />
                <div className="title-text truncate" title={obj.group.name}>
                    <span className="text">
                        {obj.group.name}
                    </span>
                </div>
            </div>
            <div className="attr-list">
                <div className="attr-area light-background">
                    <div className="attr-row height74">
                        <div className="icon height50">
                            <img src="images/info-icon.png" alt={obj.group.description} />
                        </div>
                        <div className="attr-content" title={obj.group.description}>
                            <div className="subtitle">
                                {obj.group.description}
                                {' '}
                            </div>
                            <span>
                                <Trans i18nKey="description.label" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}

function GroupList(param) {
    if (param.groups) {
        return (
            <div className="col s12 lst-wrapper w100 hei-100-over-scroll flex-container">
                {param.groups.map(obj => (
                    <div key={obj.name} className="mg20px fl flex-order-2">
                        <GroupCard
                            group={obj}
                            key={obj.name}
                            onclick={param.handleUpdate}
                        />
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

function OperationsHeader(param) {
    return (
        <div className="col s12 pull-right pt10">
            <Can do="modifier" on="flows">
                <DojotBtnLink
                    responsive="true"
                    onClick={param.newGroup}
                    label={param.i18n('btn.new.text')}
                    alt={param.i18n('btn.new.alt')}
                    icon="fa fa-plus"
                    className="w130px"
                />
            </Can>
        </div>
    );
}

class Groups extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showSideBar: false,
            edit: false,
        };

        this.newGroup = this.newGroup.bind(this);
        this.toggleSideBar = this.toggleSideBar.bind(this);
        this.hideSideBar = this.hideSideBar.bind(this);
        this.showSideBar = this.showSideBar.bind(this);
        this.handleUpdate = this.handleUpdate.bind(this);
    }

    componentDidMount() {
        GroupActions.fetchGroups.defer();
        GroupPermissionActions.fetchGroupPermissions(null);
        GroupPermissionActions.fetchSystemPermissions();
    }

    toggleSideBar() {
        this.setState(prevState => ({
            showSideBar: !prevState.showSideBar,
        }));
    }

    hideSideBar() {
        this.setState({
            showSideBar: false,
            edit: false,
        });
        GroupPermissionActions.fetchSystemPermissions();
        GroupActions.fetchGroups.defer();
    }

    showSideBar() {
        this.setState({
            showSideBar: true,
        });
    }

    newGroup() {
        GroupActions.getGroupByName(null);
        GroupPermissionActions.fetchGroupPermissions();
        this.setState({
            showSideBar: true,
            edit: false,
        });
    }

    handleUpdate(e) {
        e.preventDefault();
        const { t } = this.props;
        const { id: groupClick } = e.currentTarget;
        if (groupClick === 'admin') {
            toaster.warning(t('alerts.admin_not_remove'));
        } else {
            GroupActions.getGroupByName(groupClick);
            GroupPermissionActions.fetchGroupPermissions(groupClick);
            this.setState({
                showSideBar: true,
                edit: true,
            });
        }
    }

    render() {
        const {
            showSideBar,
            edit,
        } = this.state;
        const { t } = this.props;
        return (
            <div className="full-device-area">
                <AltContainer store={GroupStore}>
                    <NewPageHeader title={<Trans i18nKey="title" />} icon="groups">
                        <OperationsHeader newGroup={this.newGroup} i18n={t} />
                    </NewPageHeader>
                    <GroupBox
                        handleUpdate={this.handleUpdate}
                        showSideBar={showSideBar}
                        handleShowSideBar={this.showSideBar}
                        handleHideSideBar={this.hideSideBar}
                        edit={edit}
                    />
                </AltContainer>
            </div>
        );
    }
}

Groups.propTypes = {
    t: PropTypes.func.isRequired,
};

function GroupBox(props) {
    const {
        handleUpdate, showSideBar, handleHideSideBar, handleShowSideBar, edit,
    } = props;
    return (
        <div className="full-height flex-container pos-relative overflow-x-hidden">
            <GroupList handleUpdate={handleUpdate} {...props} />
            {showSideBar ? (
                <GroupsSideBar
                    handleShowSideBar={handleShowSideBar}
                    handleHideSideBar={handleHideSideBar}
                    edit={edit}
                    {...props}
                />
            ) : <div />}
        </div>
    );
}

GroupBox.propTypes = {
    handleUpdate: PropTypes.func.isRequired,
    showSideBar: PropTypes.bool.isRequired,
    handleHideSideBar: PropTypes.func.isRequired,
    handleShowSideBar: PropTypes.func.isRequired,
    edit: PropTypes.func.isRequired,
};


export default translate()(Groups);
