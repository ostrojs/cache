/**
 * Class NullStore.
 */
class NullStore {

    /**
     * Retrieve an item from the cache by key.
     * @param key - Cache key identifier
     * @param defaultValue - Default value if not found
     * @returns Null always
     */
    public async get(key: string, defaultValue: any = null): Promise<null> {
        return null;
    }

    /**
     * Store an item in the cache for a given number of seconds.
     * @param key - Cache key identifier
     * @param value - Value to cache
     * @param seconds - Duration in seconds
     * @returns True always
     */
    public async put(key: string, value: any, seconds: number = 0): Promise<boolean> {
        return true;
    }

    /**
     * Remove an item from the cache.
     * @param key - Cache key identifier
     * @returns True always
     */
    public async forget(key: string): Promise<boolean> {
        return true;
    }

    /**
     * Remove all items from the cache.
     * @returns True always
     */
    public async flush(): Promise<boolean> {
        return true;
    }

}

export default NullStore;