import React, { Component, Fragment } from 'react';
import { translate, Trans } from 'react-i18next';
import PropTypes from 'prop-types';
import ability from 'Components/permissions/ability';
import GroupActions from '../../actions/GroupActions';
import GroupPermissionActions from '../../actions/GroupPermissionActions';
import SideBarRight from './SideBarRight';
import toaster from '../../comms/util/materialize';
import { RemoveModal } from '../../components/Modal';
import { InputCheckbox, InputText } from '../../components/DojotIn';

const groupHasSubject = (subject, groupPermissions) => {
    if (groupPermissions) {
        const singlePermission = groupPermissions.filter((n1) => subject === n1.subject);
        return (singlePermission.length > 0);
    }
    return false;
};

const groupHasPermission = (subject, action, groupPermissions) => {
    if (groupPermissions) {
        const singlePermission = groupPermissions.filter((n1) => subject === n1.subject);
        if (singlePermission[0] && singlePermission[0].actions && singlePermission[0].actions.length > 0) {
            return singlePermission[0].actions.filter((n1) => n1 === action).length > 0;
        }
    }
    return false;
};

function TableGroupsPermissions(params) {
    const {
        handleChangeCheckbox, groupPermissions, systemPermissions, cannotEdit,
    } = params;

    if (!systemPermissions) {
        return (<div />);
    }

    return (
        <div className="bodyForm">
            <table className="striped centered">
                <thead>
                    <tr>
                        <th><Trans i18nKey="form.table_label.feature" /></th>
                        <th>
                            <Trans i18nKey="form.table_label.viewer" />
                        </th>
                        <th><Trans i18nKey="form.table_label.modifier" /></th>
                    </tr>
                </thead>
                <tbody>
                    {systemPermissions
                        .map((item) => (
                            <tr key={`${item.subject}`}>
                                <td>
                                    <Trans i18nKey={`form.feature.${item.subject}`} />
                                </td>
                                <td>
                                    {groupHasPermission(item.subject, 'viewer', systemPermissions) ? (
                                        <InputCheckbox
                                            label=""
                                            placeHolder=""
                                            name={`${item.subject}.viewer`}
                                            checked={groupHasPermission(item.subject, 'viewer', groupPermissions)}
                                            handleChangeCheckbox={handleChangeCheckbox}
                                            disabled={cannotEdit}
                                        />
                                    ) : <div />}
                                </td>
                                <td>
                                    {groupHasPermission(item.subject, 'modifier', systemPermissions) ? (
                                        <InputCheckbox
                                            label=""
                                            placeHolder=""
                                            name={`${item.subject}.modifier`}
                                            checked={groupHasPermission(item.subject, 'modifier', groupPermissions)}
                                            handleChangeCheckbox={handleChangeCheckbox}
                                            disabled={cannotEdit}
                                        />
                                    ) : <div />}
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}

function Form(params) {
    const {
        handleCharge,
        dataGroup,
        handleChangeCheckbox,
        groupPermissions,
        systemPermissions,
        cannotEdit,
    } = params;

    if (!dataGroup) {
        return (<div />);
    }

    return (
        <>
            <InputText
                label={<Trans i18nKey="form.input.groupname.label" />}
                name="name"
                maxLength={30}
                onChange={handleCharge}
                value={dataGroup.name ? dataGroup.name : ''}
                disabled={cannotEdit}
                errorMessage={<Trans i18nKey="form.input.groupname.error" />}
            />
            <InputText
                label={<Trans i18nKey="description.label" />}
                name="description"
                maxLength={254}
                onChange={handleCharge}
                disabled={cannotEdit}
                value={dataGroup.description ? dataGroup.description : ''}
            />
            <TableGroupsPermissions
                groupPermissions={groupPermissions}
                systemPermissions={systemPermissions}
                handleChangeCheckbox={handleChangeCheckbox}
                cannotEdit={cannotEdit}
            />
        </>
    );
}

class GroupsSideBar extends Component {
    // @todo: we should avoid use derivedState
    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.grouppermissions !== prevState.grouppermissions) {
            return {
                ...prevState,
                systempermissions: nextProps.systempermissions,
                grouppermissions: nextProps.grouppermissions,
                group: nextProps.group,
                edit: nextProps.edit,
            };
        }
        return null;
    }

    static checkAlphaNumber(string) {
        // will be change - regex doesnt should be here
        const regex = /^([ \u00c0-\u01ffa-zA-Z'\-])+$/;
        return !regex.test(string);
    }

    constructor(props) {
        super(props);

        this.state = {
            showDeleteModal: false,
            group: undefined,
            grouppermissions: undefined,
            systempermissions: undefined,
            edit: false,
        };

        this.auxGroupPermissions = null;
        this.addingCorrelations = this.addingCorrelations.bind(this);
        this.addingPermission = this.addingPermission.bind(this);
        this.isPossibleRemove = this.isPossibleRemove.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.delete = this.delete.bind(this);
        this.handleModalDelete = this.handleModalDelete.bind(this);
        this.handleCheckBox = this.handleCheckBox.bind(this);
    }

    // applying a DFS algorithm strategy with pre order
    addingCorrelations(subject, action) {
        const { systemcorrelations } = this.props;
        const corr = systemcorrelations.filter((n1) => subject === n1.subject
            && action === n1.action)[0];
        if (corr === undefined) return;
        corr.requires.forEach((el) => {
            const res = groupHasPermission(el.subject, el.action, this.auxGroupPermissions);
            if (!res) this.addingPermission(el.subject, el.action);
        });
    }

    addingPermission(subject, action) {
        // Adds subject tuple to permissions list
        if (!groupHasSubject(subject, this.auxGroupPermissions)) {
            this.auxGroupPermissions.push({
                subject,
                actions: [],
            });
        }

        this.auxGroupPermissions.forEach((item, index1) => {
            if (item.subject === subject) {
                this.auxGroupPermissions[index1].actions.push(action);
            }
        });

        this.addingCorrelations(subject, action);
    }

    isPossibleRemove(subject, action, groupPermissions) {
        let retrn = true;
        const { requiredBy } = this.props;
        if (requiredBy[subject] && requiredBy[subject][action]) {
            // checking all constraints
            requiredBy[subject][action].forEach((el) => {
                const res = groupHasPermission(el.subject, el.action, groupPermissions);
                if (res) {
                    retrn = false;
                }
                // A restriction is been used;
            });
        }
        return retrn;
    }

    handleInput(e) {
        const { name, value } = e.target;
        this.setState((prevState) => ({
            ...prevState,
            group: {
                ...prevState.group,
                [name]: value,
            },
        }));
    }

    handleCheckBox(e) {
        const { name } = e.target;
        const [subject, action] = name.split('.');
        let { grouppermissions } = this.state;

        const hasPermission = groupHasPermission(subject, action, grouppermissions);
        // removing action
        if (hasPermission) {
            // check is possible to remove
            if (!this.isPossibleRemove(subject, action, grouppermissions)) {
                e.preventDefault();
                return;
            }
            grouppermissions.forEach((item, index1) => {
                if (item.subject === subject) {
                    (item.actions).forEach((item2, index2) => {
                        if (item2 === action) {
                            delete grouppermissions[index1].actions[index2];
                        }
                    });
                }
            });
        } else {
            // adding action (using a auxiliar variable)
            this.auxGroupPermissions = grouppermissions;
            this.addingPermission(subject, action);
            grouppermissions = this.auxGroupPermissions;
        }

        this.setState({
            grouppermissions,
        });
    }

    hideSideBar() {
        const { handleHideSideBar } = this.props;
        handleHideSideBar();
    }

    showSideBar() {
        const { handleShowSideBar } = this.props;
        handleShowSideBar();
    }

    discard() {
        this.hideSideBar();
    }

    formDataValidate() {
        // will be change - validation dont should be in toaster
        const { group } = this.state;
        const { t } = this.props;
        if ((group.name).trim().length <= 0) {
            toaster.warning(t('alerts.empty_name'));
            return false;
        }

        if (GroupsSideBar.checkAlphaNumber(group.name)) {
            toaster.warning(t('alerts.invalid_name'));
            return false;
        }

        if ((group.description).trim().length <= 0) {
            toaster.warning(t('alerts.empty_desc'));
            return false;
        }
        return true;
    }

    save() {
        if (this.formDataValidate()) {
            const { group, grouppermissions, edit } = this.state;
            const err = null;
            const e = null;
            const { t } = this.props;
            GroupActions.triggerSave(
                group,
                (response) => {
                    GroupPermissionActions.triggerSaveGroupPermissions(
                        group.name ? group.name : response.name, grouppermissions, err, e,
                        () => {
                        },
                    );
                    if (edit) {
                        toaster.success(t('alerts.group_modify'));
                    } else {
                        toaster.success(t('alerts.group_create'));
                    }
                    this.hideSideBar();
                },
            );
            GroupActions.fetchGroups.defer();
        }
    }

    handleModalDelete(status) {
        this.setState((prevState) => ({
            ...prevState,
            showDeleteModal: status,
        }));
    }

    delete() {
        const { group } = this.state;
        const { t } = this.props;
        GroupActions.triggerRemoval(
            group.id,
            () => {
                toaster.success(t('alerts.group_remove'));
                this.hideSideBar();
            },
        );

        this.handleModalDelete(false);
        this.hideSideBar();
    }

    render() {
        const {
            group, edit, showDeleteModal, grouppermissions, systempermissions,
        } = this.state;

        const { t } = this.props;

        const cannotEdit = !ability.can('modifier', 'permission');

        const buttonsFooter = [
            {
                label: t('common:discard.label'),
                click: this.discard,
                type: 'secondary',
            },
        ];

        if (!cannotEdit) {
            if (edit) {
                buttonsFooter.push({
                    label: t('common:remove.label'),
                    click: this.handleModalDelete,
                    type: 'secondary',
                });
            }
            buttonsFooter.push({
                label: t('common:save.label'),
                click: this.save,
                color: 'red',
                type: 'primary',
            });
        }

        return (
            <>
                <SideBarRight
                    icon="groups"
                    headerColor="bg-gradient-purple"
                    title={edit ? `${group.name}`
                        : t('groups:form.title.new')}
                    content={(
                        <div className="pl20 pr20">
                            <Form
                                dataGroup={group}
                                groupPermissions={grouppermissions}
                                systemPermissions={systempermissions}
                                handleCharge={this.handleInput}
                                handleChangeCheckbox={this.handleCheckBox}
                                cannotEdit={cannotEdit}
                            />
                        </div>
                    )}
                    visible
                    buttonsFooter={buttonsFooter}
                />
                {showDeleteModal ? (
                    <RemoveModal
                        name={t('groups:alerts.group')}
                        remove={this.delete}
                        openModal={this.handleModalDelete}
                    />
                ) : <div />}
            </>
        );
    }
}

GroupsSideBar.propTypes = {

    grouppermissions: PropTypes.arrayOf(PropTypes.object).isRequired,
    group: PropTypes.instanceOf(Object).isRequired,
    edit: PropTypes.bool,
    systemcorrelations: PropTypes.shape({}).isRequired,
    requiredBy: PropTypes.shape({}).isRequired,
    handleHideSideBar: PropTypes.func.isRequired,
    handleShowSideBar: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

GroupsSideBar.defaultProps = {
    edit: false,
};
export default translate()(GroupsSideBar);
