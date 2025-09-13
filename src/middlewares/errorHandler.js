import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || [];
   

    if (err.isJoi) {
        statusCode = 422;
        message = "Invalid input data";
        errors = {};

        err.details.forEach((detail) => {
            const key = detail.path.join('.');
            errors[key] = detail.message.replace(/\"/g, '');
        });
    }

    else if (err.name === "ValidationError") {
        statusCode = 422;
        message = "Validation failed";
        errors = {};

        for (const [field, errorObj] of Object.entries(err.errors || {})) {
            errors[field] = errorObj.message.replace(/\"/g, '');
        }
    }

    else if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyPattern)[0];
        message = `Duplicate value for '${field}', it must be unique`;
    }

    if(statusCode === 500){
        message = "Internal Server Error";
        errors = err.message;
    }


    logger.error(`${req.method} ${req.originalUrl} - ${message}`, { stack: err.stack });


    res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errors,
    });
    
};

export default errorHandler;
