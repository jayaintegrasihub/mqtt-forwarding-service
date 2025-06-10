const EventEmitter = require('events');
const MQTTClient = require('./MQTTClient');
const MessageTransformer = require('../utils/messageTransformer');
const Logger = require('../utils/logger');

class MQTTForwarder extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.sourceClient = new MQTTClient(config.source, 'source');
        this.targetClient = new MQTTClient(config.target, 'target');
        this.isRunning = false;
    }

    async start() {
        try {
            Logger.info('Starting MQTT Forwarder...');
            
            await this.sourceClient.connect(
                this.config.reconnection.maxAttempts,
                this.config.reconnection.delay
            );
            
            await this.targetClient.connect(
                this.config.reconnection.maxAttempts,
                this.config.reconnection.delay
            );
            
            this.setupEventHandlers();
            this.isRunning = true;
            
            Logger.success('MQTT Forwarder started successfully');
            this.emit('started');
            
        } catch (error) {
            Logger.error('Failed to start MQTT Forwarder:', error.message);
            this.emit('error', error);
            throw error;
        }
    }

    setupEventHandlers() {
        this.sourceClient.on('message', (topic, message, packet) => {
            this.handleMessage(topic, message, packet);
        });

        this.sourceClient.on('error', (error) => {
            this.emit('sourceError', error);
        });

        this.targetClient.on('error', (error) => {
            this.emit('targetError', error);
        });

        this.sourceClient.on('disconnected', () => {
            this.handleReconnection('source');
        });

        this.targetClient.on('disconnected', () => {
            this.handleReconnection('target');
        });
    }

    handleMessage(topic, message, packet) {
        try {
            MessageTransformer.validateMessage(message, topic);

            if (!this.targetClient.isConnected) {
                Logger.warn('Target client not connected, message dropped');
                return;
            }

            const transformedTopic = MessageTransformer.transformTopic(topic, this.config.target);
            const transformedMessage = MessageTransformer.transformMessage(
                message, 
                topic, 
                this.config.target.messageTransform
            );

            this.targetClient.publish(transformedTopic, transformedMessage, {
                qos: packet.qos || 0,
                retain: packet.retain || false
            }, (error) => {
                if (error) {
                    Logger.error(`Failed to forward message to topic ${transformedTopic}:`, error.message);
                    this.emit('forwardError', { topic, error });
                } else {
                    Logger.debug(`${topic} -> ${transformedTopic}`);
                    this.emit('messageForwarded', { originalTopic: topic, targetTopic: transformedTopic });
                }
            });

        } catch (error) {
            Logger.error('Error processing message:', error.message);
            this.emit('processingError', { topic, error });
        }
    }

    handleReconnection(clientType) {
        if (!this.isRunning) return;

        const client = clientType === 'source' ? this.sourceClient : this.targetClient;
        
        if (client.reconnectAttempts >= this.config.reconnection.maxAttempts) {
            Logger.error(`Max reconnection attempts reached for ${clientType} client`);
            return;
        }

        client.reconnectAttempts++;
        Logger.info(`Attempting to reconnect ${clientType} client (${client.reconnectAttempts}/${this.config.reconnection.maxAttempts})`);

        setTimeout(async () => {
            try {
                await client.connect(
                    this.config.reconnection.maxAttempts,
                    this.config.reconnection.delay
                );
            } catch (error) {
                Logger.error(`Reconnection failed for ${clientType}:`, error.message);
            }
        }, this.config.reconnection.delay);
    }

    async stop() {
        this.isRunning = false;
        Logger.info('Stopping MQTT Forwarder...');

        try {
            await Promise.all([
                this.sourceClient.disconnect(),
                this.targetClient.disconnect()
            ]);
            
            Logger.success('MQTT Forwarder stopped');
            this.emit('stopped');
            
        } catch (error) {
            Logger.error('Error stopping MQTT Forwarder:', error.message);
            this.emit('error', error);
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            source: this.sourceClient.getStatus(),
            target: this.targetClient.getStatus()
        };
    }
}

module.exports = MQTTForwarder;