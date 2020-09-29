import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import Can from 'Components/permissions/Can';
import { withNamespaces } from 'react-i18next';
import SidebarForm from './SidebarForm';
import SidebarDelete from '../SidebarDelete';
import { templateType } from '../../../TemplatePropTypes';

const SidebarTemplate = ({
    template,
    showSidebar,
    toogleSidebar,
    toogleSidebarAttribute,
    toogleSidebarFirmware,
    changeValue,
    saveTemplate,
    updateTemplate,
    isNewTemplate,
    toogleSidebarDelete,
    deleteTemplate,
    showDeleteTemplate,
    t,
}) => (
    <>
        <Slide right when={showSidebar} duration={300}>
            {showSidebar
                ? (
                    <div className="template-sidebar">
                        <div className="header">
                            <div className="title">{isNewTemplate ? t('templates:title_sidebar.default') : template.label}</div>
                            <div className="icon">
                                <img src="images/icons/template-cyan.png" alt="device-icon" />
                            </div>
                            <div className="header-path">
                                {t('templates:template')}
                            </div>
                        </div>
                        <SidebarForm
                            isNewTemplate={isNewTemplate}
                            template={template}
                            toogleSidebarAttribute={toogleSidebarAttribute}
                            toogleSidebarFirmware={toogleSidebarFirmware}
                            changeValue={changeValue}
                        />
                        <div className="footer">
                            <DojotBtnClassic
                                type="secondary"
                                label={t('discard.label')}
                                onClick={() => toogleSidebar()}
                            />
                            {isNewTemplate
                                ? (
                                    <Can do="modifier" on="template">
                                        <DojotBtnClassic
                                            color="blue"
                                            type="primary"
                                            label={t('save.label')}
                                            onClick={saveTemplate}
                                        />
                                    </Can>
                                )
                                : (
                                    <>
                                        <Can do="modifier" on="template">
                                            <DojotBtnClassic label={t('remove.label')} type="secondary" onClick={() => toogleSidebarDelete('showDeleteTemplate')} />
                                            <DojotBtnClassic color="red" label={t('save.label')} type="primary" onClick={updateTemplate} />
                                        </Can>
                                    </>
                                )}
                        </div>
                    </div>
                )
                : <div />}
        </Slide>
        <SidebarDelete
            cancel={() => toogleSidebarDelete('showDeleteTemplate')}
            confirm={deleteTemplate}
            showSidebar={showDeleteTemplate}
            message={t('templates:alerts.qst_remove', { label: t('templates:template') })}
        />
    </>
);

SidebarTemplate.defaultProps = {
    showSidebar: false,
    showDeleteTemplate: false,
    isNewTemplate: false,
};

SidebarTemplate.propTypes = {
    template: PropTypes.shape(templateType).isRequired,
    showSidebar: PropTypes.bool,
    toogleSidebar: PropTypes.func.isRequired,
    toogleSidebarAttribute: PropTypes.func.isRequired,
    toogleSidebarFirmware: PropTypes.func.isRequired,
    changeValue: PropTypes.func.isRequired,
    saveTemplate: PropTypes.func.isRequired,
    updateTemplate: PropTypes.func.isRequired,
    isNewTemplate: PropTypes.bool,
    toogleSidebarDelete: PropTypes.func.isRequired,
    deleteTemplate: PropTypes.func.isRequired,
    showDeleteTemplate: PropTypes.bool,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(SidebarTemplate);
