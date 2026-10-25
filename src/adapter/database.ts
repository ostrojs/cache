import StoreHelper from './StoreHelper';
import { secondsToMs } from '../utils';

/**
 * Class Database.
 */
class Database extends StoreHelper {
    #table: string;
    #connection: any;

    /**
     * Create a new instance.
     * @param table - Database table name
     * @param $connection - Database connection instance
     */
    constructor(table: string, $connection: any) {
        super();
        this.#table = table;
        this.#connection = $connection;
    }

    /**
     * Retrieve an item from the cache by key.
     * @param key - Cache key identifier
     * @returns Cached item
     */
    public async get(key: string): Promise<any> {
        return this.#connection.table(this.#table).where({ key }).first().then((res: any) => (res || Promise.reject())).then((result: any) => {
            if (Date.now() / 1000 >= Number(result.expiration)) {
                this.forget(key);
                return Promise.reject();
            }
            try {
                result.value = JSON.parse(result.value);
                return result;
            } catch (e) {
                return result;
            }
        });
    }

    /**
     * Store an item in the cache for a given number of seconds.
     * @param key - Cache key identifier
     * @param value - Value to cache
     * @param seconds - Duration in seconds
     * @returns True if inserted/updated
     */
    public async put(key: string, value: any, seconds: number = 0): Promise<boolean> {
        const { serializedValue, valueType } = this.serializeValue(value);
        return this.#connection.table(this.#table).updateOrInsert({ key }, {
            value: serializedValue,
            valueType: valueType,
            expiration: secondsToMs(seconds).toString()
        })
            .then(() => true)
            .catch(() => false);
    }

    /**
     * Remove an item from the cache.
     * @param key - Cache key identifier
     * @returns True if deleted
     */
    public async forget(key: string): Promise<boolean> {
        return this.#connection.table(this.#table).where({ key }).delete().then(() => true).catch(() => false);
    }

    /**
     * Remove all items from the cache table.
     * @returns True if deleted
     */
    public async flush(): Promise<boolean> {
        return this.#connection.table(this.#table).delete().then(() => true).catch(() => false);
    }
}

export default Database;