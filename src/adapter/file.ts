import fs from 'fs-extra';
import StoreHelper from './StoreHelper';
import { secondsToMs } from '../utils';

/**
 * Class FileStore.
 */
class FileStore extends StoreHelper {

    /**
     * Create a new instance.
     * @param $root - Root directory path
     * @param $config - Storage configuration object
     * @param $prefix - Key prefix string
     */
    constructor($root: string, $config: Record<string, any>, $prefix: string) {
        super($config, $prefix);
        this.setRootPath($root);
    }

    /**
     * Retrieve an item from the cache by key.
     * @param key - Cache key identifier
     * @returns Parsed cache payload
     */
    public async get(key: string): Promise<any> {
        return fs.readJson(this.applyPathPrefix(key)).then((result) => {
            if (Date.now() / 1000 >= Number(result.expiration)) {
                this.forget(key);
                return Promise.reject();
            }
            return this.parseValue(result);
        });
    }

    /**
     * Store an item in the cache for a given number of seconds.
     * @param key - Cache key identifier
     * @param value - Value to cache
     * @param seconds - Duration in seconds
     * @returns True if written
     */
    public async put(key: string, value: any, seconds: number = 0): Promise<boolean> {
        const { serializedValue, valueType } = this.serializeValue(value);
        return fs.writeJson(this.applyPathPrefix(key), ({
            value: serializedValue,
            valueType: valueType,
            expiration: secondsToMs(seconds).toString()
        }))
            .then(() => true);
    }

    /**
     * Remove an item from the cache.
     * @param key - Cache key identifier
     * @returns Promise resolving on remove
     */
    public async forget(key: string): Promise<void> {
        return fs.remove(this.applyPathPrefix(key));
    }

    /**
     * Remove all items from the cache.
     * @returns Promise resolving on directory empty
     */
    public async flush(): Promise<void> {
        return fs.emptyDir(this.getRootPath() || '');
    }
}

export default FileStore;