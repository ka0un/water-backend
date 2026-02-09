const app = require('./src/app');
const config = require('./src/config');
const { connectDB, disconnectDB } = require('./src/config/database');
const logger = require('./src/utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...');
    logger.error(err.name, err.message);
    logger.error(err.stack);
    process.exit(1);
});

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start Express server
        const server = app.listen(config.port, () => {
            logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🌊 Water Quality Report API Server                          ║
║                                                               ║
║   Environment: ${config.env.padEnd(45)}║
║   Port: ${String(config.port).padEnd(52)}║
║   API: http://localhost:${config.port}/api/v1${' '.repeat(28)}║
║   Health: http://localhost:${config.port}/api/v1/health${' '.repeat(21)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            logger.error('UNHANDLED REJECTION! Shutting down...');
            logger.error(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                logger.info('HTTP server closed.');

                try {
                    await disconnectDB();
                    logger.info('MongoDB connection closed.');
                    process.exit(0);
                } catch (error) {
                    logger.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });

            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };

        // Listen for termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
