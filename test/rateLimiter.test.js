const RateLimiter = require('../rateLimiter');

describe('RateLimiter Unit Tests', () => {
    let mockCache;
    let rateLimiter;
    let storage;

    beforeEach(() => {
        storage = new Map();
        mockCache = {
            has: jest.fn(async (key) => storage.has(key)),
            get: jest.fn(async (key, defaultVal) => storage.has(key) ? storage.get(key) : defaultVal),
            put: jest.fn(async (key, value, decay) => { storage.set(key, value); return true; }),
            forget: jest.fn(async (key) => storage.delete(key)),
            increment: jest.fn(async (key) => {
                const val = (storage.get(key) || 0) + 1;
                storage.set(key, val);
                return val;
            })
        };
        rateLimiter = new RateLimiter(mockCache);
    });

    test('for() and limiter() register and retrieve named limiters', () => {
        const callback = () => 'limiter_cb';
        rateLimiter.for('api', callback);
        expect(rateLimiter.limiter('api')).toBe(callback);
        expect(rateLimiter.limiter('non_existent')).toBeNull();
    });

    test('cleanRateLimiterKey sanitizes HTML entities', () => {
        expect(rateLimiter.cleanRateLimiterKey('user&amp;key')).toBe('userakey');
        expect(rateLimiter.cleanRateLimiterKey('normal_key')).toBe('normal_key');
    });

    test('hit() puts timer and increments key', async () => {
        const hits = await rateLimiter.hit('login_127.0.0.1', 60);
        expect(hits).toBe(1);
        expect(mockCache.put).toHaveBeenCalledWith('login_127.0.0.1:timer', expect.any(Number), 60);
        expect(mockCache.put).toHaveBeenCalledWith('login_127.0.0.1', 0, 60);
        expect(mockCache.increment).toHaveBeenCalledWith('login_127.0.0.1');

        // Second hit when key already exists
        const hits2 = await rateLimiter.hit('login_127.0.0.1', 60);
        expect(hits2).toBe(2);
    });

    test('attempts() and resetAttempts() operate on cache', async () => {
        storage.set('testkey', 3);
        const attempts = await rateLimiter.attempts('testkey');
        expect(attempts).toBe(3);

        await rateLimiter.resetAttempts('testkey');
        expect(storage.has('testkey')).toBe(false);
    });

    test('tooManyAttempts() returns true when timer exists and max attempts reached', async () => {
        storage.set('testkey', 5);
        storage.set('testkey:timer', Date.now() + 60000);

        expect(await rateLimiter.tooManyAttempts('testkey', 5)).toBe(true);

        // When attempts are below maxAttempts, returns false
        storage.set('testkey', 2);
        expect(await rateLimiter.tooManyAttempts('testkey', 5)).toBe(false);

        // When timer does not exist, resets attempts and returns false
        storage.set('testkey', 5);
        storage.delete('testkey:timer');
        expect(await rateLimiter.tooManyAttempts('testkey', 5)).toBe(false);
        expect(storage.has('testkey')).toBe(false);
    });

    test('attempt() executes callback, increments hits, and returns result or true if null', async () => {
        let executed = false;
        const cb = async () => { executed = true; return 'custom_val'; };

        const res = await rateLimiter.attempt('attempt_key', 3, cb, 60);
        expect(executed).toBe(true);
        expect(res).toBe(1);

        // Null callback return defaults to true (returned via hit count)
        const cbNull = async () => null;
        const resNull = await rateLimiter.attempt('attempt_key_2', 3, cbNull, 60);
        expect(resNull).toBe(1);

        // Too many attempts returns false without executing callback
        storage.set('blocked_key', 3);
        storage.set('blocked_key:timer', Date.now() + 60000);
        let cbRun = false;
        const resBlocked = await rateLimiter.attempt('blocked_key', 3, async () => { cbRun = true; });
        expect(resBlocked).toBe(false);
        expect(cbRun).toBe(false);
    });

    test('remaining() and retriesLeft() calculate remaining attempts', async () => {
        storage.set('key1', 2);
        expect(await rateLimiter.remaining('key1', 5)).toBe(3);
        expect(await rateLimiter.retriesLeft('key1', 5)).toBe(3);
    });

    test('clear() resets attempts and forgets timer', async () => {
        storage.set('clearkey', 5);
        storage.set('clearkey:timer', 100);

        await rateLimiter.clear('clearkey');
        expect(storage.has('clearkey')).toBe(false);
        expect(storage.has('clearkey:timer')).toBe(false);
    });

    test('availableIn() returns remaining seconds until timer expires', async () => {
        const now = rateLimiter.currentTime();
        storage.set('timerkey:timer', now + 45);

        const seconds = await rateLimiter.availableIn('timerkey');
        expect(seconds).toBeGreaterThanOrEqual(44);
        expect(seconds).toBeLessThanOrEqual(45);

        // When expired or non-existent returns 0
        storage.set('timerkey:timer', now - 10);
        expect(await rateLimiter.availableIn('timerkey')).toBe(0);
    });
});
