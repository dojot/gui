import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import Can from 'Components/permissions/Can';
import { withNamespaces } from 'react-i18next';
import MetadataCard from './MetadataCard';
import SidebarDelete from '../SidebarDelete';
import { attrsType, metadataType } from '../../../TemplatePropTypes';

const SidebarMetadata = ({
    showMetadata,
    toogleSidebarMetadata,
    addMetadata,
    updateMetadata,
    metadata,
    immutableMeta,
    handleChangeMetadata,
    showDeleteMeta,
    removeSelectMeta,
    toogleSidebarDelete,
    isNewMetadata,
    t,
    selectAttr,
}) => (
    <>
        <Slide right when={showMetadata} duration={300}>
            { !showMetadata
                ? <div />
                : (
                    <div className="-sidebar sidebar-metadata">
                        <div className="header">
                            <div className="title">{isNewMetadata ? `${t('templates:meta')} ${t('templates:attributes')}` : selectAttr.label}</div>
                            <div className="icon">
                                <img src="images/icons/template-cyan.png" alt="device-icon" />
                            </div>
                            <div className="header-path">
                                {`${t('templates:template')} > ${t('text.new')} ${t('templates:attribute')} > ${t('templates:meta')}`}
                            </div>
                        </div>
                        <div className="body">
                            <MetadataCard
                                metadata={metadata}
                                handleChangeMetadata={handleChangeMetadata}
                            />
                        </div>
                        <div className="footer">
                            <DojotBtnClassic
                                label={t('discard.label')}
                                type="secondary"
                                onClick={() => {
                                    if (!isNewMetadata) { updateMetadata(immutableMeta); }
                                    toogleSidebarMetadata();
                                }}
                            />
                            {
                                isNewMetadata

                                    ? (
                                        <Can do="modifier" on="template">
                                            <DojotBtnClassic
                                                color="blue"
                                                label={t('add.label')}
                                                type="primary"
                                                onClick={addMetadata}
                                            />
                                        </Can>
                                    )
                                    : (
                                        <>
                                            <Can do="modifier" on="template">
                                                <DojotBtnClassic label={t('remove.label')} type="secondary" onClick={() => toogleSidebarDelete('showDeleteMeta')} />
                                                <DojotBtnClassic color="red" label={t('save.label')} type="primary" onClick={() => updateMetadata()} />
                                            </Can>
                                        </>
                                    )
                            }
                        </div>
                    </div>
                )}
        </Slide>
        <SidebarDelete
            cancel={() => toogleSidebarDelete('showDeleteMeta')}
            confirm={removeSelectMeta}
            showSidebar={showDeleteMeta}
            message={t('templates:alerts.qst_remove', { label: t('templates:metadata') })}
        />
    </>
);

SidebarMetadata.defaultProps = {
    showMetadata: false,
    showDeleteMeta: false,
    isNewMetadata: false,
};

SidebarMetadata.propTypes = {
    selectAttr: PropTypes.shape(attrsType).isRequired,
    showMetadata: PropTypes.bool,
    toogleSidebarMetadata: PropTypes.func.isRequired,
    addMetadata: PropTypes.func.isRequired,
    updateMetadata: PropTypes.func.isRequired,
    immutableMeta: PropTypes.shape(metadataType).isRequired,
    metadata: PropTypes.shape(metadataType).isRequired,
    handleChangeMetadata: PropTypes.func.isRequired,
    showDeleteMeta: PropTypes.bool,
    removeSelectMeta: PropTypes.func.isRequired,
    toogleSidebarDelete: PropTypes.func.isRequired,
    isNewMetadata: PropTypes.bool,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(SidebarMetadata);
