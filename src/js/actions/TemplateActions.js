import templateManager from 'Comms/templates/TemplateManager';
import toaster from 'Comms/util/materialize';

const alt = require('../alt');

const newTemplate = {
    id: `${Math.floor(Math.random() * 100000)}`,
    label: '',
    attrs: [],
    config_attrs: [],
    data_attrs: [],
    newTemplate: true,
};

class TemplateActions {
    updateTemplates(list) {
        return list;
    }

    insertTemplate(template) {
        return template;
    }

    addTemplate(template, cb) {
        return (dispatch) => {
            dispatch();
            templateManager.addTemplate(template)
                .then((response) => {
                    this.insertTemplate(response.template);
                    if (cb) {
                        cb(response.template);
                    }
                })
                .catch((error) => {
                    this.templatesFailed(error);
                });
        };
    }


    fetchSingle(templateId, cb) {
        return (dispatch) => {
            dispatch();
            templateManager
                .getTemplateGQL(templateId)
                .then((result) => {
                    console.log('fetchSingle', result);
                    this.updateAndSetSingle(result.data);
                    if (cb) {
                        cb(result);
                    }
                })
                .catch((error) => {
                    this.templatesFailed(error);
                });
        };
    }


    fetchTemplates(params = null, cb) {
        return (dispatch) => {
            templateManager.getTemplates(params)
                .then((result) => {
                    this.updateTemplates(result);
                    if (cb) {
                        cb(result);
                    }
                })
                .catch((error) => {
                    this.templatesFailed(error);
                });

            dispatch();
        };
    }

    triggerUpdate(template, cb) {
        return (dispatch) => {
            templateManager.setTemplate(template)
                .then((response) => {
                    this.updateSingle(template);
                    if (cb) {
                        cb(response);
                    }
                })
                .catch((error) => {
                    this.templatesFailed(error);
                });

            dispatch();
        };
    }

    triggerIconUpdate(id, icon) {
        return (dispatch) => {
            templateManager.setIcon(id, icon)
                .then(() => {
                    this.setIcon(id);
                })
                .catch((error) => {
                    console.log('error:', error);
                });

            dispatch();
        };
    }

    setIcon(id) {
        return id;
    }

    triggerRemoval(template, cb) {
        return (dispatch) => {
            dispatch();
            templateManager.deleteTemplate(template)
                .then((response) => {
                    this.removeSingle(template);
                    if (cb) {
                        cb(response);
                    }
                })
                .catch((error) => {
                    this.templatesFailed(error);
                });
        };
    }

    updateAndSetSingle(template) {
        return template;
    }

    updateSingle(template) {
        return template;
    }

    removeSingle(template) {
        return template;
    }

    templatesFailed(error) {
        toaster.error(error.message);
        return error;
    }

    selectTemplate(template = newTemplate) {
        if (!template.newTemplate) {
            this.fetchSingle(template.id);
        }
        return JSON.parse(JSON.stringify(template)); // passing obj by value
    }

    toogleSidebar(params) {
        return dispatch => dispatch(params);
    }
}

const _action = alt.createActions(TemplateActions, exports);
export default _action;
