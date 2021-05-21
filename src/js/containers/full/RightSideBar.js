import { GUI_VERSION } from 'Src/config';
import toaster from "Comms/util/materialize";
import PropTypes from "prop-types";
import React, { useState } from 'react';
import { hashHistory } from 'react-router';
import ability from 'Components/permissions/ability';
import LoginActions from '../../actions/LoginActions';
import ImportExportMain from '../../components/importExport/ImportExportMain';


const RightSideBar = ({ t, user, toggleSidebar }) => {
    const [openImportExport, setOpenImportExport] = useState(false);

    const logout = (e) => {
        e.preventDefault();
        LoginActions.logout();
        hashHistory.push('/login');
    }

    const toggleImportExportModal = (status) => {
        setOpenImportExport(status);
    }

    const handleImportExport = () => {
        setOpenImportExport(true);
    }

    if (user === undefined) {
        toaster.error('no active user session');
        return null;
    }

    const canSeeImportOrExport = ability.can('modifier', 'data-manager-import')
        || ability.can('viewer', 'data-manager-export')
        || ability.can('modifier', 'data-manager-export');

    return (

        <div className="" >
            <div className="rightsidebarchild">
                <div className="logout-page-header">
                    <div className="col s12 m12">
                        <div className="logout-page-subtitle">{t('text.logged_as')}</div>
                    </div>

                    <div className="col s12 m12">
                        <div className="logout-page-info col s12 truncate">
                            {user.username}
                        </div>
                    </div>

                    {user.email !== undefined && (
                        <div>
                            <div className="col s12 m12">
                                <div className="logout-page-subtitle">
                                    {' '}
                                    {t('email.label')}
                                </div>
                            </div>

                            <div className="col s12 m12">
                                <div className="logout-page-info truncate">
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="col s12 m12">
                        <div className="logout-page-subtitle">{t('text.tenant')}</div>
                    </div>

                    <div className="col s12 m12">
                        <div className="logout-page-info col s12 truncate">
                            {user.tenant}
                        </div>
                    </div>

                    <div>
                        <div className="col s12 m12">
                            <div className="logout-page-subtitle">{t('text.version')}</div>
                        </div>

                        <div className="col s12 m12">
                            <div className="logout-page-info truncate">
                                {GUI_VERSION || t('text.not_found')}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="horizontal-line" />
                {canSeeImportOrExport ? (
                    <div className="logout-page-settings">
                        <div
                            className="logout-page-changePassword col s12 m12"
                            role="button"
                            tabIndex={0}
                            onKeyPress={handleImportExport}
                            onClick={handleImportExport}
                        >
                            {t('text.import_export')}
                        </div>
                    </div>
                ) : <div />
                }

                <div className="horizontal-line" />

                <div className="logout-page-buttons">
                    <div className="btn-logout"
                        role="button"
                        tabIndex={0}
                        onKeyPress={logout}
                        onClick={logout}>
                        {t('text.logout')}
                    </div>
                </div>
            </div>
            {
                openImportExport
                    ? (
                        <ImportExportMain
                            type="main"
                            openModal={toggleImportExportModal}
                            toggleSidebar={toggleSidebar}
                        />
                    )
                    : <div />
            }
        </div >
    )
}

RightSideBar.defaultProps = {
    user: null,
}

RightSideBar.propTypes = {
    t: PropTypes.func.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    user: PropTypes.shape({
        username: PropTypes.string.isRequired,
        name: PropTypes.string,
        email: PropTypes.string,
        tenant: PropTypes.string,
    }),
}


export default RightSideBar;