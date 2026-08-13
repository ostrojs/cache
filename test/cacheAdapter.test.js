const CacheAdapter = require('../cacheAdapter');
const NullStore = require('../adapter/null');
const ObjectStore = require('../adapter/memory');

describe('CacheAdapter Unit Tests', () => {
    describe('Disabled Cache', () => {
        let adapter;
        let cache;

        beforeEach(() => {
            adapter = new ObjectStore({ prefix: 'test' });
            cache = new CacheAdapter(adapter, false);
        });

        test('has() returns false when disabled', async () => {
            expect(await cache.has('key')).toBe(false);
        });

        test('get() returns null when disabled', async () => {
            expect(await cache.get('key', 'default')).toBeNull();
        });

        test('put() returns true when disabled', async () => {
            expect(await cache.put('key', 'val')).toBe(true);
        });

        test('forget() returns true when disabled', async () => {
            expect(await cache.forget('key')).toBe(true);
        });

        test('flush() returns true when disabled', async () => {
            expect(await cache.flush()).toBe(true);
        });
    });

    describe('Enabled Cache', () => {
        let adapter;
        let cache;

        beforeEach(() => {
            adapter = new ObjectStore({ prefix: 'test' });
            cache = new CacheAdapter(adapter, true);
        });

        test('has() checks existence and truthiness', async () => {
            expect(await cache.has('foo')).toBe(false);
            await cache.put('foo', 'bar', 60);
            expect(await cache.has('foo')).toBe(true);

            await cache.put('falsy', false, 60);
            expect(await cache.has('falsy')).toBe(false);
        });

        test('get() retrieves default value on failure or missing key', async () => {
            expect(await cache.get('missing', 'fallback')).toBe('fallback');
            await cache.put('k1', 'v1', 60);
            expect(await cache.get('k1')).toBe('v1');
        });

        test('put() handles NaN or invalid seconds by defaulting to 0', async () => {
            expect(await cache.put('k2', 'v2', 'invalid_sec')).toBe(true);
            expect(await cache.get('k2', 'default')).toBe('default');
        });

        test('put() returns false on adapter rejection', async () => {
            const failingAdapter = {
                put: async () => Promise.reject(new Error('failed'))
            };
            const failingCache = new CacheAdapter(failingAdapter, true);
            expect(await failingCache.put('k', 'v')).toBe(false);
        });

        test('pull() retrieves value and forgets key', async () => {
            await cache.put('pull_key', 'pull_val', 60);
            const val = await cache.pull('pull_key');
            expect(val).toBe('pull_val');
            expect(await cache.has('pull_key')).toBe(false);
        });

        test('many() retrieves multiple keys in dictionary object', async () => {
            await cache.put('a', 1, 60);
            await cache.put('b', 2, 60);
            const res = await cache.many(['a', 'b', 'c']);
            expect(res).toEqual({ a: 1, b: 2, c: null });
        });

        test('putMany() stores multiple key-value pairs', async () => {
            await cache.putMany({ x: 10, y: 20 }, 60);
            expect(await cache.get('x')).toBe(10);
            expect(await cache.get('y')).toBe(20);
        });

        test('increment() and decrement() update numeric values', async () => {
            await cache.put('counter', 10, 60);
            const inc = await cache.increment('counter', 5);
            expect(inc).toBe(15);

            const dec = await cache.decrement('counter', 3);
            expect(dec).toBe(12);
        });

        test('increment() returns false when value is not a number or expired or adapter fails', async () => {
            await cache.put('str', 'abc', 60);
            expect(await cache.increment('str')).toBe(false);

            await cache.put('expired_counter', 5, -10);
            expect(await cache.increment('expired_counter')).toBe(false);

            expect(await cache.increment('non_existent')).toBe(false);
        });

        test('forever() sets cache item with Infinity expiration', async () => {
            expect(await cache.forever('forever_key', 'immortal')).toBe(true);
            expect(await cache.get('forever_key')).toBe('immortal');
        });

        test('remember() returns cached value or executes callback', async () => {
            // Must throw if cb is not a function
            await expect(cache.remember('k', 60, null)).rejects.toThrow('Callback is required.');

            // Callback returning direct value
            const val1 = await cache.remember('rem_1', 60, () => 'computed_1');
            expect(val1).toBe('computed_1');
            expect(await cache.get('rem_1')).toBe('computed_1');

            // Subsequent call returns cached value without running callback
            let executed = false;
            const val2 = await cache.remember('rem_1', 60, () => { executed = true; return 'new'; });
            expect(val2).toBe('computed_1');
            expect(executed).toBe(false);

            // Node-style callback (cb.length == 1)
            const val3 = await cache.remember('rem_node', 60, (cb) => cb(null, 'node_val'));
            expect(val3).toBe('node_val');
        });

        test('rememberForever() delegates to remember with Infinity', async () => {
            await expect(cache.rememberForever('rf', 'not_fn')).rejects.toThrow('Callback should be required.');

            const val = await cache.rememberForever('rf', () => 'forever_val');
            expect(val).toBe('forever_val');
            expect(await cache.get('rf')).toBe('forever_val');
        });

        test('put() return false branch when adapter returns non-true', async () => {
            const nonTrueAdapter = {
                put: async () => false
            };
            const c = new CacheAdapter(nonTrueAdapter, true);
            expect(await c.put('k', 'v')).toBe(false);
        });

        test('remember() when callback returns falsy value does not cache it', async () => {
            const res = await cache.remember('rem_falsy', 60, () => null);
            expect(res).toBeNull();
            expect(await cache.has('rem_falsy')).toBe(false);
        });

        test('increment() and decrement() handle rejections and undefined values', async () => {
            const rejectingAdapter = {
                get: async () => Promise.reject(new Error('fail')),
                put: async () => Promise.reject(new Error('fail'))
            };
            const c = new CacheAdapter(rejectingAdapter, true);
            expect(await c.increment('inc_fail')).toBe(false);

            const undefinedValAdapter = {
                get: async () => ({ value: undefined, expiration: (Date.now() / 1000) + 100 })
            };
            const c2 = new CacheAdapter(undefinedValAdapter, true);
            expect(await c2.increment('inc_undef')).toBe(false);

            const putFailingAdapter = {
                get: async () => ({ value: 10, expiration: (Date.now() / 1000) + 100 }),
                put: async () => Promise.reject(false)
            };
            const c3 = new CacheAdapter(putFailingAdapter, true);
            expect(await c3.increment('inc_put_fail')).toBe(false);
            expect(await c3.decrement('dec_put_fail')).toBe(false);
        });
    });
});
