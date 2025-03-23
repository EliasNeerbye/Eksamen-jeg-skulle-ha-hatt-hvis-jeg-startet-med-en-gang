/**
 * Standardized API response handler
 * @param {Object} res Express response object
 * @param {Number} statusCode HTTP status code
 * @param {String} message Response message
 * @param {Object|Array} data Optional data to include in response
 * @param {Boolean} success Whether the operation was successful
 */
exports.sendResponse = (
    res,
    statusCode,
    message,
    data = null,
    success = true,
) => {
    const response = {
        success,
        message,
    };

    if (data) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};
