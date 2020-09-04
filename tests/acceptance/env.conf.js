const env = {
    dojot_host: process.env.DOJOT_HOST || 'http://localhost:8000',
    // dojot_host: process.env.DOJOT_HOST || 'http://10.50.11.181:30001',
    mqtt_host: process.env.MQTT_HOST || 'tcp://localhost:1883',
    // mqtt_host: process.env.MQTT_HOST || 'tcp://10.50.11.181:30002',
};

module.exports = env;
