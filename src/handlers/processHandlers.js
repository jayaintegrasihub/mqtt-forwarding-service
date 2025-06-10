const Logger = require('../utils/logger');

class ProcessHandlers {
    static setupGracefulShutdown(forwarder) {
        process.on('SIGINT', async () => {
            Logger.info('Received SIGINT, gracefully shutting down...');
            await ProcessHandlers.shutdown(forwarder);
        });

        process.on('SIGTERM', async () => {
            Logger.info('Received SIGTERM, gracefully shutting down...');
            await ProcessHandlers.shutdown(forwarder);
        });

        process.on('uncaughtException', (error) => {
            Logger.error('Uncaught Exception:', error.message);
            Logger.error(error.stack);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }

    static async shutdown(forwarder) {
        try {
            await forwarder.stop();
            process.exit(0);
        } catch (error) {
            Logger.error('Error during shutdown:', error.message);
            process.exit(1);
        }
    }

    static setupForwarderEvents(forwarder) {
        forwarder.on('started', () => {
            Logger.success('Service is ready to forward messages');
        });

        forwarder.on('error', (error) => {
            Logger.error('Service error:', error.message);
        });

        forwarder.on('messageForwarded', (data) => {
            Logger.trace(`Message forwarded: ${data.originalTopic} -> ${data.targetTopic}`);
        });

        forwarder.on('sourceError', (error) => {
            Logger.error('Source client error:', error.message);
        });

        forwarder.on('targetError', (error) => {
            Logger.error('Target client error:', error.message);
        });
    }
}

module.exports = ProcessHandlers;