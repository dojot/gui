import React from 'react';
import PropTypes from 'prop-types';
import { Loading } from 'Components/Loading';
import TemplateActions from 'Actions/TemplateActions';
import { withNamespaces } from 'react-i18next';
import ListItem from './ListItem/index';
import Sidebar from './Sidebar/index';
import { templateType, tempOpxType } from '../TemplatePropTypes';

const TemplateList = ({
    loading,
    templates,
    template,
    isNewTemplate,
    showSidebar,
    temp_opex,
    t,
}) => {
    if (loading) {
        return (
            <div className="row full-height relative">
                <Loading />
            </div>
        );
    }

    let filteredList = templates.map((item) => item);
    if (filteredList.length > 0) {
        let existsNewDevice = false;
        let newTemplate;

        for (let i = 0; i < filteredList.length; i += 1) {
            if (filteredList[i].isNewTemplate !== undefined) {
                if (filteredList[i].isNewTemplate) {
                    existsNewDevice = true;
                    newTemplate = filteredList[i];
                }
            }
        }

        if (existsNewDevice) {
            const filteredListAux = [];
            filteredListAux[0] = newTemplate;
            for (let i = 0; i < filteredList.length - 1; i += 1) {
                if (filteredList[i].isNewTemplate === undefined) {
                    filteredListAux[filteredListAux.length + 1] = filteredList[i];
                }
            }
            filteredList = filteredListAux;
        }
    }
    return (
        <div className="full-height flex-container pos-relative overflow-x-hidden">
            {filteredList.length > 0 ? (
                <div className="col s12 lst-wrapper w100 hei-100-over-scroll flex-container">
                    {filteredList.map((item) => (
                        <ListItem
                            template={item}
                            key={item.id}
                            temp_opex={temp_opex}
                            numOfTempPage={templates.length}
                            selectTemplate={TemplateActions.selectTemplate}
                        />
                    ))}
                </div>
            ) : (
                <div className="background-info valign-wrapper full-height">
                    <span className="horizontal-center">
                        {temp_opex.hasFilter()
                            ? <b className="noBold">{t('templates:alerts.no_templates_show')}</b>
                            : <b className="noBold">{t('templates:alerts.no_conf_templates')}</b>}
                    </span>
                </div>
            )}
            <Sidebar
                template={template}
                isNewTemplate={isNewTemplate}
                showSidebar={showSidebar}
                toogleSidebar={TemplateActions.toogleSidebar} // I really appreciate it <3
                temp_opex={temp_opex}
                numOfTempPage={templates.length}
            />
        </div>
    );
};

TemplateList.defaultProps = {
    loading: true,
    templates: [],
    template: {
        label: '',
        attrs: [],
        config_attrs: [],
        data_attrs: [],
        newTemplate: true,
    },
    isNewTemplate: false,
    showSidebar: false,
};

TemplateList.propTypes = {
    loading: PropTypes.bool,
    templates: PropTypes.arrayOf(
        PropTypes.shape(templateType),
    ),
    template: PropTypes.shape(templateType),
    isNewTemplate: PropTypes.bool,
    showSidebar: PropTypes.bool,
    temp_opex: PropTypes.shape(tempOpxType).isRequired,
    t: PropTypes.func.isRequired,
};

export default withNamespaces()(TemplateList);
