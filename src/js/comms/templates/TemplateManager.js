/* eslint-disable */
import { PROXY_URL, GQL_URL } from 'Src/config';
import util from '../util/util';

const GQL_TEMPLATE = templateId => `
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
  getLastTemplates(field) {
    return util.GET(`${PROXY_URL}template?limit=10&sortDsc=${field}`);
  }

  getTemplates(params) {
    if (params) {
      const qs = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
      return util.GET(`${PROXY_URL}template?${qs}`);
    }
    return util.GET(`${PROXY_URL}template`);
  }

  getTemplate(id) {
    return util.GET(`${PROXY_URL}template/${id}`);
  }

  getTemplateGQL(id) {
    const req = {
      query: GQL_TEMPLATE(id),
    };
    return util.POST(`${GQL_URL}/`, req);
  }

  setTemplate(template) {
    return util.PUT(`${PROXY_URL}template/${template.id}`, template);
  }

  addTemplate(d) {
    return util.POST(`${PROXY_URL}template`, d);
  }

  deleteTemplate(id) {
    return util.DELETE(`${PROXY_URL}template/${id}`);
  }

  setIcon(id, icon) {
    const data = new FormData();
    data.append('icon', icon);
    const config = { method: 'put', body: data };
    return util._runFetch(`${PROXY_URL}template/${id}/icon`, config);
  }
}

const templateManager = new TemplateManager();
export default templateManager;
