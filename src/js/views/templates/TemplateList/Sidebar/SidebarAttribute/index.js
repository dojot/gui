import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotCustomButton } from 'Components/DojotButton';
import SidebarAttributeForm from './SidebarAttributeForm';
import SidebarConfigurationForm from './SidebarConfigurationForm';
import MetadataList from './MetadataList';
import SidebarButton from '../SidebarButton';
import SidebarDelete from '../SidebarDelete';
import { attrsType } from '../../../TemplatePropTypes';

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
}) => (
    <Fragment>
        <Slide right when={showAttribute} duration={300}>
            { showAttribute
                ? (
                    <div className="sidebar-attribute">
                        <div className="header">
                            <span className="header-path">{`template>${newAttr ? 'new atribute' : 'edit atribute'}`}</span>
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
                                )
                            }
                            <MetadataList values={selectAttr} selectMetadata={selectMetadata} />
                            <div className="body-actions">
                                <div className="body-actions--divider" />
                                <SidebarButton
                                    onClick={() => toogleSidebarMetadata()}
                                    icon="metadata"
                                    text="New Metadata"
                                />
                            </div>
                        </div>
                        <div className="footer">
                            <DojotCustomButton label="discard" type="default" onClick={toogleSidebarAttribute} />
                            { newAttr
                                ? (<DojotCustomButton label="add" type="primary" onClick={() => addTemplateAttr(selectAttr)} />)
                                : (
                                    <Fragment>
                                        <DojotCustomButton label="remove" type="secondary" onClick={() => toogleSidebarDelete('showDeleteAttr')} />
                                        <DojotCustomButton label="save" type="primary" onClick={() => updateTemplateAttr(selectAttr)} />
                                    </Fragment>
                                )
                            }
                        </div>
                    </div>
                )
                : <div />
            }
        </Slide>
        <SidebarDelete
            cancel={() => toogleSidebarDelete('showDeleteAttr')}
            confirm={removeSelectAttr}
            showSidebar={showDeleteAttr}
            message="You are about to remove this attribute. Are you sure?"
        />
    </Fragment>
);

SidebarAttribute.defaultProps = {
    showAttribute: false,
    newAttr: false,
    showDeleteAttr: false,
};

SidebarAttribute.propTypes = {
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
};

export default SidebarAttribute;
