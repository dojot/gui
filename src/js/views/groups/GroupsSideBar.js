import React, { Component } from 'react';
import { translate, Trans } from 'react-i18next';
import PropTypes from 'prop-types';
import GroupActions from '../../actions/GroupActions';
import GroupPermissionActions from '../../actions/GroupPermissionActions';
import SideBarRight from './SideBarRight';
import toaster from '../../comms/util/materialize';
import { RemoveModal } from '../../components/Modal';
import { InputCheckbox, InputText } from '../../components/DojotIn';

function TableGroupsPermissions(params) {
    const { handleChangeCheckbox, permissionsForm } = params;
    if (!permissionsForm) {
        return (<div />);
    }

    return (
        <div className="bodyForm">
            <table className="striped centered">
                <thead>
                    <tr>
                        <th><Trans i18nKey="groups.form.table_label.feature" /></th>
                        <th><Trans i18nKey="groups.form.table_label.modifier" /></th>
                        <th>
                            <Trans i18nKey="groups.form.table_label.viewer" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(permissionsForm)
                    .map(item => (
                        <tr>
                            <td>
                                <Trans i18nKey={`groups.form.feature.${item}`} />
                            </td>
                            <td>
                                <InputCheckbox
                                    label=""
                                    placeHolder=""
                                    name={`${item}.modifier`}
                                    checked={permissionsForm[item].modifier}
                                    handleChangeCheckbox={handleChangeCheckbox}
                                />
                            </td>
                            <td>
                                <InputCheckbox
                                    label=""
                                    placeHolder=""
                                    name={`${item}.viewer`}
                                    checked={permissionsForm[item].viewer}
                                    handleChangeCheckbox={handleChangeCheckbox}
                                />
                            </td>
                        </tr>
                    ))
                }
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
        dataPermissions,
    } = params;

    if (!dataGroup) {
        return (<div />);
    }

    return (
        <form action="#">
            <InputText
                label={<Trans i18nKey="groups.form.input.groupname.label" />}
                name="name"
                maxLength={30}
                onChange={handleCharge}
                value={dataGroup.name ? dataGroup.name : ''}
                errorMessage={<Trans i18nKey="groups.form.input.groupname.error" />}
            />
            <InputText
                label={<Trans i18nKey="groups.form.input.groupdescription.label" />}
                name="description"
                maxLength={254}
                onChange={handleCharge}
                value={dataGroup.description ? dataGroup.description : ''}
            />
            <TableGroupsPermissions
                permissionsForm={dataPermissions}
                handleChangeCheckbox={handleChangeCheckbox}
            />
        </form>
    );
}

class GroupsSideBar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showDeleteModal: false,
            group: undefined,
            grouppermissions: undefined,
            permissionsForm: {},
            edit: false,
        };

        this.handleInput = this.handleInput.bind(this);
        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.delete = this.delete.bind(this);
        this.handleModalDelete = this.handleModalDelete.bind(this);
        this.handleCheckBox = this.handleCheckBox.bind(this);
    }

    componentDidUpdate(prevProps) {
        const {
            grouppermissions: grouppermissionsProp,
            group: groupProp,
            edit: editProp,
        } = this.props;

        const {
            grouppermissions: grouppermissionsState,
            group: groupState,
            edit: editState,
        } = this.state;

        if ((grouppermissionsProp && !grouppermissionsState)
            || prevProps.grouppermissions !== grouppermissionsProp) {
            this.setState({ grouppermissions: grouppermissionsProp });
        }
        if ((groupProp && !groupState) || prevProps.group !== groupProp) {
            this.setState({ group: groupProp });
        }
        if ((editProp && !editState) || prevProps.edit !== editProp) {
            this.setState({ edit: editProp });
        }
    }

    checkAlphaNumber(string) {
        // will be change - regex dont should be here
        const regex = /^([ \u00c0-\u01ffa-zA-Z'\-])+$/;
        return !regex.test(string);
    }

    componentDidCatch(error, info) {
        console.log('componentDidCatch 2', error);
        console.log('componentDidCatch 2', info);
    }

    handleInput(e) {
        const { name, value } = e.target;
        this.setState(prevState => ({
            ...prevState,
            group: {
                ...prevState.group,
                [name]: value,
            },
        }));
    }

    handleCheckBox(e) {
        const { name } = e.target;
        const [action, typePermission] = name.split('.');
        this.setState(prevState => ({
            grouppermissions: {
                ...prevState.grouppermissions,
                [action]: {
                    ...prevState.grouppermissions[action],
                    [typePermission]: !prevState.grouppermissions[action][typePermission],
                },
            },
        }));
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
            toaster.warning(t('groups.alerts.empty_name'));
            return false;
        }

        if (this.checkAlphaNumber(group.name)) {
            toaster.warning(t('groups.alerts.invalid_name'));
            return false;
        }

        if ((group.description).trim().length <= 0) {
            toaster.warning(t('groups.alerts.empty_desc'));
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
                        grouppermissions, group.id ? group.id : response.id, err, e, edit,
                        () => {
                        }, (groupR) => {
                            console.log(groupR);
                        },
                    );
                    if (edit) {
                        toaster.success(t('groups.alerts.group_modify'));
                    } else {
                        toaster.success(t('groups.alerts.group_create'));
                    }
                    this.hideSideBar();
                },
                (groupR) => {
                    console.log(groupR);
                },
            );
            GroupActions.fetchGroups.defer();
        }
    }


    handleModalDelete(status) {
        this.setState(prevState => ({
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
                toaster.success(t('groups.alerts.group_remove'));
                this.hideSideBar();
            },
            (groupR) => {
                console.log(groupR);
            },
        );

        this.handleModalDelete(false);
        this.hideSideBar();
    }

    render() {
        const {
            group, edit, showDeleteModal, grouppermissions,
        } = this.state;
        const buttonsFooter = [
            {
                label: <Trans i18nKey="groups.form.btn.discard.label" />,
                click: this.discard,
                type: 'default',
            },
            {
                label: <Trans i18nKey="groups.form.btn.save.label" />,
                click: this.save,
                type: 'primary',
            },
        ];

        if (edit) {
            buttonsFooter.push({
                label: <Trans i18nKey="groups.form.btn.remove.label" />,
                click: this.handleModalDelete,
                type: 'secondary',
            });
        }

        return (
            <div>
                <SideBarRight
                    title={edit ? <Trans i18nKey="groups.form.title.edit" />
                        : <Trans i18nKey="groups.form.title.new" />}
                    content={(
                        <Form
                            dataGroup={group}
                            dataPermissions={grouppermissions}
                            handleCharge={this.handleInput}
                            handleChangeCheckbox={this.handleCheckBox}
                        />
                    )}
                    visible
                    buttonsFooter={buttonsFooter}
                />
                {showDeleteModal ? (
                    <RemoveModal
                        name="group"
                        remove={this.delete}
                        openModal={this.handleModalDelete}
                    />
) : <div />}
            </div>
        );
    }
}

GroupsSideBar.propTypes = {
    grouppermissions: PropTypes.shape.isRequired,
    group: PropTypes.shape.isRequired,
    edit: PropTypes.bool,
    handleHideSideBar: PropTypes.func.isRequired,
    handleShowSideBar: PropTypes.func.isRequired,
    t: PropTypes.shape.isRequired,
};

GroupsSideBar.defaultProps = {
    edit: false,
};
export default translate()(GroupsSideBar);
