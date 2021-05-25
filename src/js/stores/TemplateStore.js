/* eslint-disable */
import util from 'Comms/util/util';

const alt = require('../alt');
const TemplateActions = require('../actions/TemplateActions');

class TemplateStore {
    constructor() {
        this.template = {
            label: '',
            attrs: [],
            config_attrs: [],
            data_attrs: [],
            newTemplate: true,
        };
        this.templates = [];
        this.pagination = null;
        this.error = null;
        this.loading = false;
        this.showSidebar = false;
        this.isNewTemplate = false;
        this.templatesAllList = [];

        this.bindListeners({
            handleUpdateTemplateAllList: TemplateActions.updateTemplatesAllList,
            handleUpdateTemplateList: TemplateActions.UPDATE_TEMPLATES,
            handleAddTemplate: TemplateActions.ADD_TEMPLATE,
            handleInsertTemplate: TemplateActions.INSERT_TEMPLATE,
            handleFetchTemplateList: TemplateActions.FETCH_TEMPLATES,
            handleFailure: TemplateActions.TEMPLATES_FAILED,

            handleTriggerUpdate: TemplateActions.TRIGGER_UPDATE,
            handleUpdateSingle: TemplateActions.UPDATE_SINGLE,

            fetchSingle: TemplateActions.FETCH_SINGLE,
            handleUpdateAndSetSingle: TemplateActions.UPDATE_AND_SET_SINGLE,

            handleTriggerRemoval: TemplateActions.TRIGGER_REMOVAL,
            handleRemoveSingle: TemplateActions.REMOVE_SINGLE,

            handleTriggerIcon: TemplateActions.TRIGGER_ICON_UPDATE,
            handleUpdateIcon: TemplateActions.SET_ICON,

            handleSelectTemplate: TemplateActions.SELECT_TEMPLATE,
            toogleSidebar: TemplateActions.TOOGLE_SIDEBAR,
        });
    }

    fetchSingle(template) {
        this.loading = true;
    }

    handleUpdateAndSetSingle(data) {
        this.template = data.template;
        this.error = null;
        this.loading = false;
    }

    handleTriggerIcon() {
        this.error = null;
        this.loading = true;
    }

    toogleSidebar(values) {
        let showSidebar;
        if (values !== undefined) {
            showSidebar = values;
        } else {
            showSidebar = !this.showSidebar;
        }
        this.showSidebar = showSidebar;
    }

    handleUpdateIcon(id) {
        this.error = null;
        this.loading = false;
        for (let i = 0; i < this.templates.length; i++) {
            if (this.templates[i].id === id) {
                const newTemplate = JSON.parse(JSON.stringify(this.templates[i]));
                // newTemplate.has_icon = true;
                newTemplate.has_icon = util.guid();
                newTemplate.toggle = !newTemplate.toggle;
                this.templates[i] = newTemplate;
            }
        }
    }

    handleUpdateTemplateList(data) {
        this.templates = data.templates;
        this.pagination = data.pagination;
        this.error = null;
        this.loading = false;
    }

    handleUpdateTemplateAllList(data) {
        this.templatesAllList = data.templates;
        this.error = null;
        this.loading = false;
    }

    handleUpdateSingle(template) {
        for (let i = 0; i < this.templates.length; i++) {
            if (this.templates[i].id === template.id) {
                const newTemplate = JSON.parse(JSON.stringify(template));
                this.templates[i] = newTemplate;
            }
        }
        this.loading = false;
    }

    handleTriggerUpdate() {
        // trigger handler for updateSingle
        this.error = null;
        this.loading = true;
    }

    handleTriggerRemoval() {
        // trigger handler for updateSingle
        this.error = null;
        this.loading = true;
    }

    handleRemoveSingle(id) {
        this.templates = this.templates.filter(e => e.id !== id);
        this.loading = false;
    }

    handleInsertTemplate(template) {
        this.templates.push(template);
        this.error = null;
        this.loading = false;
    }

    handleSelectTemplate(template) {
        this.template = { ...template };
        if (Object.prototype.hasOwnProperty.call(template, 'newTemplate')) {
            this.isNewTemplate = true;
            delete this.template.newTemplate;
        } else {
            this.isNewTemplate = false;
        }
        this.showSidebar = true;
        this.showSidebarAtribute = false;
        this.showSidebarConfiguration = false;
    }

    handleAddTemplate() {
        // this is actually just a intermediary while addition happens asynchonously
        this.error = null;
        this.loading = true;
    }

    handleFetchTemplateList() {
        this.templates = [];
        this.loading = true;
    }

    handleFailure(error) {
        this.error = error;
        this.loading = false;
    }

    handleChangeValue(field, value) {
        let template = { ...this.template };
        template[field] = value;
        this.template = template;
    }
}

const _store = alt.createStore(TemplateStore, 'TemplateStore');
export default _store;
