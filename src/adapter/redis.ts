import Promise from 'bluebird';
import StoreHelper from './StoreHelper';
import { secondsToMs } from '../utils';

const kClient: unique symbol = Symbol('client');
const kConnection: unique symbol = Symbol('connection');

/**
 * Class RedisStore.
 */
class RedisStore extends StoreHelper {

    [kClient]: any;
    [kConnection]?: any;

    /**
     * Create a new instance.
     * @param $redisClient - Redis client instance
     * @param $config - Configuration object
     * @param $prefix - Prefix string
     */
    constructor($redisClient: any, $config: Record<string, any>, $prefix: string) {
        super($config, $prefix);
        this[kClient] = $redisClient;
    }

    /**
     * Retrieve an item from the cache by key.
     * @param key - Cache key identifier
     * @returns Parsed cached payload
     */
    public async get(key: string): Promise<any> {
        return this.connection().getAsync(this.applyDotPrefix(key)).then((result: any) => {
            return this.parseValue(result);
        });
    }

    /**
     * Store an item in the cache for a given number of seconds.
     * @param key - Cache key identifier
     * @param value - Value to cache
     * @param seconds - Duration in seconds
     * @returns True if set succeeded
     */
    public async put(key: string, value: any, seconds: number = 0): Promise<boolean> {
        const prefixedKey = this.applyDotPrefix(key);
        const {
            serializedValue,
            valueType
        } = this.serializeValue(value);
        const expiration = seconds === Infinity ? [] : ['EX', (secondsToMs(seconds)).toString()];
        return this.connection().setAsync(prefixedKey, JSON.stringify({
            value: serializedValue,
            valueType: valueType
        }), ...expiration).then(() => true).catch(() => false);
    }

    /**
     * Remove an item from the cache.
     * @param key - Cache key identifier
     * @returns True if deleted
     */
    public async forget(key: string): Promise<boolean> {
        return this.connection().delAsync(this.applyDotPrefix(key)).then(() => true).catch(() => false);
    }

    /**
     * Remove all items from the cache.
     * @returns True if flushed
     */
    public async flush(): Promise<boolean> {
        return this.connection().flushdbAsync().then(() => true).catch(() => false);
    }

    /**
     * Get or create Redis connection.
     * @returns Promisified Redis connection
     */
    public connection(): any {
        return this[kConnection] = this[kConnection] ? this[kConnection] : Promise.promisifyAll(this[kClient].getConnection());
    }

}

export default RedisStore;