import templateManager from '../comms/templates/TemplateManager';
import Materialize from 'materialize-css';

var alt = require('../alt');

class TemplateActions {

  updateTemplates(list) {
    return list;
  }

  insertTemplate(template) {
    return template;
  }

  addTemplate(template, cb) {
    const newTemplate = template;
    return (dispatch) => {
      dispatch();
      templateManager.addTemplate(newTemplate)
        .then((response) => {
          this.insertTemplate(response.template);
          if (cb) {
            cb(response.template);
          }
        })
        .catch((error) => {
          this.templatesFailed("Failed to add template to list");
        })

    }
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
    }
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
        })

      dispatch();
    }
  }

  triggerIconUpdate(id, icon) {
    return (dispatch) => {
      templateManager.setIcon(id, icon)
        .then((response) => {
          this.setIcon(id);
        })
        .catch(function(error) {
        })

      dispatch();
    }
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
        })
    }
  }

  updateSingle(template) {
    return template;
  }

  removeSingle(template) {
    return template;
  }

  templatesFailed(error) {
      Materialize.toast(error.message, 4000);
    return error;
  }
}

let _action =  alt.createActions(TemplateActions, exports);
export default _action;
