const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
    err == err || {};
    err.stack = err.stack || "";
    err.status = err.status || 500;
    err.message = err.message || "Une erreur est survenue.";

    logger.error('Une erreur est survenue :', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    res.status(err.status).json({
        error: {
            message: err.message
        }
    });
};