const NullStore = require('../adapter/null');
const ObjectStore = require('../adapter/memory');
const StoreHelper = require('../adapter/StoreHelper');
const fs = require('fs-extra');
const path = require('path');

describe('Adapter Unit Tests', () => {
    describe('NullStore', () => {
        let store;
        beforeEach(() => {
            store = new NullStore();
        });

        test('get() returns null', async () => {
            expect(await store.get('key')).toBeNull();
        });

        test('put() returns true', async () => {
            expect(await store.put('key', 'val')).toBe(true);
        });

        test('forget() returns true', async () => {
            expect(await store.forget('key')).toBe(true);
        });

        test('flush() returns true', async () => {
            expect(await store.flush()).toBe(true);
        });
    });

    describe('ObjectStore (memory)', () => {
        let store;
        beforeEach(() => {
            store = new ObjectStore({ prefix: 'test' });
        });

        test('put() and get() retrieve cached items before expiration', async () => {
            await store.put('foo', 'bar', 60);
            const item = await store.get('foo');
            expect(item).toEqual({ value: 'bar', expiration: expect.any(Number) });
        });

        test('get() rejects when key non-existent', async () => {
            await expect(store.get('non_existent')).rejects.toBeUndefined();
        });

        test('get() forgets and rejects when expired', async () => {
            await store.put('exp_key', 'val', -10);
            await expect(store.get('exp_key')).rejects.toBeUndefined();
        });

        test('forget() deletes key', async () => {
            await store.put('foo', 'bar', 60);
            await store.forget('foo');
            await expect(store.get('foo')).rejects.toBeUndefined();
        });

        test('flush() clears memory storage object', async () => {
            await store.put('foo', 'bar', 60);
            await store.flush();
            await expect(store.get('foo')).rejects.toBeUndefined();
        });
    });

    describe('StoreHelper', () => {
        let helper;
        const tmpDir = path.join(__dirname, 'tmp_store_helper');

        beforeEach(() => {
            helper = new StoreHelper({ key: 'val' }, 'prefix_str');
        });

        afterEach(() => {
            fs.removeSync(tmpDir);
        });

        test('getConfig() returns config object', () => {
            expect(helper.getConfig()).toEqual({ key: 'val' });
        });

        test('getPrefix() and applyDotPrefix()', () => {
            expect(helper.getPrefix()).toBe('prefix_str');
            expect(helper.applyDotPrefix('mykey')).toBe('prefix_str.mykey');
        });

        test('setRootPath() and getRootPath() creates directory', () => {
            helper.setRootPath(tmpDir);
            expect(helper.getRootPath()).toBe(path.normalize(tmpDir));
            expect(fs.existsSync(tmpDir)).toBe(true);
        });

        test('setRootUrl() getRootUrl() applyUrlPrefix()', () => {
            helper.setRootUrl('http://localhost:8080');
            expect(helper.getRootUrl()).toBe('http://localhost:8080/');
            expect(helper.applyUrlPrefix('cache')).toBe('http://localhost:8080//cache');
        });

        test('applyPathPrefix() calculates md5 path', () => {
            helper.setRootPath(tmpDir);
            const resolved = helper.applyPathPrefix('test_item');
            expect(resolved).toContain(path.normalize(tmpDir));
        });

        test('ensureDirectory, parsePath, and dirname', (done) => {
            helper.ensureDirectory(tmpDir, (err) => {
                expect(err).toBeNull();
                expect(helper.parsePath('/tmp/file.txt').base).toBe('file.txt');
                expect(helper.dirname('/tmp/sub/file.txt')).toBe('/tmp/sub');
                done();
            });
        });

        test('getContent and getBufferData', () => {
            const buf = Buffer.from('hello');
            expect(helper.getContent(['item1'])).toBe('item1');
            expect(helper.getContent('item1')).toBe('item1');
            expect(helper.getBufferData({ buffer: buf })).toBe(buf);
        });

        test('valueType() identifies strings, arrays, jsons, and numbers', () => {
            expect(helper.valueType('hello')).toBe('string');
            expect(helper.valueType([1, 2])).toBe('array');
            expect(helper.valueType({ a: 1 })).toBe('json');
            expect(helper.valueType(123)).toBe('number');
            expect(helper.valueType(true)).toBe('boolean');
        });

        test('serializeValue() and parseValue()', () => {
            const jsonVal = { a: 10 };
            const serialized = helper.serializeValue(jsonVal);
            expect(serialized).toEqual({
                serializedValue: JSON.stringify(jsonVal),
                valueType: 'json'
            });

            const parsed = helper.parseValue({
                value: JSON.stringify(jsonVal),
                valueType: 'json',
                expiration: '1000000'
            });
            expect(parsed.value).toEqual(jsonVal);
            expect(parsed.expiration).toBe(1000000);

            const bufferParsed = helper.parseValue(Buffer.from(JSON.stringify({
                value: 'string_val',
                valueType: 'string',
                expiration: 500
            })));
            expect(bufferParsed.value).toBe('string_val');

            const unparsedObj = helper.parseValue({ value: 'val', valueType: 'string', expiration: 100 });
            expect(unparsedObj.value).toBe('val');
        });
    });

    describe('FileStore', () => {
        const FileStore = require('../adapter/file');
        const fileDir = path.join(__dirname, 'tmp_file_store');
        let store;

        beforeEach(() => {
            store = new FileStore(fileDir, { prefix: 'test' }, 'test_prefix');
        });

        afterEach(() => {
            fs.removeSync(fileDir);
        });

        test('put() and get() store and retrieve file cache', async () => {
            await store.put('item1', { data: 'hello' }, 60);
            const val = await store.get('item1');
            expect(val.value).toEqual({ data: 'hello' });
        });

        test('get() rejects and forgets when expired', async () => {
            await store.put('item_exp', 'val', -10);
            await expect(store.get('item_exp')).rejects.toBeUndefined();
        });

        test('forget() removes file', async () => {
            await store.put('item_rm', 'val', 60);
            await store.forget('item_rm');
            await expect(store.get('item_rm')).rejects.toThrow();
        });

        test('flush() empties directory', async () => {
            await store.put('item_flush', 'val', 60);
            await store.flush();
            await expect(store.get('item_flush')).rejects.toThrow();
        });
    });

    describe('DatabaseStore', () => {
        const DatabaseStore = require('../adapter/database');
        let dbStore;
        let mockTable;
        let mockConn;

        beforeEach(() => {
            mockTable = {
                where: jest.fn().mockReturnThis(),
                first: jest.fn(),
                updateOrInsert: jest.fn(),
                delete: jest.fn()
            };
            mockConn = {
                table: jest.fn().mockReturnValue(mockTable)
            };
            dbStore = new DatabaseStore('cache_table', mockConn);
        });

        test('get() returns item when not expired', async () => {
            mockTable.first.mockResolvedValue({
                key: 'db_key',
                value: JSON.stringify({ a: 1 }),
                expiration: (Date.now() / 1000) + 100
            });
            const res = await dbStore.get('db_key');
            expect(res.value).toEqual({ a: 1 });
        });

        test('get() forgets and rejects when expired or missing', async () => {
            mockTable.first.mockResolvedValue({
                key: 'db_exp',
                value: 'val',
                expiration: (Date.now() / 1000) - 10
            });
            mockTable.delete.mockResolvedValue(true);
            await expect(dbStore.get('db_exp')).rejects.toBeUndefined();

            mockTable.first.mockResolvedValue(null);
            await expect(dbStore.get('db_missing')).rejects.toBeUndefined();
        });

        test('put() calls updateOrInsert', async () => {
            mockTable.updateOrInsert.mockResolvedValue(true);
            expect(await dbStore.put('k', 'v', 60)).toBe(true);
        });

        test('forget() and flush() call delete', async () => {
            mockTable.delete.mockResolvedValue(true);
            expect(await dbStore.forget('k')).toBe(true);
            expect(await dbStore.flush()).toBe(true);
        });
    });

    describe('RedisStore', () => {
        const RedisStore = require('../adapter/redis');
        let redisStore;
        let mockConn;

        beforeEach(() => {
            mockConn = {
                getAsync: jest.fn(),
                setAsync: jest.fn(),
                delAsync: jest.fn(),
                flushdbAsync: jest.fn()
            };
            const clientMock = { getConnection: () => mockConn };
            redisStore = new RedisStore(clientMock, {}, 'prefix');
        });

        test('get(), put(), forget(), flush() call redis commands', async () => {
            mockConn.getAsync.mockResolvedValue(JSON.stringify({ value: 'val', valueType: 'string' }));
            const res = await redisStore.get('k');
            expect(res.value).toBe('val');

            mockConn.setAsync.mockResolvedValue('OK');
            expect(await redisStore.put('k', 'v', 60)).toBe(true);
            expect(await redisStore.put('k', 'v', Infinity)).toBe(true);

            mockConn.delAsync.mockResolvedValue(1);
            expect(await redisStore.forget('k')).toBe(true);

            mockConn.flushdbAsync.mockResolvedValue('OK');
            expect(await redisStore.flush()).toBe(true);
        });
    });

    describe('MemcachedStore', () => {
        const MemcachedStore = require('../adapter/memcached');
        let memStore;
        let mockConn;

        beforeEach(() => {
            mockConn = {
                get: jest.fn(),
                set: jest.fn(),
                delete: jest.fn(),
                flush: jest.fn()
            };
            const clientMock = { getConnection: () => mockConn };
            memStore = new MemcachedStore(clientMock, {}, 'prefix');
        });

        test('get(), put(), forget(), flush() call memcached commands', async () => {
            mockConn.get.mockResolvedValue({ value: JSON.stringify({ value: 'mem_val', valueType: 'string' }) });
            const res = await memStore.get('k');
            expect(res.value).toBe('mem_val');

            mockConn.set.mockResolvedValue(true);
            expect(await memStore.put('k', 'v', 60)).toBe(true);
            expect(await memStore.put('k', 'v', Infinity)).toBe(true);

            mockConn.delete.mockResolvedValue(true);
            expect(await memStore.forget('k')).toBe(true);

            mockConn.flush.mockResolvedValue(true);
            expect(await memStore.flush()).toBe(true);
        });
    });
});
