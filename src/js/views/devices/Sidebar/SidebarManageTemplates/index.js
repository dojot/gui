import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotCustomButton } from 'Components/DojotButton';
import MaterialInput from 'Components/MaterialInput';
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
        const { templates } = this.props;
        this.setState({
            templateList: templates,
        });
    }

    handleFilter(filter) {
        const { templateList } = this.state;
        const filteredList = templateList.filter(template => template.label.includes(filter));
        this.setState({
            filter,
            filteredList,
            isFiltering: filter.length > 0,
        });
    }

    render() {
        const {
            showManageTemplates, handleShowManageTemplate, handleSelectTemplate, selectedTemplates,
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
                                        manage template
                                    </div>
                                    <div className="icon">
                                        <img src="images/icons/template-cyan.png" alt="template-icon" />
                                    </div>
                                </div>
                                <div className="body">
                                    <div className="title">
                                        {'new device > set template'}
                                    </div>
                                    <div className="template-filter">
                                        <div className="label">Select any templates</div>
                                        <div className="template-filter-input">
                                            <MaterialInput
                                                className="filter"
                                                name="filter"
                                                maxLength={40}
                                                value={filter}
                                                onChange={e => this.handleFilter(e.target.value)}
                                            >
                                                Filter By Name
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
                                    <DojotCustomButton label="back" onClick={handleShowManageTemplate} />
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
    templates: [],
};

SidebarManageTemplates.propTypes = {
    showManageTemplates: PropTypes.bool,
    handleShowManageTemplate: PropTypes.func.isRequired,
    templates: PropTypes.arrayOf(templateType),
};


export default SidebarManageTemplates;
