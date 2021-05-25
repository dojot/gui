import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import Can from 'Components/permissions/Can';
import { withNamespaces } from 'react-i18next';
import SidebarAttributeForm from './SidebarAttributeForm';
import SidebarConfigurationForm from './SidebarConfigurationForm';
import MetadataList from './MetadataList';
import SidebarButton from '../SidebarButton';
import SidebarDelete from '../SidebarDelete';
import { attrsType, templateType } from '../../../TemplatePropTypes';

const SidebarAttribute = ({
    showAttribute,
    changeAttrValue,
    toogleSidebarAttribute,
    toogleSidebarMetadata,
    selectAttr,
    updateTemplateAttr,
    addTemplateAttr,
    newAttr,
    removeSelectAttr,
    toogleSidebarDelete,
    showDeleteAttr,
    selectMetadata,
    t,
    template,
}) => (
    <Fragment>
        <Slide right when={showAttribute} duration={300}>
            {showAttribute
                ? (
                    <div className="-sidebar sidebar-attribute">
                        <div className="header">
                            <div className="title">
                                {`${newAttr ? t('templates:title_sidebar.new_attr') : t(template.label)}`}
                            </div>
                            <div className="icon">
                                <img src="images/icons/template-cyan.png" alt="device-icon" />
                            </div>
                            <div className="header-path">
                                {`template > ${newAttr ? t('templates:title_sidebar.new_attr') : t('templates:title_sidebar.edit_attr')}`}
                            </div>
                        </div>

                        <div className="body">
                            {selectAttr.attrType === 'data_attrs'
                                ? (
                                    <SidebarAttributeForm
                                        changeAttrValue={changeAttrValue}
                                        selectAttr={selectAttr}
                                    />
                                )
                                : (
                                    <SidebarConfigurationForm
                                        changeAttrValue={changeAttrValue}
                                        selectAttr={selectAttr}
                                    />
                                )}
                            <MetadataList values={selectAttr} selectMetadata={selectMetadata} />
                            <div className="body-actions">
                                <div className="body-actions--divider" />
                                <Can do="modifier" on="device-manager-template">
                                    <SidebarButton
                                        onClick={() => toogleSidebarMetadata()}
                                        icon="metadata"
                                        text={t('templates:btn.new_metadata.label')}
                                    />
                                </Can>
                            </div>
                        </div>
                        <div className="footer">
                            <DojotBtnClassic
                                label={t('discard.label')}
                                type="secondary"
                                onClick={toogleSidebarAttribute}
                            />
                            {newAttr

                                ? (
                                    <Can do="modifier" on="device-manager-template">
                                        <DojotBtnClassic
                                            color="blue"
                                            label={t('add.label')}
                                            type="primary"
                                            onClick={() => addTemplateAttr(selectAttr)}
                                        />
                                    </Can>
                                )
                                : (
                                    <Fragment>
                                        <Can do="modifier" on="device-manager-template">
                                            <DojotBtnClassic label={t('remove.label')} type="secondary" onClick={() => toogleSidebarDelete('showDeleteAttr')} />
                                            <DojotBtnClassic color="red" label={t('save.label')} type="primary" onClick={() => updateTemplateAttr(selectAttr)} />
                                        </Can>
                                    </Fragment>
                                )}
                        </div>
                    </div>
                )
                : <div />}
        </Slide>
        <SidebarDelete
            cancel={() => toogleSidebarDelete('showDeleteAttr')}
            confirm={removeSelectAttr}
            showSidebar={showDeleteAttr}
            message={t('templates:alerts.qst_remove', { label: t('templates:attribute') })}
        />
    </Fragment>
);

SidebarAttribute.defaultProps = {
    showAttribute: false,
    newAttr: false,
    showDeleteAttr: false,
};

SidebarAttribute.propTypes = {
    template: PropTypes.shape(templateType).isRequired,
    showAttribute: PropTypes.bool,
    changeAttrValue: PropTypes.func.isRequired,
    toogleSidebarAttribute: PropTypes.func.isRequired,
    toogleSidebarMetadata: PropTypes.func.isRequired,
    selectAttr: PropTypes.shape(attrsType).isRequired,
    updateTemplateAttr: PropTypes.func.isRequired,
    addTemplateAttr: PropTypes.func.isRequired,
    newAttr: PropTypes.bool,
    removeSelectAttr: PropTypes.func.isRequired,
    toogleSidebarDelete: PropTypes.func.isRequired,
    showDeleteAttr: PropTypes.bool,
    selectMetadata: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(SidebarAttribute);
