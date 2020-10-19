import React from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import { withNamespaces } from 'react-i18next';
import AttrCard from './AttrCard';

const SidebarDeviceAttrs = ({
    showDeviceAttrs,
    validAttrs,
    handleShowDeviceAttrsDiscard,
    selectAttr,
    handleChangeMetadata,
    handleChangeMeta,
    handleChangeAttr,
    deviceAttrsTitle,
    errors,
    t,
}) => (
    <Slide right when={showDeviceAttrs} duration={300}>
        {
                showDeviceAttrs
                    ? (
                        <div className="sidebar-device-attrs">
                            <div className="header">
                                <div className="title">
                                    {t('devices:manage_attributes')}
                                </div>
                                <div className="icon">
                                    <img src="images/icons/chip-cyan.png" alt="device-icon" />
                                </div>
                            </div>
                            <div className="body">
                                <div className="title">
                                    {`${t('devices:device')} > ${t('text.attribute')}`}
                                </div>
                                <div className="attr-type">
                                    {deviceAttrsTitle}
                                </div>
                                <div className="attrs-list">
                                    {
                                        selectAttr.map((attr) => (
                                            <AttrCard
                                                attr={attr}
                                                key={attr.id}
                                                handleChangeAttr={handleChangeAttr}
                                                handleChangeMetadata={handleChangeMetadata}
                                                handleChangeMeta={handleChangeMeta}
                                                errors={errors[attr.id]}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                            <div className="footer">
                                <DojotBtnClassic
                                    onClick={() => handleShowDeviceAttrsDiscard()}
                                    label={t('discard.label')}
                                    type="secondary"
                                />
                                <DojotBtnClassic
                                    onClick={() => validAttrs(selectAttr)}
                                    label={t('save.label')}
                                    type="primary"
                                    color="red"
                                    id="btn-save-attrs"
                                />
                            </div>
                        </div>
                    )
                    : <div />
            }
    </Slide>
    );

SidebarDeviceAttrs.defaultProps = {
    showDeviceAttrs: false,
};

SidebarDeviceAttrs.propTypes = {
    showDeviceAttrs: PropTypes.bool,
    validAttrs: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    handleShowDeviceAttrsDiscard: PropTypes.func.isRequired,
};

export default withNamespaces()(SidebarDeviceAttrs);
