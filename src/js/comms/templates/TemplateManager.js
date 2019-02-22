import util from '../util';

const GQLTEMPLATE = templateId => `
{
    template(id: ${templateId}) {
      label
      id
      created
      attrs {
        id
        label
        metadata{
          id
          label
          static_value
          type
          value_type
          created
          updated
        }
        static_value
        template_id
        type
        value_type
        created
      }
      config_attrs {
        id
        label
        metadata{
          id
          label
          static_value
          type
          value_type
          created
          updated
        }
        static_value
        template_id
        type
        value_type
        created
      }
      data_attrs {
        id
        label
        metadata{
          id
          label
          static_value
          type
          value_type
          created
          updated
        }
        static_value
        template_id
        type
        value_type
        created
      }
      img_attrs {
        id
        label
        metadata{
          id
          label
          static_value
          type
          value_type
          created
          updated
        }
        static_value
        template_id
        type
        value_type
        created
      }
    }
  }
  `;


class TemplateManager {
    constructor() {
        this.baseUrl = '';
    }

    getLastTemplates(field) {
        return util.GET(`${this.baseUrl}/template?limit=10&sortDsc=${field}`);
    }

    getTemplates(params) {
        if (params) {
            const qs = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
            return util.GET(`${this.baseUrl}/template?${qs}`);
        }
        return util.GET(`${this.baseUrl}/template`);
    }

    getTemplate(id) {
        return util.GET(`${this.baseUrl}/template/${id}`);
    }

    getTemplateGQL(id) {
        const req = {
            query: GQLTEMPLATE(id),
        };
        return util.POST(`${this.baseUrl}/graphql/`, req);
    }

    setTemplate(template) {
        return util.PUT(`${this.baseUrl}/template/${template.id}`, template);
    }

    addTemplate(d) {
        return util.POST(`${this.baseUrl}/template`, d);
    }

    deleteTemplate(id) {
        return util.DELETE(`${this.baseUrl}/template/${id}`);
    }

    setIcon(id, icon) {
        const data = new FormData();
        data.append('icon', icon);
        const config = { method: 'put', body: data };
        return util._runFetch(`${this.baseUrl}/template/${id}/icon`, config);
    }
}

const templateManager = new TemplateManager();
export default templateManager;
