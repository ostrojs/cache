const Limit = require('../rateLimiting/limit');
const GlobalLimit = require('../rateLimiting/globalLimit');
const Unlimited = require('../rateLimiting/unlimited');

describe('Rate Limiting Classes', () => {
    describe('Limit', () => {
        test('perMinute creates Limit instance with 1 decay minute', () => {
            const limit = Limit.perMinute(10);
            expect(limit.$maxAttempts).toBe(10);
            expect(limit.$decayMinutes).toBe(1);
            expect(limit.$key).toBe('');
        });

        test('perMinutes creates Limit instance with custom decay minutes', () => {
            const limit = Limit.perMinutes(5, 20);
            expect(limit.$maxAttempts).toBe(20);
            expect(limit.$decayMinutes).toBe(5);
        });

        test('perHour creates Limit instance with hour conversion', () => {
            const limit = Limit.perHour(100, 2);
            expect(limit.$maxAttempts).toBe(100);
            expect(limit.$decayMinutes).toBe(120);
        });

        test('perDay creates Limit instance with day conversion', () => {
            const limit = Limit.perDay(500, 1);
            expect(limit.$maxAttempts).toBe(500);
            expect(limit.$decayMinutes).toBe(1440);
        });

        test('none creates Unlimited instance', () => {
            const limit = Limit.none();
            expect(limit).toBeInstanceOf(Unlimited);
            expect(limit.$maxAttempts).toBe(Infinity);
        });

        test('by and response methods set properties fluently', () => {
            const cb = () => 'custom_response';
            const limit = Limit.perMinute(10).by('user_123').response(cb);
            expect(limit.$key).toBe('user_123');
            expect(limit.$responseCallback).toBe(cb);
        });
    });

    describe('GlobalLimit', () => {
        test('creates GlobalLimit with key empty string', () => {
            const gl = new GlobalLimit(50, 2);
            expect(gl.$maxAttempts).toBe(50);
            expect(gl.$decayMinutes).toBe(2);
            expect(gl.$key).toBe('');
        });
    });

    describe('Unlimited', () => {
        test('creates Unlimited with Infinity max attempts', () => {
            const un = new Unlimited();
            expect(un.$maxAttempts).toBe(Infinity);
            expect(un.$key).toBe('');
        });
    });
});
