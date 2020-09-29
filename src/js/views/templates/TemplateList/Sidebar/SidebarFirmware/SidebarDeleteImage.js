import React from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';

import { DojotBtnClassic } from 'Components/DojotButton';
import { withNamespaces } from 'react-i18next';

const SidebarDeleteImage = ({
    showSidebar, message, toggleSidebar, confirm, t,
}) => (
    <Slide right when={showSidebar} duration={300}>
        {
            showSidebar
                ? (
                    <div className="sidebar-delete sidebar-firmware">
                        <div className="header">
                            <div className="title">
                                {t('firmware:remove_image_header')}
                            </div>
                            <div className="icon">
                                <img src="images/firmware-red.png" alt="device-icon" />
                            </div>
                        </div>
                        <div className="body">
                            <div className="sidebar-delete-message">
                                {message}
                            </div>
                        </div>
                        <div className="footer">
                            <div className="sidebar-delete-action">
                                <DojotBtnClassic
                                    type="secondary"
                                    label={t('cancel.label')}
                                    onClick={(e) => toggleSidebar(e, null)}
                                />
                                <DojotBtnClassic
                                    color="red"
                                    type="primary"
                                    label={t('confirm.label')}
                                    onClick={confirm}
                                />
                            </div>
                        </div>
                    </div>
                )
                : <div />
        }
    </Slide>
);

SidebarDeleteImage.defaultProps = {
    showSidebar: false,
};

SidebarDeleteImage.propTypes = {
    showSidebar: PropTypes.bool,
    message: PropTypes.string.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};
export default withNamespaces()(SidebarDeleteImage);
