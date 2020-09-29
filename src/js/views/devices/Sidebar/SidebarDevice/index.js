import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import SidebarButton from 'Components/SidebarButton';
import MaterialInput from 'Components/MaterialInput';
import { withNamespaces } from 'react-i18next';
import { FormActions } from '../../Actions';
import SidebarDelete from '../../../templates/TemplateList/Sidebar/SidebarDelete';

const SidebarDevice = ({
    hasTemplateWithImages,
    showSidebarDevice,
    handleShowManageTemplate,
    handleShowDeviceAttrs,
    toogleSidebarImages,
    device,
    handleChangeName,
    save,
    update,
    remove,
    isNewDevice,
    isShowSidebarDelete,
    toogleSidebarDelete,
    t,
    templates,
}) => {
    const {
        /* configValues, */
        dynamicValues, staticValues, actuatorValues,
    } = device;
    const total = device.templates.length ? device.templates.length : 0;

    return (
        <>
            <Slide right when={showSidebarDevice} duration={300}>
                {
                    showSidebarDevice
                        ? (
                            <div className="-sidebar device-sidebar">
                                <div className="header">
                                    <div className="title">
                                        {isNewDevice ? `${t('text.new')} ${t('devices:device')}` : device.label}
                                    </div>
                                    <div className="icon">
                                        <img src="images/icons/chip-cyan.png" alt="device-icon" />
                                    </div>
                                    <div className="header-path">
                                        {t('devices:device')}
                                    </div>
                                </div>
                                <div className="body">

                                    <div className="device-name">
                                        <div className="label">
                                            {`1.  ${t('text.set')} ${t('text.a')} ${t('text.name')} `}
                                        </div>
                                        <div className="device-name-input">
                                            <MaterialInput
                                                name="name"
                                                maxLength={40}
                                                value={device.label}
                                                onChange={(e) => handleChangeName(e.target.value)}
                                            >
                                                {t('text.name')}
                                            </MaterialInput>
                                        </div>
                                    </div>

                                    <div className="device-templates">
                                        <div className="label">
                                            {`2.  ${t('add.label')} ${t('text.or')}  ${t('remove.label')} ${t('templates:title')} `}
                                        </div>

                                        {
                                            templates.length > 0 ? (
                                                <div className="template-list">
                                                    <div
                                                        className="add-template-button"
                                                        onClick={handleShowManageTemplate}
                                                        onKeyPress={handleShowManageTemplate}
                                                        tabIndex="0"
                                                        role="button"
                                                    >
                                                        +
                                                    </div>
                                                    <div className="list">
                                                        <div className="template-bagde">
                                                            <div
                                                                className="total-attrs"
                                                            >
                                                                {total}
                                                            </div>
                                                            <div
                                                                className="template-name"
                                                            >
                                                                {t('devices:selected_templates')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="template-list">
                                                    <div className="list">
                                                        {t('templates:alerts.no_conf_templates')}
                                                    </div>
                                                </div>
                                            )
                                        }

                                    </div>

                                    <div className="device-attrs">
                                        <div className="label">
                                            {`3. ${t('devices:manage_attributes')}`}
                                        </div>
                                        {/* <SidebarButton
                                            onClick={() =>
                                            handleShowDeviceAttrs(configValues,
                                             t('text.configuration'))}
                                            icon="config_attrs"
                                            title={t('text.configuration')}
                                            disable={configValues.length === 0}
                                        /> */}
                                        <SidebarButton
                                            onClick={() => handleShowDeviceAttrs(staticValues, t('text.static_values'))}
                                            icon="data_attrs"
                                            title={t('text.static_values')}
                                            disable={staticValues.length === 0}
                                        />
                                        <SidebarButton
                                            onClick={() => handleShowDeviceAttrs(dynamicValues, t('text.dynamic_attributes'))}
                                            icon="data_attrs"
                                            title={t('text.dynamic_attributes')}
                                            disable={dynamicValues.length === 0}
                                        />
                                        <SidebarButton
                                            onClick={() => handleShowDeviceAttrs(actuatorValues, t('text.actuators'))}
                                            icon="config_attrs"
                                            title={t('text.actuators')}
                                            disable={actuatorValues.length === 0}
                                        />
                                        {hasTemplateWithImages ? (
                                            <SidebarButton
                                                onClick={() => toogleSidebarImages()}
                                                icon="firmware"
                                                title={t('devices:manage_firmware')}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                                <div className="footer">
                                    {
                                        isNewDevice ? (
                                            <>
                                                <DojotBtnClassic
                                                    type="secondary"
                                                    label={t('discard.label')}
                                                    onClick={() => {
                                                        FormActions.toggleSidebarDevice(false);
                                                    }}
                                                />
                                                {
                                                    templates.length > 0 ? (
                                                        <DojotBtnClassic
                                                            color="red"
                                                            label={t('save.label')}
                                                            type="primary"
                                                            onClick={save}
                                                        />
                                                    ) : (
                                                        ''
                                                    )
                                                }
                                            </>
                                        ) : (
                                            <>
                                                <DojotBtnClassic
                                                    type="secondary"
                                                    label={t('discard.label')}
                                                    onClick={() => {
                                                        FormActions.toggleSidebarDevice(false);
                                                    }}
                                                />
                                                <DojotBtnClassic
                                                    label={t('remove.label')}
                                                    type="secondary"
                                                    onClick={() => toogleSidebarDelete()}
                                                />

                                                <DojotBtnClassic
                                                    color="red"
                                                    label={t('save.label')}
                                                    type="primary"
                                                    onClick={update}
                                                />

                                            </>
                                        )
                                    }
                                </div>
                            </div>
                        )
                        : <div />
                }
            </Slide>
            <SidebarDelete
                cancel={toogleSidebarDelete}
                confirm={remove}
                showSidebar={isShowSidebarDelete}
                message={t('qst_remove', { label: t('devices:device') })}
            />
        </>
    );
};

SidebarDevice.propTypes = {
    showSidebarDevice: PropTypes.bool,
    handleShowManageTemplate: PropTypes.func.isRequired,
    handleShowDeviceAttrs: PropTypes.func.isRequired,
    toogleSidebarImages: PropTypes.func.isRequired,
    device: PropTypes.shape({
        attrs: PropTypes.array,
        created: PropTypes.string,
        id: PropTypes.string,
        label: PropTypes.string,
        static_attrs: PropTypes.array,
        status: PropTypes.string,
        tags: PropTypes.array,
        templates: PropTypes.array,
        updated: PropTypes.string,
    }).isRequired,
    t: PropTypes.func.isRequired,
    hasTemplateWithImages: PropTypes.bool.isRequired,
    handleChangeName: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    isNewDevice: PropTypes.bool.isRequired,
    isShowSidebarDelete: PropTypes.bool.isRequired,
    toogleSidebarDelete: PropTypes.func.isRequired,
    templates: PropTypes.func.isRequired,
};

SidebarDevice.defaultProps = {
    showSidebarDevice: false,
};
export default withNamespaces()(SidebarDevice);
