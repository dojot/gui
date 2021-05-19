/* eslint-disable */
import util from '../util';
import { PROXY_URL, GQL_URL } from 'Src/config';

class DeviceManager {
    getDevices(params) {
        if (params) {
            const qs = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');
            return util.GET(`${PROXY_URL}device?${qs}`);
        } return util.GET(`${PROXY_URL}device?page_size=1000`);
    }

    // @TODO probably here isn't a good place to handle stats
    getStats() {
        return util.GET(`${PROXY_URL}metric/admin/metrics/`);
    }

    getLastDevices(field) {
        return util.GET(`${PROXY_URL}device?limit=10&sortDsc=${field}`);
    }

    getDevice(id) {
        return util.GET(`${PROXY_URL}device/${id}`);
    }

    getDevicesWithPosition(params) {
        let corners = {
            "filterType": "geo",
            "value": [
                {
                    "latitude": 0,
                    "longitude": 0
                },
                {
                    "latitude": 0,
                    "longitude": "1.1"
                },
                {
                    "latitude": "1.1",
                    "longitude": "1.1"
                },
                {
                    "latitude": "1.1",
                    "longitude": 0
                }
            ]
        }
        let qs = Object.keys(corners)
            .map(key => key + "=" + corners[key])
            .join("&");
        return util.GET(`${PROXY_URL}device/geo?${qs}`);
        // return Promise.resolve({ ok: true, json: clusterData });
    }

    getDeviceByTemplateId(templateId, params) {
        if (params) {
            const qs = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');
            return util.GET(`${PROXY_URL}device/template/${templateId}?${qs}`);
        }
        return util.GET(`${PROXY_URL}device/template/${templateId}`);
    }

    sendActuator(deviceId, attrs) {
        return util.PUT(`${PROXY_URL}device/${deviceId}/actuate`, attrs);
    }

    setDevice(detail) {
        return util.PUT(`${PROXY_URL}device/${detail.id}`, detail);
    }

    addDevice(d) {
        d.id = util.sid();
        return util.POST(`${PROXY_URL}device`, d);
    }

    deleteDevice(id) {
        return util.DELETE(`${PROXY_URL}device/${id}`);
    }


    getTemplateGQL(list) {
        const req = {
            query: GQLTEMPLATE(list.toString()),
        };
        return util.POST(`${GQL_URL}/`, req);
    }

}

const deviceManager = new DeviceManager();
export default deviceManager;


const GQLTEMPLATE = (templateList) => `
{
    templatesHasImageFirmware(templatesId: [${templateList}])
    {
        key
        value
    }
}
`;
