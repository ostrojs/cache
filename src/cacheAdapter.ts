import type { ICacheRepository } from '@ostro/contracts/cache/repositry';
import { promiseAll, getSeconds } from './utils';
import Promise from 'bluebird';

const kAdapter: unique symbol = Symbol('adapter');
const kIncrementOrDecrement: unique symbol = Symbol('incrementOrDecrement');
const kEnabled: unique symbol = Symbol('enabled');

/**
 * Class Cache.
 */
class Cache implements ICacheRepository {

    [kAdapter]: any;
    [kEnabled]: boolean;

    /**
     * Create a new instance.
     * @param $adapter - Cache adapter store
     * @param $enabled - Whether caching is enabled
     */
    constructor($adapter: any, $enabled: boolean = true) {
        this[kAdapter] = $adapter;
        this[kEnabled] = $enabled;
    }

    /**
     * Determine if an item exists in the cache.
     * @param key - Cache key identifier
     * @returns True if key exists and has value
     */
    public async has(key: string): Promise<boolean> {
        if (this[kEnabled] === false) {
            return false;
        }
        const data = await this.get(key);
        return Boolean(typeof data !== undefined && data) || false;
    }

    /**
     * Retrieve an item from the cache by key.
     * @typeParam T - Expected value type
     * @param key - Cache key identifier
     * @param defaultValue - Default value if not found
     * @returns Cached value or default value
     */
    public async get<T = unknown>(key: string, defaultValue: T | null = null): Promise<T | null> {
        if (this[kEnabled] === false) {
            return null;
        }
        return this[kAdapter].get(key).then((result: any) => result.value)
            .catch(() => defaultValue);
    }

    /**
     * Store an item in the cache for a given number of seconds.
     * @typeParam T - Value type
     * @param key - Cache key identifier
     * @param value - Value to cache
     * @param seconds - Duration in seconds or Date expiration
     * @returns True if saved successfully
     */
    public async put<T = unknown>(key: string, value: T, seconds: number | Date = 0): Promise<boolean> {
        if (this[kEnabled] === false) {
            return true;
        }
        let sec: number = getSeconds(seconds);
        if (isNaN(sec)) {
            sec = 0;
        }
        return this[kAdapter].put(key, value, sec)
            .then((result: any) => {
                if (result === true)
                    return true;
                else
                    return Promise.reject(false);
            })
            .catch(() => false);
    }

    /**
     * Retrieve an item from the cache and delete it.
     * @typeParam T - Expected value type
     * @param key - Cache key identifier
     * @param defaultValue - Default value if not found
     * @returns Cached value or default
     */
    public async pull<T = unknown>(key: string, defaultValue: T | null = null): Promise<T | null> {
        return this.get<T>(key, defaultValue).then(async (value) => {
            return this.forget(key).then(() => value).catch(() => null);
        });
    }

    /**
     * Retrieve multiple items from the cache by key.
     * @typeParam T - Expected value type
     * @param keys - Array of cache keys
     * @returns Dictionary of cached values
     */
    public async many<T = unknown>(keys: string[]): Promise<Record<string, T | null>> {
        return Promise.all(keys.map(key => this.get<T>(key)))
            .then((values: (T | null)[]) => {
                let mappedValues: Record<string, T | null> = {};
                for (let i = 0; i < keys.length; i++) {
                    mappedValues[keys[i]] = values[i];
                }
                return mappedValues;
            });
    }

    /**
     * Store multiple items in the cache.
     * @param object - Key-value dictionary
     * @param seconds - Duration in seconds or Date expiration
     * @returns Dictionary of results
     */
    public async putMany(object: Record<string, any> = {}, seconds: number | Date = 0): Promise<Record<string, boolean>> {
        const promisesObj: Record<string, Promise<any>> = {};
        for (let prop in object) {
            promisesObj[prop] = this.put(prop, object[prop], getSeconds(seconds));
        }
        return promiseAll<Record<string, boolean>>(promisesObj);
    }

    /**
     * Helper for increment and decrement operations.
     * @param key - Cache key identifier
     * @param value - Step amount
     * @param callback - Math modifier
     * @returns New value or false
     */
    async [kIncrementOrDecrement](key: string, value: number, callback: (current: number) => number): Promise<number | false> {
        return this[kAdapter].get(key).then((result: any) => {
            if (Date.now() / 1000 >= Number(result.expiration)) {
                this.forget(key);
                return false;
            }
            if (result.value === undefined) {
                return false;
            }
            const currentValue = parseInt(result.value);
            if (isNaN(currentValue)) {
                return false;
            }
            const newValue = callback(currentValue);
            return this.put(key, newValue, result.expiration)
                .then(res => res === true ? newValue : false)
                .catch(() => false);
        })
            .catch(() => false);
    }

    /**
     * Increment the value of an item in the cache.
     * @param key - Cache key identifier
     * @param value - Increment step
     * @returns New value or false
     */
    public async increment(key: string, value: number = 1): Promise<number | false> {
        return this[kIncrementOrDecrement](key, value, (currentValue: number) => {
            return currentValue + value;
        })
            .catch(() => false);
    }

    /**
     * Decrement the value of an item in the cache.
     * @param key - Cache key identifier
     * @param value - Decrement step
     * @returns New value or false
     */
    public async decrement(key: string, value: number = 1): Promise<number | false> {
        return this[kIncrementOrDecrement](key, value, (currentValue: number) => {
            return currentValue - value;
        })
            .catch(() => false);
    }

    /**
     * Store an item in the cache indefinitely.
     * @typeParam T - Value type
     * @param key - Cache key identifier
     * @param value - Value to cache
     * @returns True if saved
     */
    public async forever<T = unknown>(key: string, value: T): Promise<boolean> {
        return this.put(key, value, Infinity);
    }

    /**
     * Get an item from the cache, or execute the given Closure and store the result.
     * @typeParam T - Result type
     * @param key - Cache key identifier
     * @param seconds - Duration in seconds or Date expiration
     * @param cb - Computation callback
     * @returns Cached or newly computed value
     */
    public async remember<T = unknown>(key: string, seconds: number | Date = 0, cb: Function): Promise<T> {
        if (typeof cb !== 'function') {
            throw Error('Callback is required.');
        }
        return this.get<T>(key).then(async (res) => {
            if (res == null) {
                let computed: any;
                if (cb.length === 1) {
                    computed = Promise.fromCallback(cb as any);
                } else {
                    computed = cb();
                }

                computed = await Promise.resolve(computed);

                if (computed) {
                    await this.put(key, computed, getSeconds(seconds));
                }
                return computed as T;
            }
            return res;
        });
    }

    /**
     * Get an item from the cache, or execute the given Closure and store the result indefinitely.
     * @typeParam T - Result type
     * @param key - Cache key identifier
     * @param cb - Computation callback
     * @returns Cached or newly computed value
     */
    public async rememberForever<T = unknown>(key: string, cb: Function): Promise<T> {
        if (typeof cb !== 'function') {
            throw Error('Callback should be required.');
        }
        return this.remember<T>(key, Infinity, cb);
    }

    /**
     * Remove an item from the cache.
     * @param key - Cache key identifier
     * @returns True if deleted
     */
    public async forget(key: string): Promise<boolean> {
        if (this[kEnabled] === false) {
            return true;
        }
        return this[kAdapter].forget(key).then(() => true).catch(() => false);
    }

    /**
     * Wipe clean the entire cache.
     * @returns True if flushed
     */
    public async flush(): Promise<boolean> {
        if (this[kEnabled] === false) {
            return true;
        }
        return this[kAdapter].flush().then(() => true).catch(() => false);
    }

}

export default Cache;
