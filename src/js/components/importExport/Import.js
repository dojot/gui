import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-i18next';
import { FilePond, File, registerPlugin } from 'react-filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import ability from 'Components/permissions/ability';
import toaster from '../../comms/util/materialize';
import ImportExport from './ImportExport';
import HeadImportExport from './HeadImportExport';
import ModalAlert from './ModalAlert';
import ImportExportAction from '../../actions/ImportExportAction';

registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

class Import extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            showLoading: false,
            file: [],
        };
        this.pond = createRef();
        this.file = createRef();
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.openModal = this.openModal.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
    }

    handleOpenModal() {
        const { t } = this.props;
        const { file } = this.state;
        if (file.length === 0) {
            return toaster.error(t('importExport:import.error.file'));
        }
        if (file[0].type !== 'application/json') {
            return toaster.error(t('importExport:import.error.type'));
        }
        return this.setState({ showModal: true });
    }

    openModal(status) {
        this.setState({ showModal: status });
    }

    showLoading(status) {
        this.setState({ showLoading: status });
    }

    success(status) {
        this.setState({ success: status });
    }

    handleSuccess() {
        global.location.reload();
    }

    uploadFile() {
        const { t } = this.props;
        const { file } = this.state;
        const text = file[0];
        if (file.length > 0) {
            const reader = new global.FileReader();
            reader.readAsText(text, 'UTF-8');
            reader.onload = async (evt) => {
                let json = '';
                try {
                    this.showLoading(true);
                    json = JSON.parse(evt.target.result);
                    await ImportExportAction.import(json);
                    this.success(true);
                } catch (err) {
                    toaster.error(t('importExport:import.error.read'));
                    this.openModal(false);
                }
                this.showLoading(false);
            };
            reader.onerror = () => {
                toaster.error(t('importExport:import.error.read'));
            };
        } else {
            toaster.error(t('importExport:import.error.file'));
        }
        this.showLoading(false);
    }

    render() {
        const {
            showModal,
            showLoading,
            file,
            success,
        } = this.state;

        const { t, openModal, closeModal } = this.props;
        const label = t('importExport:import.btnModal');
        const title = t('importExport:import.titleModal');
        const firstMessage = t('importExport:import.subtitleModal');

        const canSeeImport = ability.can('modifier', 'data-manager-import');

        return (
            <div>
                <ImportExport openModal={openModal} closeModal={closeModal} toggleSidebar={closeModal} save label={t('importExport:import.title')} handleClick={this.handleOpenModal}>
                    {canSeeImport ? (
                        <HeadImportExport
                            main
                            icon="import-icon"
                            title={t('importExport:import.titleMain')}
                            firstMessage={t('importExport:import.subtitle')}
                        />
                    ) : <div />}
                    <FilePond
                        ref={this.pond}
                        onupdatefiles={(fileItems) => {
                            this.setState({
                                file: fileItems.map(fileItem => fileItem.file),
                            });
                        }}
                        allowFileTypeValidation
                        acceptedFileTypes={['application/json']}
                        allowFileSizeValidation
                        maxTotalFileSize={314572800}
                    >
                        {file.map(files => (
                            <File
                                key={files}
                                src={files}
                                origin="local"
                            />
                        ))}
                    </FilePond>
                    {showModal ? (
                        <ModalAlert
                            title={title}
                            openModal={this.openModal}
                            firstMessage={firstMessage}
                            label={label}
                            click={this.uploadFile}
                            img="warning"
                            cancel
                            back={closeModal}
                        />
                    ) : null}
                    {showLoading ? (
                        <div className="row confirm-modal-import">
                            <img className="load-icon" src="images/gifs/loader.gif" alt="" />
                        </div>
                    ) : null}
                    {success ? (
                        <ModalAlert
                            title={t('importExport:import.titleSuccess')}
                            openModal={this.openModal}
                            firstMessage={t('importExport:import.subtitleSuccess')}
                            label={label}
                            click={this.handleSuccess}
                            img="check-circle"
                            back={this.handleSuccess}
                        />
                    ) : null}
                </ImportExport>
            </div>
        );
    }
}

Import.propTypes = {
    openModal: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default translate()(Import);
