import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
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
    template,
}) => (
    <Fragment>
        <Slide right when={showAttribute} duration={300}>
            { showAttribute
                ? (
                    <div className="-sidebar sidebar-attribute">
                        <div className="header">
                            <div className="title">{`${newAttr ? 'new atribute' : template.label}`}</div>
                            <div className="icon">
                                <img src="images/icons/template-cyan.png" alt="device-icon" />
                            </div>
                            <div className="header-path">
                                {`template > ${newAttr ? 'new atribute' : 'edit atribute'}`}
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
                            <DojotBtnClassic label="discard" type="secondary" onClick={toogleSidebarAttribute} />
                            { newAttr
                                ? (<DojotBtnClassic color="blue" label="add" type="primary" onClick={() => addTemplateAttr(selectAttr)} />)
                                : (
                                    <Fragment>
                                        <DojotBtnClassic label="remove" type="secondary" onClick={() => toogleSidebarDelete('showDeleteAttr')} />
                                        <DojotBtnClassic color="red" label="save" type="primary" onClick={() => updateTemplateAttr(selectAttr)} />
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
};

export default SidebarAttribute;
