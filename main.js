const MQTTForwarder = require('./src/core/MQTTForwarder');
const ProcessHandlers = require('./src/handlers/processHandlers');
const config = require('./src/config/config');
const Logger = require('./src/utils/logger');

async function main() {
    try {
        const forwarder = new MQTTForwarder(config);
        
        ProcessHandlers.setupForwarderEvents(forwarder);
        ProcessHandlers.setupGracefulShutdown(forwarder);
        
        await forwarder.start();
        
    } catch (error) {
        Logger.error('Failed to start service:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { MQTTForwarder, config };