const mqtt = require('async-mqtt');
const request = require('sync-request');
const env = require('./env.conf');

module.exports = () => {
    let jwt;

    return actor({

        loginAdmin(I, clearDb) {
            I.amOnPage(env.dojot_host);
            I.setEnglishLanghage();
            I.refreshPage();
            I.wait(3);
            I.see('Sign in');
            I.fillField('Username', 'admin');
            I.fillField('Password', 'admin');
            I.click('Login');
            I.wait(10);
            if (clearDb) { I.clearDatabase(); }
            I.refreshPage();
        },

        login(I, username, password, clearDb) {
            I.amOnPage(env.dojot_host);
            I.setEnglishLanghage();
            I.refreshPage();
            I.wait(3);
            I.see('Sign in');
            I.fillField('Username', username);
            I.fillField('Password', password);
            I.click('Login');
            I.wait(10);
            if (clearDb) { I.clearDatabase(); }
            I.refreshPage();
        },

        seeInputByNameAndValue(name, value) {
            this.seeElement(locate('input')
                .withAttr({
                    name,
                    value,
                }));
        },

        seeSelectOptionByNameAndValue(name, value) {
            this.seeElement(locate('select')
                .withAttr({ name }), value);
        },

        fillSelectByName(name, value) {
            this.selectOption(locate('select')
                .withAttr({ name }), value);
        },

        async getJWT() {
            return this.executeScript(() => localStorage.getItem('jwt'));
        },

        async requestJSON(resource, myJson, method = 'POST', querystring = '') {
            jwt = await this.executeScript(() => localStorage.getItem('jwt'));
            let endPoint = `${env.dojot_host}/${resource}`;

            if (querystring && querystring.length > 0) {
                endPoint += `?${querystring}`;
            }
            const response = request(method, endPoint, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
                json: myJson,
            });

            return JSON.parse(response.getBody('utf8'));
        },

        async deleteXHR(resource, querystring) {
            jwt = await this.executeScript(() => localStorage.getItem('jwt'));

            const method = 'DELETE';
            const response = request(method, `${env.dojot_host}/${resource}?${querystring}`, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
                json: myJson,
            });

            return JSON.parse(response.getBody('utf8'));
        },


        async createTemplate(json) {
            return await this.requestJSON('template', json);
        },

        async updateTemplate(json, templateID) {
            return await this.requestJSON(`template/${templateID}`, json, 'PUT');
        },

        async createDevice(json) {
            return await this.requestJSON('device', json);
        },

        async deleteUser(userId) {
            return await this.deleteXHR('auth/user', userId);
        },

        async getDeviceByLabel(label) {
            return await this.requestJSON('device', {}, 'GET', `label=${label}`);
        },

        async createUser(json) {
            return await this.requestJSON('auth/user', json);
        },


        async clearDatabase() {
            return await this.requestJSON('import', {
                devices: [],
                templates: [],
                flows: [],
                flowRemoteNodes: [],
            });
        },

        async importDatabase(dataJson) {
            return await this.requestJSON('import', dataJson);
        },

        async setEnglishLanghage() {
            return await this.executeScript(() => localStorage.setItem('i18nextLng', 'en'));
        },

        async sendMQTTMessage(deviceId, message, tenant = 'admin') {
            try {
                // vernemq
                const client = await mqtt.connectAsync(env.mqtt_host, { username: `${tenant}:${deviceId}` });
                await client.publish(`${tenant}:${deviceId}/attrs`, message);

                // mosca
                // const client = await mqtt.connectAsync(env.mqtt_host);
                // await client.publish(`/${tenant}/${deviceId}/attrs`, message);

                await client.end();
            } catch (e) {
                console.log(`error when trying publish in topic /${tenant}/${deviceId}/attrs to ${env.mqtt_host}`, e.stack);
            }
        },

    });
};
