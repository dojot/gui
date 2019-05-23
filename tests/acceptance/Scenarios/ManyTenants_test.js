const dataJson = require('../performanceTests/DojotData.json');

Feature('ManyTenants');

const current = {
    username: process.env.USERNAME || 'admin',
    tenant: process.env.TENANT || 'admin',
    password: process.env.PASSWORD || 'admin',
};

Scenario('Watching a message through flow with import', async (I, Device) => {
    await I.login(I, current.username, current.password, false);
    await I.importDatabase(dataJson);
    const devicesInfo = await I.getDeviceByLabel('device');

    const deviceID = devicesInfo.devices[0].id;
    await I.sendMQTTMessage(deviceID, '{"trigger": "run"}', current.tenant);

    I.amOnPage(`#/device/id/${deviceID}/detail`);
    I.wait(2);
    Device.selectAttr('trigger');
    Device.selectAttr('mensagem');
    I.wait(3);
    Device.shouldSeeMessage('run');
    Device.shouldSeeMessage('msgOut');
});
