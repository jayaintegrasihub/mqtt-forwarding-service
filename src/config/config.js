require('dotenv').config();

const config = {
    source: {
        url: process.env.SOURCE_MQTT_URL || 'mqtt://localhost:1883',
        username: process.env.SOURCE_MQTT_USERNAME,
        password: process.env.SOURCE_MQTT_PASSWORD,
        clientId: process.env.SOURCE_CLIENT_ID,
        topics: process.env.SOURCE_TOPICS ? process.env.SOURCE_TOPICS.split(',') : ['#']
    },
    target: {
        url: process.env.TARGET_MQTT_URL || 'mqtt://localhost:1883',
        username: process.env.TARGET_MQTT_USERNAME,
        password: process.env.TARGET_MQTT_PASSWORD,
        clientId: process.env.TARGET_CLIENT_ID,
        topicPrefix: process.env.TARGET_TOPIC_PREFIX,
        topicMapping: process.env.TARGET_TOPIC_MAPPING ? JSON.parse(process.env.TARGET_TOPIC_MAPPING) : null
    },
    reconnection: {
        maxAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 10,
        delay: parseInt(process.env.RECONNECT_DELAY) || 5000
    },
    mqtt: {
        keepalive: 60,
        connectTimeout: 30000,
        clean: true
    }
};

module.exports = config;