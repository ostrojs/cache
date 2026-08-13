module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.js'],
    transform: {},
    moduleNameMapper: {
        '^@ostro/support/(.*)$': '<rootDir>/../support/$1',
        '^@ostro/support$': '<rootDir>/../support',
        '^@ostro/contracts/(.*)$': '<rootDir>/../contracts/$1',
        '^@ostro/contracts$': '<rootDir>/../contracts',
        '^@ostro/cache/(.*)$': '<rootDir>/$1',
        '^@ostro/cache$': '<rootDir>/cacheManager.js'
    },
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover']
};
