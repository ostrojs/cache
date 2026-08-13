const CacheManager = require('../cacheManager');
const path = require('path');

describe('CacheManager Unit Tests', () => {
    let container;
    let manager;

    beforeEach(() => {
        const configMock = {
            cache: {
                default: 'memory',
                enabled: true,
                prefix: 'test_prefix',
                stores: {
                    memory: { driver: 'memory' },
                    nullStore: { driver: 'null' },
                    fileStore: { driver: 'file', path: path.join(__dirname, 'tmp_manager_file') }
                }
            }
        };
        container = {
            make: (binding) => {
                if (binding === 'config') return configMock;
                return null;
            },
            config: configMock,
            database: {}
        };
        manager = new CacheManager(container);
    });

    test('store() resolves default or named driver', () => {
        const defaultDriver = manager.store();
        expect(defaultDriver).toBeDefined();

        const nullDriver = manager.store('nullStore');
        expect(nullDriver).toBeDefined();
    });

    test('resolve() throws InvalidArgumentException for unknown store', () => {
        expect(() => manager.store('unknown')).toThrow('Cache store [unknown] is not defined.');
    });

    test('createMemoryDriver() creates memory adapter', () => {
        const driver = manager.createMemoryDriver({ driver: 'memory' });
        expect(driver).toBeDefined();
    });

    test('createNullDriver() creates null adapter', () => {
        const driver = manager.createNullDriver({ driver: 'null' });
        expect(driver).toBeDefined();
    });

    test('createFileDriver() creates file adapter', () => {
        const driver = manager.createFileDriver({ driver: 'file', path: path.join(__dirname, 'tmp_file_driver') });
        expect(driver).toBeDefined();
    });

    test('createRedisDriver() creates redis adapter', () => {
        jest.mock('redis', () => ({
            createClient: () => ({ auth: () => {} })
        }), { virtual: true });
        const driver = manager.createRedisDriver({ driver: 'redis', server: { port: 6379, host: '127.0.0.1', password: '' } });
        expect(driver).toBeDefined();
    });

    test('createDatabaseDriver() creates database adapter', () => {
        manager.$container.database = {};
        const driver = manager.createDatabaseDriver({ driver: 'database', table: 'cache' });
        expect(driver).toBeDefined();
    });

    test('createMemcachedDriver() creates memcached adapter', () => {
        jest.mock('memjs', () => ({
            Client: { create: () => ({}) }
        }), { virtual: true });
        const driver = manager.createMemcachedDriver({ driver: 'memcached', server: { port: 11211, host: '127.0.0.1', user: '', password: '' } });
        expect(driver).toBeDefined();
    });
});
