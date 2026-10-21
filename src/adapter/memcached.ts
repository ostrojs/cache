import StoreHelper from './StoreHelper';
import { secondsToMs } from '../utils';

const kClient: unique symbol = Symbol('client');
const kConnection: unique symbol = Symbol('connection');

/**
 * Class MemcachedStore.
 */
class MemcachedStore extends StoreHelper {

    [kClient]: any;
    [kConnection]?: any;

    /**
     * Create a new instance.
     * @param $client - Memcached client instance
     * @param $config - Configuration object
     * @param $prefix - Prefix string
     */
    constructor($client: any, $config: Record<string, any>, $prefix: string) {
        super($config, $prefix);
        this[kClient] = $client;
    }

    /**
     * Retrieve an item from the cache by key.
     * @param key - Cache key identifier
     * @returns Parsed cached payload
     */
    get(key: string): Promise<any> {
        return this.connection().get(this.applyDotPrefix(key)).then((result: any) => {
            return this.parseValue(result.value);
        });
    }

    /**
     * Store an item in the cache for a given number of seconds.
     * @param key - Cache key identifier
     * @param value - Value to cache
     * @param seconds - Duration in seconds
     * @returns True if set succeeded
     */
    public put(key: string, value: any, seconds: number = 0): Promise<boolean> {
        const prefixedKey = this.applyDotPrefix(key);
        const {
            serializedValue,
            valueType
        } = this.serializeValue(value);
        const expiration = seconds === Infinity ? 0 : secondsToMs(seconds).toString();
        return this.connection().set(prefixedKey, JSON.stringify({
            value: serializedValue,
            valueType: valueType
        }), { expires: expiration }).then(() => true).catch(() => false);
    }

    /**
     * Remove an item from the cache.
     * @param key - Cache key identifier
     * @returns True if deleted
     */
    public forget(key: string): Promise<boolean> {
        return this.connection().delete(this.applyDotPrefix(key)).then(() => true).catch(() => false);
    }

    /**
     * Remove all items from the cache.
     * @returns True if flushed
     */
    public flush(): Promise<boolean> {
        return this.connection().flush().then(() => true).catch(() => false);
    }

    /**
     * Get or create Memcached connection.
     * @returns Connection instance
     */
    public connection(): any {
        return this[kConnection] = this[kConnection] ? this[kConnection] : this[kClient].getConnection();
    }

}

export default MemcachedStore;