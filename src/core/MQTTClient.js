const mqtt = require('mqtt');
const EventEmitter = require('events');
const Logger = require('../utils/logger');

class MQTTClient extends EventEmitter {
    constructor(config, clientType) {
        super();
        this.config = config;
        this.clientType = clientType;
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
    }

    async connect(maxReconnectAttempts, reconnectDelay) {
        return new Promise((resolve, reject) => {
            try {
                const clientOptions = {
                    clientId: this.config.clientId || `forwarder_${this.clientType}_${Math.random().toString(16).substr(2, 8)}`,
                    username: this.config.username,
                    password: this.config.password,
                    keepalive: 60,
                    reconnectPeriod: reconnectDelay,
                    connectTimeout: 30000,
                    clean: true
                };

                this.client = mqtt.connect(this.config.url, clientOptions);

                this.client.on('connect', () => {
                    Logger.info(`Connected to ${this.clientType} MQTT broker: ${this.config.url}`);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.emit('connected');
                    
                    if (this.clientType === 'source' && this.config.topics) {
                        this.subscribeToTopics();
                    }
                    
                    resolve();
                });

                this.client.on('error', (error) => {
                    Logger.error(`${this.clientType} MQTT client error:`, error.message);
                    this.isConnected = false;
                    this.emit('error', error);
                    reject(error);
                });

                this.client.on('close', () => {
                    Logger.info(`${this.clientType} MQTT connection closed`);
                    this.isConnected = false;
                    this.emit('disconnected');
                });

                this.client.on('offline', () => {
                    Logger.warn(`${this.clientType} MQTT client offline`);
                    this.isConnected = false;
                    this.emit('offline');
                });

                this.client.on('message', (topic, message, packet) => {
                    this.emit('message', topic, message, packet);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    subscribeToTopics() {
        const topics = this.config.topics || ['#'];
        topics.forEach(topic => {
            this.client.subscribe(topic, { qos: 1 }, (err) => {
                if (err) {
                    Logger.error(`Failed to subscribe to topic ${topic}:`, err.message);
                } else {
                    Logger.info(`Subscribed to topic: ${topic}`);
                }
            });
        });
    }

    publish(topic, message, options, callback) {
        if (!this.isConnected) {
            const error = new Error('Client not connected');
            if (callback) callback(error);
            return;
        }

        this.client.publish(topic, message, options, callback);
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            return new Promise(resolve => {
                this.client.end(false, resolve);
            });
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

module.exports = MQTTClient;