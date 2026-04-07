module.exports = {
    testEnvironment: 'node',
    // Picks up *.test.js in both tests/ root AND tests/unit/ subfolder
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/unit/**/*.test.js',
    ],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: false,
    restoreMocks: true,
    testTimeout: 30000,
    detectOpenHandles: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    // Scoped to water source module only
    collectCoverageFrom: [
        'src/controllers/waterSource.controller.js',
        'src/models/WaterSource.model.js',
        'src/routes/waterSource.routes.js',
        'src/utils/ApiError.js',
        'src/utils/ApiResponse.js',
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            statements: 60,
            branches: 50,
            functions: 60,
            lines: 60,
        },
    },
};
