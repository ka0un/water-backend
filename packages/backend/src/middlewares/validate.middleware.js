const ApiError = require('../utils/ApiError');

/**
 * Validation middleware factory
 * 
 * Supports two schema formats:
 * 1. Raw Joi schema: validate(Joi.object({...})) — validates req.body by default
 * 2. Structured object: validate({ body: Joi.object(), query: Joi.object(), params: Joi.object() })
 *    — validates each specified request property independently
 *
 * @param {Joi.Schema|Object} schema - Joi schema or object with body/query/params Joi schemas
 * @param {string} [property='body'] - Request property to validate (only used with raw Joi schema)
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        // Check if schema is a raw Joi schema (has .validate method) or a structured object
        if (typeof schema.validate === 'function') {
            // Raw Joi schema — validate single property
            const { error, value } = schema.validate(req[property], {
                abortEarly: false,
                stripUnknown: true,
            });

            if (error) {
                const errors = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message.replace(/"/g, ''),
                }));
                return next(ApiError.badRequest('Validation failed', errors));
            }

            req[property] = value;
            return next();
        }

        // Structured schema object — validate each specified property (body, query, params)
        const allErrors = [];
        const validProperties = ['params', 'query', 'body'];

        for (const prop of validProperties) {
            if (schema[prop]) {
                const { error, value } = schema[prop].validate(req[prop], {
                    abortEarly: false,
                    stripUnknown: true,
                });

                if (error) {
                    const errors = error.details.map((detail) => ({
                        field: detail.path.join('.'),
                        message: detail.message.replace(/"/g, ''),
                    }));
                    allErrors.push(...errors);
                } else {
                    req[prop] = value;
                }
            }
        }

        if (allErrors.length > 0) {
            return next(ApiError.badRequest('Validation failed', allErrors));
        }

        next();
    };
};

module.exports = validate;
