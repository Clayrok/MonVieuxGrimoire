module.exports = (err, req, res, next) => {
    err == err || {};
    err.stack = err.stack || "";
    err.status = err.status || 500;
    err.message = err.message || "Une erreur est survenue.";

    if (err.stack) console.error(err.stack);

    res.status(err.status).json({
        error: {
            message: err.message
        }
    });
};