import StoreHelper from './StoreHelper';
import { secondsToMs } from '../utils';

const kStorage: unique symbol = Symbol('storage');

/**
 * Class ObjectStore.
 */
class ObjectStore extends StoreHelper {

    [kStorage]: Record<string, { value: any; expiration: number }>;

    /**
     * Create a new instance.
     * @param $config - Storage configuration object
     */
    constructor($config: Record<string, any>) {
        super($config);
        this[kStorage] = Object.create(null);
    }

    /**
     * Retrieve an item from the cache by key.
     * @param key - Cache key identifier
     * @returns Cached item
     */
    public async get(key: string): Promise<{ value: any; expiration: number }> {
        const cache = this[kStorage][this.applyDotPrefix(key)];
        if (cache === undefined) {
            return Promise.reject();
        }
        if (Date.now() / 1000 >= cache.expiration) {
            this.forget(key);
            return Promise.reject();
        }
        return Promise.resolve(cache);
    }

    /**
     * Store an item in the cache for a given number of seconds.
     * @param key - Cache key identifier
     * @param value - Value to cache
     * @param seconds - Duration in seconds
     * @returns True if saved
     */
    public async put(key: string, value: any, seconds: number = 0): Promise<boolean> {
        const expiration = secondsToMs(seconds);
        this[kStorage][this.applyDotPrefix(key)] = {
            value: value,
            expiration: expiration
        };
        return true;
    }

    /**
     * Remove an item from the cache.
     * @param key - Cache key identifier
     * @returns True if forgotten
     */
    public async forget(key: string): Promise<boolean> {
        delete this[kStorage][this.applyDotPrefix(key)];
        return Promise.resolve(true);
    }

    /**
     * Remove all items from the cache.
     * @returns True if flushed
     */
    public async flush(): Promise<boolean> {
        this[kStorage] = {};
        return Promise.resolve(true);
    }
}

export default ObjectStore;