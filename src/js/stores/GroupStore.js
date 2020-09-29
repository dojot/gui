const alt = require('../alt');
const GroupActions = require('../actions/GroupActions');
const GroupPermissionActions = require('../actions/GroupPermissionActions');

const groupEmpty = ({
    name: '',
    description: '',
    id: null,
});

class GroupStore {
    constructor() {
        this.groups = [];
        this.group = groupEmpty;
        this.grouppermissions = [];
        this.systempermissions = [];

        // default permissions_correlations
        this.systemcorrelations = [{
            subject: 'device',
            action: 'modifier',
            requires: [{
                subject: 'template',
                action: 'viewer',
            }],
        }, {
            subject: 'user',
            action: 'modifier',
            requires: [{
                subject: 'permission',
                action: 'viewer',
            }],
        }];
        this.requiredBy = {};
        // creating systemcorrelations inverse dict (required by)
        this.systemcorrelations.forEach((el) => {
            el.requires.forEach((req) => {
                if (!this.requiredBy[req.subject]) {
                    this.requiredBy[req.subject] = {};
                }

                if (!this.requiredBy[req.subject][req.action]) {
                    this.requiredBy[req.subject][req.action] = [];
                }
                this.requiredBy[req.subject][req.action].push(
                    { subject: el.subject, action: el.action },
                );
            });
        });

        this.loading = false;
        this.error = null;

        this.bindListeners({
            handleUpdateGroupList: GroupActions.UPDATE_GROUPS,
            handleFetchGroupList: GroupActions.FETCH_GROUPS,
            handleFailure: GroupActions.GROUPS_FAILED,
            handleTriggerSave: GroupActions.TRIGGER_SAVE,
            handleTriggerRemoval: GroupActions.TRIGGER_REMOVAL,
            handleGetGroup: GroupActions.getGroupByName,

            handleFetchGroupPermissions: GroupPermissionActions.fetchGroupPermissions,
            handleFetchSystemPermissions: GroupPermissionActions.fetchSystemPermissions,
            handleTriggerSaveGroupPermissions: GroupPermissionActions.triggerSaveGroupPermissions,
            handleFailureGroupPermissions: GroupPermissionActions.failed,
            handleUpdateGroupPerm: GroupPermissionActions.updateGroupPermission,
            handleUpdateSystemPerm: GroupPermissionActions.updateSystemPermission,

        });
    }

    handleGetGroup(groupName) {
        if (groupName) {
            this.group = this.groups.find((g) => g.name === groupName);
        } else {
            this.group = groupEmpty;
        }
    }

    handleUpdateGroupList(groups) {
        this.groups = groups;
        this.error = null;
        this.loading = false;
    }

    handleFetchGroupList() {
        this.groups = [];
        this.loading = true;
    }

    handleFailure(error) {
        this.error = error;
        this.loading = false;
    }

    handleTriggerSave() {
        // trigger handler for updateSingle
        this.error = null;
        this.loading = true;
    }

    handleTriggerRemoval() {
        // trigger handler for removeSingle
        this.error = null;
        this.loading = true;
    }

    /* *
     *  Permissions
     * */

    handleFetchGroupPermissions(groupName) {
        this.grouppermissions = [];
        this.loading = true;
    }

    handleFetchSystemPermissions(groupName) {
        this.systempermissions = [];
        this.loading = true;
    }

    handleTriggerSaveGroupPermissions() {
        this.error = null;
        this.loading = true;
    }

    handleFailureGroupPermissions(error) {
        this.error = error;
        this.loading = false;
    }

    handleUpdateGroupPerm(grouppermissions) {
        this.grouppermissions = grouppermissions;
        this.error = null;
        this.loading = false;
    }

    handleUpdateSystemPerm(systempermissions) {
        this.systempermissions = systempermissions;
        this.error = null;
        this.loading = false;
    }
}

const _store = alt.createStore(GroupStore, 'GroupStore');
export default _store;
