import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotCustomButton } from 'Components/DojotButton';
import MaterialInput from 'Components/MaterialInput';
import { withNamespaces } from 'react-i18next';
import TemplateItem from './TemplateItem';
import { templateType } from '../../../templates/TemplatePropTypes';

class SidebarManageTemplates extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filteredList: [],
            templateList: [],
            filter: '',
            isFiltering: false,
        };

        this.handleFilter = this.handleFilter.bind(this);
    }

    componentDidMount() {
        const { templatesAllList } = this.props;
        this.setState({
            templateList: templatesAllList,
        });
    }

    handleFilter(filter) {
        const { templateList } = this.state;
        const filteredList = templateList.filter((template) => template.label.includes(filter));
        this.setState({
            filter,
            filteredList,
            isFiltering: filter.length > 0,
        });
    }

    render() {
        const {
            showManageTemplates,
            handleShowManageTemplate,
            handleSelectTemplate,
            selectedTemplates,
            t,
        } = this.props;
        const {
            templateList,
            filteredList,
            filter,
            isFiltering,
        } = this.state;
        const list = isFiltering ? filteredList : templateList;
        const templateItemsList = list.map((template) => {
            const checked = selectedTemplates.includes(template.id);
            return (
                <TemplateItem
                    key={template.id}
                    checked={checked}
                    template={template}
                    handleSelectTemplate={handleSelectTemplate}
                />
            );
        });

        return (
            <Slide right when={showManageTemplates} duration={300}>
                {
                    showManageTemplates
                        ? (
                            <div className="manage-templates">
                                <div className="header">
                                    <div className="title">
                                        {t('devices:manage_template')}
                                    </div>
                                    <div className="icon">
                                        <img src="images/icons/template-cyan.png" alt="template-icon" />
                                    </div>
                                </div>
                                <div className="body">
                                    <div className="title">
                                        {`${t('text.new')}  ${t('devices:device')}  > ${t('text.set')} ${t('templates:template')} `}
                                    </div>
                                    <div className="template-filter">
                                        <div className="label">
                                            {`${t('text.select')}  ${t('text.any')}  ${t('templates:title')}`}
                                        </div>
                                        <div className="template-filter-input">
                                            <MaterialInput
                                                className="filter"
                                                name="filter"
                                                maxLength={40}
                                                value={filter}
                                                onChange={(e) => this.handleFilter(e.target.value)}
                                            >
                                                {`${t('text.filter')}  ${t('text.by')}  ${t('text.name')}`}
                                            </MaterialInput>
                                            <button type="button" className="template-filter-button">
                                                <i className="fa fa-search" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="divider" />
                                    <div className="template-list">
                                        {templateItemsList}
                                    </div>
                                </div>
                                <div className="footer">
                                    <DojotCustomButton
                                        label={t('back.label')}
                                        onClick={handleShowManageTemplate}
                                    />
                                </div>
                            </div>
                        )
                        : <div />
                }
            </Slide>
        );
    }
}

SidebarManageTemplates.defaultProps = {
    showManageTemplates: false,
    templatesAllList: [],
};

SidebarManageTemplates.propTypes = {
    showManageTemplates: PropTypes.bool,
    handleShowManageTemplate: PropTypes.func.isRequired,
    templatesAllList: PropTypes.arrayOf(PropTypes.shape(templateType)),
    handleSelectTemplate: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    selectedTemplates: PropTypes.instanceOf(Object).isRequired,
};

export default withNamespaces()(SidebarManageTemplates);
