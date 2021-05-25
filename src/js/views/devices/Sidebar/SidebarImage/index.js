import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import ImageActions from 'Actions/ImageActions';
import HistoryActions from 'Actions/HistoryActions';
import MaterialSelect from 'Components/MaterialSelect';
import SidebarFirmImages
    from 'Views/templates/TemplateList/Sidebar/SidebarFirmware/SidebarFirmImages';
import SidebarButton from 'Views/templates/TemplateList/Sidebar/SidebarButton';
import DeviceActions from 'Actions/DeviceActions';
import toaster from 'Comms/util/materialize';
import { withNamespaces } from 'react-i18next';
import ability from 'Components/permissions/ability';
import { GenericModal } from 'Components/Modal';
import {
    FW_RESULT_META_LABEL,
    FW_VERSION_META_LABEL,
    FW_STATE_META_LABEL,
    FW_TRANSFER_META_LABEL,
    FW_APPLY_META_LABEL,
} from 'Comms/firmware/FirmwareMetasConst';
import FWSocketIO from './FWSocketIO';

const StateFirmwareDevice = (props) => {
    const {
        version, state, result, transferred, t, showTransferred, showTransferring, showApplying,
    } = props;

    let labelTransfer = '';
    if (showTransferred) {
        labelTransfer = t('firmware:default_attrs.transferred');
    } else if (showTransferring) {
        labelTransfer = t('firmware:default_attrs.transferring');
    } else if (showApplying) {
        labelTransfer = t('firmware:default_attrs.applying');
    }

    return (
        <div className="info firmware-enabled">
            <div className="title-info">
                {t('firmware:title_info')}
            </div>
            <div className="desc">
                <div className="info-group">
                    <div className="label">
                        {t('firmware:default_attrs.current_version')}
                    </div>

                    <div className="value">
                        {version || t('firmware:no_data')}
                    </div>
                </div>
                <div className="info-group">
                    <div className="label">
                        {t('firmware:default_attrs.state')}
                    </div>
                    <div className="value">
                        {state !== undefined && state !== null ? `${t(`firmware:state.${state}`)} (${state})` : t('firmware:no_data')}
                    </div>
                </div>
                <div className="info-group">
                    <div className="label">
                        {t('firmware:default_attrs.update_result')}
                    </div>
                    <div className="value">
                        {result !== undefined && result !== null ? `${t(`firmware:result.${result}`)} (${result})` : t('firmware:no_data')}
                    </div>
                </div>
                {showTransferred || showTransferring || showApplying
                    ? (
                        <div className="info-group">
                            <div className="label">
                                {labelTransfer}
                            </div>
                            <div className="value">
                                {transferred !== undefined && transferred !== null && transferred !== '' ? transferred : t('firmware:no_data')}
                            </div>
                        </div>
                    ) : null}
            </div>
        </div>
    );
};

StateFirmwareDevice.propTypes = {
    result: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
    transferred: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
    showTransferred: PropTypes.bool.isRequired,
    showTransferring: PropTypes.bool.isRequired,
    showApplying: PropTypes.bool.isRequired,
};

function BtnActionImgFirmware(props) {
    const {
        title, label, onClick, enable,
    } = props;
    return (
        <DojotBtnClassic
            type="primary"
            title={title}
            onClick={onClick}
            label={label}
            moreClasses={enable ? '' : 'btn-disable'}
        />
    );
}

BtnActionImgFirmware.propTypes = {
    title: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    enable: PropTypes.bool.isRequired,
};

const ImgToTransfer = (props) => {
    const {
        currentImgId,
        onChange,
        options,
        onClickBtnTransfer,
        onClickBtnApply,
        onClickBtnReset,
        t,
        enableBtnTransfer,
        enableBtnApply,
        enableBtnReset,
        transferredVersion,
    } = props;

    return (
        <div className="image-up">
            <div className="header2">
                {t('firmware:alerts.image_to_transfer')}
            </div>
            <div className="cid_select">
                <MaterialSelect
                    id="flr_images"
                    name="images"
                    label={t('firmware:labels.available')}
                    value={currentImgId}
                    onChange={onChange}
                >
                    {options}
                </MaterialSelect>
            </div>
            <div className="btn-action">
                <BtnActionImgFirmware
                    title={t('firmware:labels.transfer_alt')}
                    onClick={onClickBtnTransfer}
                    enable={enableBtnTransfer}
                    label={t('firmware:labels.transfer')}
                />
            </div>
            <div className="header2">
                {t('firmware:alerts.apply_the_image', { image: transferredVersion })}
            </div>
            <div className="btn-action">
                <BtnActionImgFirmware
                    title={t('firmware:labels.apply_alt')}
                    onClick={onClickBtnApply}
                    enable={enableBtnApply}
                    label={t('firmware:labels.apply')}
                />
            </div>
            <div className="header2">
                {t('firmware:alerts.image_reset_header')}
            </div>
            <div className="btn-action">
                <BtnActionImgFirmware
                    title={t('firmware:labels.reset_alt')}
                    onClick={onClickBtnReset}
                    enable={enableBtnReset}
                    label={t('firmware:labels.reset')}
                />
            </div>
        </div>
    );
};

ImgToTransfer.propTypes = {
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.any).isRequired,
    onClickBtnTransfer: PropTypes.func.isRequired,
    currentImgId: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
    onClickBtnApply: PropTypes.func.isRequired,
    onClickBtnReset: PropTypes.func.isRequired,
    enableBtnApply: PropTypes.bool.isRequired,
    enableBtnTransfer: PropTypes.bool.isRequired,
    enableBtnReset: PropTypes.bool.isRequired,
    transferredVersion: PropTypes.string.isRequired,
};

class SidebarImage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            showFirmwareImage: false,
            showApplyModal: false,
            attrs: {
                fwUpdateState: undefined,
                fwUpdateResult: undefined,
                fwUpdateVersion: undefined,
                fwUpdateTransferred: undefined,
            },
            currentImageId: '0',
        };

        this.callUploadImage = this.callUploadImage.bind(this);
        this.callApplyImage = this.callApplyImage.bind(this);
        this.toogleSidebarFirmImage = this.toogleSidebarFirmImage.bind(this);
        this.createImageOptions = this.createImageOptions.bind(this);
        this.onChangeImage = this.onChangeImage.bind(this);
        this.getAttrLabel = this.getAttrLabel.bind(this);
        this.receivedImageInformation = this.receivedImageInformation.bind(this);
        this.showModalApply = this.showModalApply.bind(this);
        this.handleModalApply = this.handleModalApply.bind(this);
        this.callResetMachine = this.callResetMachine.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.templateIdAllowedImage !== state.templateIdAllowedImage) {
            return {
                ...state,
                templateIdAllowedImage: props.templateIdAllowedImage,
                loaded: false,
            };
        }
        const { is: { history } } = props;
        if (state.attrs.fwUpdateVersion !== history.version
            || state.attrs.fwUpdateResult !== history.result
            || state.attrs.fwUpdateState !== history.state
            || state.attrs.fwUpdateTransferred !== history.transfer) {
            return {
                ...state,
                attrs: {
                    ...state.attrs,
                    fwUpdateVersion: history.version,
                    fwUpdateState: history.state,
                    fwUpdateResult: history.result,
                    fwUpdateTransferred: history.transfer,
                },
            };
        }

        return null;
    }

    componentDidUpdate() {
        const { loaded, templateIdAllowedImage } = this.state;
        if (!loaded && templateIdAllowedImage !== '') {
            const { deviceId } = this.props;
            ImageActions.fetchImages.defer(templateIdAllowedImage);
            DeviceActions.fetchSingle.defer(deviceId);

            const stateLbAttr = this.getAttrLabel(FW_STATE_META_LABEL);
            const resultLbAttr = this.getAttrLabel(FW_RESULT_META_LABEL);
            const versionLbAttr = this.getAttrLabel(FW_VERSION_META_LABEL);
            const transLbAttr = this.getAttrLabel(FW_TRANSFER_META_LABEL);

            HistoryActions.fetchLastAttrDataByDeviceIDAndAttrLabel.defer(deviceId, stateLbAttr, 'state');
            HistoryActions.fetchLastAttrDataByDeviceIDAndAttrLabel.defer(deviceId, resultLbAttr, 'result');
            HistoryActions.fetchLastAttrDataByDeviceIDAndAttrLabel.defer(deviceId, versionLbAttr, 'version');
            HistoryActions.fetchLastAttrDataByDeviceIDAndAttrLabel.defer(deviceId, transLbAttr, 'transfer');

            FWSocketIO.disconnect();
            FWSocketIO.connect(deviceId, this.receivedImageInformation);

            this.setState({
                loaded: true,
            });
        }
    }

    onChangeImage(e) {
        const newImageId = e.target.value;
        this.setState({
            currentImageId: newImageId,
        });
    }

    getAttrLabel(labelMeta) {
        const { deviceId, ds } = this.props;
        const { templateIdAllowedImage: templateId } = this.state;
        const device = ds.devices[deviceId];
        let relatedLabel = '';
        if (!device || !device.attrs
            || device.attrs.length < 1 || device.attrs.length === undefined) {
            return relatedLabel;
        }
        device.attrs[templateId].forEach((attr) => {
            if (attr.metadata) {
                const el = attr.metadata.filter(meta => meta.label === labelMeta);
                if (el.length) {
                    relatedLabel = attr.label;
                } // found the attr
            }
        });
        return relatedLabel;
    }

    receivedImageInformation(data) {
        const { attrs: attrsReceive } = data;
        const { deviceId } = this.props;
        const stateLabel = this.getAttrLabel(FW_STATE_META_LABEL);
        const state = attrsReceive[stateLabel];
        if (typeof state === 'number') {
            HistoryActions.updateAttrHistory.defer(deviceId, stateLabel, state, 'state');
        }

        const resultLabel = this.getAttrLabel(FW_RESULT_META_LABEL);
        const result = attrsReceive[resultLabel];
        if (typeof result === 'number') {
            HistoryActions.updateAttrHistory.defer(deviceId, resultLabel, result, 'result');
        }

        const versionLabel = this.getAttrLabel(FW_VERSION_META_LABEL);
        const version = attrsReceive[versionLabel];
        if (typeof version === 'string') {
            HistoryActions.updateAttrHistory.defer(deviceId, versionLabel, version, 'version');
        }
        const transferredLabel = this.getAttrLabel(FW_TRANSFER_META_LABEL);
        const transferred = attrsReceive[transferredLabel];
        if (typeof transferred === 'string') {
            HistoryActions.updateAttrHistory.defer(deviceId, transferredLabel, transferred, 'transfer');
        }
    }

    callUploadImage() {
        const { t, deviceId, is: { images } } = this.props;
        const { currentImageId } = this.state;
        if (currentImageId === '0') {
            toaster.warning(t('firmware:alerts.valid_image'));
            return;
        }

        const uploadImageAlias = this.getAttrLabel(FW_TRANSFER_META_LABEL);
        const dataToBeSent = { attrs: {} };
        dataToBeSent.attrs[uploadImageAlias] = images[currentImageId].fw_version;
        DeviceActions.triggerActuator(deviceId, dataToBeSent, () => {
            toaster.warning(t('firmware:alerts.image_transferred'));
        });
    }

    callResetMachine() {
        const { t, deviceId } = this.props;
        const uploadImageAlias = this.getAttrLabel(FW_TRANSFER_META_LABEL);
        const dataToBeSent = { attrs: {} };
        dataToBeSent.attrs[uploadImageAlias] = '';

        DeviceActions.triggerActuator(deviceId, dataToBeSent, () => {
            toaster.warning(t('firmware:alerts.image_reset'));
        });
    }

    callApplyImage() {
        const { t, deviceId } = this.props;
        const applyAlias = this.getAttrLabel(FW_APPLY_META_LABEL);
        const dataToBeSent = { attrs: {} };
        dataToBeSent.attrs[applyAlias] = '1';
        // value used to notify device to apply its image
        DeviceActions.triggerActuator(deviceId, dataToBeSent, () => {
            toaster.warning(t('firmware:alerts.image_applied'));
        });

        this.setState({ showApplyModal: false });
    }

    toogleSidebarFirmImage() {
        const { showFirmwareImage } = this.state;
        this.setState({
            showFirmwareImage: !showFirmwareImage,
        });
    }

    createImageOptions() {
        const { t } = this.props;
        const items = [];
        items.push(
            <option
                key="selectedImage"
                value="0"
            >
                {t('firmware:labels.select_image')}
            </option>,
        );
        const { is: { images } } = this.props;
        if (Object.keys(images).length) {
            Object.values(images)
                .forEach((el) => {
                    items.push(<option key={el.id} value={el.id}>{el.fw_version}</option>);
                });
        }
        return items;
    }

    showModalApply() {
        this.setState({ showApplyModal: true });
    }

    handleModalApply(status) {
        this.setState({ showApplyModal: status });
    }

    render() {
        const {
            t, toogleSidebarImages, showSidebarImage, is,
        } = this.props;
        const { images } = is;
        const {
            attrs, showFirmwareImage, templateIdAllowedImage, currentImageId, showApplyModal,
        } = this.state;
        const listAvailableOptionsImages = this.createImageOptions();
        const fwImageModifier = ability.can('modifier', 'image');

        const {
            fwUpdateState: state,
            fwUpdateResult: result,
            fwUpdateTransferred: transferredVersion,
        } = attrs;

        // enable Transfer if state is 0 or 2  and img was selected
        let enableBtnTransfer = false;
        if (state === 0 && currentImageId !== '0') {
            enableBtnTransfer = true;
        }

        // enable apply img if state=2 and result=0 ou 8
        let enableBtnApply = false;
        if (state === 2 && (result === 0 || result === 8)) {
            enableBtnApply = true;
        }

        // enable reset cycle if state=2
        let enableBtnReset = false;
        if (state === 2) {
            enableBtnReset = true;
        }

        const showTransferring = state === 1;
        const showTransferred = state === 2;
        const showApplying = state === 3;

        return (
            <>
                {showApplyModal ? (
                    <GenericModal
                        title={t('firmware:labels.title_modal_apply')}
                        first_message={t('firmware:labels.qst_apply_image', {
                            image: transferredVersion,
                        })}
                        openModal={this.handleModalApply}
                        click={this.callApplyImage}
                        op_type={{ label: t('firmware:labels.btn_apply') }}
                    />
                ) : <div />}
                <Slide right when={showSidebarImage} duration={300}>
                    {showSidebarImage
                        ? (
                            <div className="sidebar-firmware">
                                <div className="header">
                                    <div className="title">{t('firmware:update_firmware')}</div>
                                    <div className="icon">
                                        <img src="images/firmware-red.png" alt="firmware-icon" />
                                    </div>
                                    <div className="header-path">
                                        {`${t('devices:device')} > ${t('firmware:update_firmware')}`}
                                    </div>
                                </div>

                                <div className="body box-image-info">
                                    <div className="sub-content">
                                        <div className="body-form-fw">
                                            <ImgToTransfer
                                                currentImgId={this.currentImageId}
                                                onChange={e => this.onChangeImage(e)}
                                                options={listAvailableOptionsImages}
                                                onClickBtnTransfer={this.callUploadImage}
                                                onClickBtnApply={this.showModalApply}
                                                onClickBtnReset={this.callResetMachine}
                                                enableBtnTransfer={enableBtnTransfer}
                                                enableBtnApply={enableBtnApply}
                                                enableBtnReset={enableBtnReset}
                                                t={t}
                                                transferredVersion={transferredVersion}
                                            />
                                            <StateFirmwareDevice
                                                version={attrs.fwUpdateVersion}
                                                result={attrs.fwUpdateResult}
                                                state={attrs.fwUpdateState}
                                                transferred={attrs.fwUpdateTransferred}
                                                t={t}
                                                showTransferring={showTransferring}
                                                showTransferred={showTransferred}
                                                showApplying={showApplying}
                                            />
                                        </div>

                                    </div>
                                    <div className="body-actions">
                                        <SidebarButton
                                            onClick={() => this.toogleSidebarFirmImage()}
                                            icon="firmware"
                                            text={t('firmware:btn_manage_images')}
                                            title={t('firmware:btn_manage_images_alt')}
                                        />
                                    </div>
                                </div>
                                <div className="footer">
                                    <>
                                        <DojotBtnClassic
                                            label={t('firmware:labels.close')}
                                            type="secondary"
                                            onClick={toogleSidebarImages}
                                        />
                                    </>
                                </div>
                            </div>
                        )
                        : <div />}
                </Slide>
                {fwImageModifier
                    ? (
                        <SidebarFirmImages
                            showFirmware={showFirmwareImage}
                            templateId={templateIdAllowedImage}
                            images={images}
                            toogleSidebarFirmware={this.toogleSidebarFirmImage}
                        />
                    ) : null}
            </>
        );
    }
}

SidebarImage.defaultProps = {
    showSidebarImage: false,
    deviceId: '',
    is: {},
    ds: {},
};

SidebarImage.propTypes = {
    t: PropTypes.func.isRequired,
    deviceId: PropTypes.string,
    showSidebarImage: PropTypes.bool,
    toogleSidebarImages: PropTypes.func.isRequired,
    is: PropTypes.shape({
        images: PropTypes.shape({}),
    }),
    ds: PropTypes.shape({
        devices: PropTypes.shape({}),
    }),
};

export default withNamespaces()(SidebarImage);
