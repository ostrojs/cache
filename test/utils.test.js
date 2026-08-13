const { promiseAll, getSeconds, secondsToMs } = require('../utils');

describe('utils.js Unit Tests', () => {
    describe('promiseAll()', () => {
        test('resolves dictionary of promises into resolved object', async () => {
            const input = {
                a: Promise.resolve('valA'),
                b: Promise.resolve(42)
            };
            const result = await promiseAll(input);
            expect(result).toEqual({ a: 'valA', b: 42 });
        });

        test('handles rejected promises by converting them to null', async () => {
            const input = {
                a: Promise.resolve('ok'),
                b: Promise.reject(new Error('failed'))
            };
            const result = await promiseAll(input);
            expect(result).toEqual({ a: 'ok', b: null });
        });
    });

    describe('getSeconds()', () => {
        test('calculates duration in seconds from Date instance', () => {
            const futureDate = new Date(Date.now() + 120000);
            const seconds = getSeconds(futureDate);
            expect(seconds).toBeGreaterThanOrEqual(118);
            expect(seconds).toBeLessThanOrEqual(121);
        });

        test('returns numeric duration if positive and 0 if non-positive', () => {
            expect(getSeconds(10)).toBe(10);
            expect(getSeconds(0)).toBe(0);
            expect(getSeconds(-5)).toBe(0);
        });
    });

    describe('secondsToMs()', () => {
        test('converts seconds to timestamp floor value', () => {
            const nowSec = Math.floor(Date.now() / 1000);
            const res = secondsToMs(60);
            expect(res).toBeGreaterThanOrEqual(nowSec + 59);
            expect(res).toBeLessThanOrEqual(nowSec + 61);
        });
    });
});
