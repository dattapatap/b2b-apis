import { createLogger, format, transports } from 'winston';
import fs from 'fs';
import path from 'path';

const { combine, timestamp, printf } = format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Helper to get logger based on route type
const getLogger = (type) => {
    const logDir = 'logs';
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    return createLogger({
        level: 'info',
        format: combine(
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            logFormat
        ),
        transports: [
            new transports.File({ filename: path.join(logDir, `api${type}.log`) })
        ]
    });
};

// Middleware generator
const requestLogger = (type) => {
    const logger = getLogger(type);
    return (req, res, next) => {
        logger.info(`${req.method} ${req.originalUrl} from ${req.ip}`);
        next();
    };
};

export default requestLogger;
