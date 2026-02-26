const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Water Quality Report API',
        version: '1.0.0',
        description: 'Comprehensive API documentation for the Crowdsourced Water Quality Report System. Authentication is required for most endpoints except public reports and auth routes.',
        license: {
            name: 'ISC',
        },
    },
    tags: [
        { name: 'Core', description: 'Health check and API info' },
        { name: 'Auth', description: 'Authentication and user session management' },
        { name: 'Users', description: 'User profile and management' },
        { name: 'Public Reports', description: 'Public facing water quality crowdsourcing wizard' },
        { name: 'Moderation', description: 'Moderator tools for public reports and logs' },
        { name: 'Water Sources', description: 'Water source catalog and geographic queries' },
        { name: 'Lab Staff', description: 'Internal laboratory test lifecycle management' },
        { name: 'Admin', description: 'System administration, laboratories, and user metrics' }
    ],
    servers: [
        {
            url: `http://localhost:${config.port}/api/v1`,
            description: 'Development Server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
};

const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.js', './src/models/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
