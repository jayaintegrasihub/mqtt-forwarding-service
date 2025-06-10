class MessageTransformer {
    static transformTopic(topic, targetConfig) {
        if (targetConfig.topicPrefix) {
            return `${targetConfig.topicPrefix}/${topic}`;
        }
        
        if (targetConfig.topicMapping && targetConfig.topicMapping[topic]) {
            return targetConfig.topicMapping[topic];
        }
        
        return topic;
    }

    static transformMessage(message, topic, transformFunction) {
        if (transformFunction && typeof transformFunction === 'function') {
            return transformFunction(message, topic);
        }
        return message;
    }

    static validateMessage(message, topic) {
        if (!topic || typeof topic !== 'string') {
            throw new Error('Invalid topic');
        }
        
        if (!Buffer.isBuffer(message) && typeof message !== 'string') {
            throw new Error('Invalid message format');
        }
        
        return true;
    }
}

module.exports = MessageTransformer;