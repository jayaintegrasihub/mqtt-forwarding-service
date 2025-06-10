require('dotenv').config();

class Logger {
    static LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        SUCCESS: 3,
        DEBUG: 4,
        TRACE: 5
    };

    static COLORS = {
        ERROR: '\x1b[31m',
        WARN: '\x1b[33m', 
        INFO: '\x1b[36m',
        SUCCESS: '\x1b[32m',
        DEBUG: '\x1b[35m',
        TRACE: '\x1b[37m',
        RESET: '\x1b[0m'
    };

    static currentLevel = Logger.LOG_LEVELS[process.env.LOG_LEVEL] ?? Logger.LOG_LEVELS.INFO;
    static enableColors = process.env.LOG_COLORS !== 'false';

    static shouldLog(level) {
        return Logger.LOG_LEVELS[level] <= Logger.currentLevel;
    }

    static formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const color = Logger.enableColors ? Logger.COLORS[level] : '';
        const reset = Logger.enableColors ? Logger.COLORS.RESET : '';
        const prefix = level === 'SUCCESS' ? '✓' : '';
        
        return `${color}[${level}] ${timestamp} - ${prefix}${message}${reset}`;
    }

    static error(message, ...args) {
        if (Logger.shouldLog('ERROR')) {
            console.error(Logger.formatMessage('ERROR', message), ...args);
        }
    }

    static warn(message, ...args) {
        if (Logger.shouldLog('WARN')) {
            console.warn(Logger.formatMessage('WARN', message), ...args);
        }
    }

    static info(message, ...args) {
        if (Logger.shouldLog('INFO')) {
            console.log(Logger.formatMessage('INFO', message), ...args);
        }
    }

    static success(message, ...args) {
        if (Logger.shouldLog('SUCCESS')) {
            console.log(Logger.formatMessage('SUCCESS', message), ...args);
        }
    }

    static debug(message, ...args) {
        if (Logger.shouldLog('DEBUG')) {
            console.debug(Logger.formatMessage('DEBUG', message), ...args);
        }
    }

    static trace(message, ...args) {
        if (Logger.shouldLog('TRACE')) {
            console.trace(Logger.formatMessage('TRACE', message), ...args);
        }
    }

    static setLevel(level) {
        if (typeof level === 'string' && Logger.LOG_LEVELS.hasOwnProperty(level.toUpperCase())) {
            Logger.currentLevel = Logger.LOG_LEVELS[level.toUpperCase()];
            Logger.info(`Log level set to: ${level.toUpperCase()}`);
        } else if (typeof level === 'number' && level >= 0 && level <= 5) {
            Logger.currentLevel = level;
            const levelName = Object.keys(Logger.LOG_LEVELS).find(key => Logger.LOG_LEVELS[key] === level);
            Logger.info(`Log level set to: ${levelName}`);
        } else {
            Logger.error(`Invalid log level: ${level}. Valid levels: ERROR, WARN, INFO, SUCCESS, DEBUG, TRACE`);
        }
    }

    static getCurrentLevel() {
        return Object.keys(Logger.LOG_LEVELS).find(key => Logger.LOG_LEVELS[key] === Logger.currentLevel);
    }

    static enableColorOutput(enable = true) {
        Logger.enableColors = enable;
    }
}

module.exports = Logger;