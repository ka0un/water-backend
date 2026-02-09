/**
 * Standardized API Response class
 */
class ApiResponse {
    constructor(statusCode, data, message = 'Success') {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.timestamp = new Date().toISOString();
    }

    static success(res, data, message = 'Success', statusCode = 200) {
        const response = new ApiResponse(statusCode, data, message);
        return res.status(statusCode).json(response);
    }

    static created(res, data, message = 'Resource created successfully') {
        const response = new ApiResponse(201, data, message);
        return res.status(201).json(response);
    }

    static noContent(res) {
        return res.status(204).send();
    }

    static error(res, statusCode, message, errors = null) {
        const response = {
            success: false,
            statusCode,
            message,
            timestamp: new Date().toISOString(),
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }
}

module.exports = ApiResponse;
