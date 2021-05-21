import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-i18next';
import ability from 'Components/permissions/ability';
import ImportExportAction from '../../actions/ImportExportAction';
import ImportExport from './ImportExport';
import HeadImportExport from './HeadImportExport';
import Import from './Import';

class ImportExportMain extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openImport: false,
        };
        this.handleImport = this.handleImport.bind(this);
        this.openImport = this.openImport.bind(this);
        this.handleExport = this.handleExport.bind(this);
        this.dismiss = this.dismiss.bind(this);
    }

    handleImport() {
        this.setState({ openImport: true });
    }

    openImport(status) {
        this.setState({ openImport: status });
    }

    handleExport() {
        ImportExportAction.export();
        this.dismiss();
    }

    dismiss() {
        const { openModal, toggleSidebar } = this.props;
        openModal(false);
        toggleSidebar();
    }

    render() {
        const { openModal, toggleSidebar, t } = this.props;
        const { openImport } = this.state;

        const canSeeImport = ability.canModify('data-manager-import');
        const canSeeExport = ability.canView('data-manager-export');

        return (
            <div>
                <ImportExport
                    openModal={openModal}
                    toggleSidebar={toggleSidebar}
                    save={false}
                    closeModal={this.dismiss}
                >
                    <div className="">
                        <HeadImportExport
                            main
                            icon="import-export-icon"
                            title={t('importExport:title')}
                            firstMessage=""
                        />
                    </div>
                    {canSeeImport ? (
                        <div className="">
                            <HeadImportExport
                                handleClick={this.handleImport}
                                icon="import-icon"
                                title={t('importExport:import.titleMain')}
                                firstMessage={t('importExport:import.subtitleMain')}
                            />
                        </div>
                    ) : <div />}
                    {canSeeExport ? (
                        <div className="">
                            <HeadImportExport
                                handleClick={this.handleExport}
                                icon="export-icon"
                                title={t('importExport:export.title')}
                                firstMessage={t('importExport:export.subtitle')}
                            />
                        </div>
                    ) : <div />}
                </ImportExport>
                {
                    openImport ? (
                        <Import
                            openModal={this.openImport}
                            closeModal={this.dismiss}
                        />
                    ) : null
                }
            </div>
        );
    }
}

ImportExportMain.propTypes = {
    openModal: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
};

export default translate()(ImportExportMain);
