const crypto = require("crypto");

/**
 * Generate a random token for authentication purposes
 * @param {Number} length Length of the token to generate
 * @returns {String} Random token
 */
exports.createAuthToken = (length = 32) => {
    return crypto.randomBytes(length).toString("hex");
};

/**
 * Check if a user has permission to access or modify a resource
 * @param {String} resourceOwnerId ID of resource owner
 * @param {String} currentUserId ID of current user
 * @param {Boolean} isAdmin Whether current user is admin
 * @returns {Boolean} Whether user has permission
 */
exports.hasResourcePermission = (
    resourceOwnerId,
    currentUserId,
    isAdmin = false,
) => {
    if (isAdmin) return true;
    return resourceOwnerId.toString() === currentUserId.toString();
};

/**
 * Validate user input for registration and profile updates
 * @param {Object} userData User data to validate
 * @returns {Object} Object with isValid flag and errors array
 */
exports.validateUserData = (userData) => {
    const errors = [];

    if (!userData.username || userData.username.trim() === "") {
        errors.push("Username is required");
    }

    if (userData.password) {
        if (userData.password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};
