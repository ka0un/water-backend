const ApiError = require('../utils/ApiError');

/**
 * Authorization middleware factory - Restricts access based on user roles
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user exists on request (should be set by authenticate middleware)
        if (!req.user) {
            return next(ApiError.unauthorized('Authentication required'));
        }

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return next(
                ApiError.forbidden(
                    `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}`
                )
            );
        }

        next();
    };
};

module.exports = authorize;
