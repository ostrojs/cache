import InvalidArgumentException from '@ostro/support/exceptions/invalidArgumentException';
import Manager from '@ostro/support/manager';
import CacheAdapter from './cacheAdapter';
import MemoryStore from './adapter/memory';
import RedisStore from './adapter/redis';
import RedisClient from './client/redis';
import MemcachedStore from './adapter/memcached';
import MemCache from './client/memcached';
import NullStore from './adapter/null';
import FileStore from './adapter/file';
import DatabaseStore from './adapter/database';

/**
 * Class CacheManager.
 */
class CacheManager extends Manager {

    public $type: string = 'cache';

    /**
     * Get a cache store instance by name.
     * @param name - Store name
     * @returns Cache adapter instance
     */
    public store(name: string | null = null): CacheAdapter {
        return this.driver(name);
    }

    /**
     * Resolve the given store instance by name.
     * @param name - Store name
     * @returns Resolved cache adapter
     */
    public resolve(name: string): CacheAdapter {
        const $config = this.getStoreConfig(name);

        if (!$config) {
            throw new InvalidArgumentException(`Cache store [${name}] is not defined.`);
        }
        return super.resolve(name, $config);
    }

    /**
     * Create an instance of the memory cache driver.
     * @param $config - Driver configuration
     * @returns Cache adapter with memory store
     */
    public createMemoryDriver($config: Record<string, any>): CacheAdapter {
        return this.adapt(new MemoryStore($config));
    }

    /**
     * Create an instance of the Redis cache driver.
     * @param $config - Driver configuration
     * @returns Cache adapter with Redis store
     */
    public createRedisDriver($config: Record<string, any>): CacheAdapter {
        return this.adapt(new RedisStore(new RedisClient($config), $config, this.getPrefix() || ''));
    }

    /**
     * Create an instance of the Memcached cache driver.
     * @param $config - Driver configuration
     * @returns Cache adapter with Memcached store
     */
    public createMemcachedDriver($config: Record<string, any>): CacheAdapter {
        return this.adapt(new MemcachedStore(new MemCache($config), $config, this.getPrefix() || ''));
    }

    /**
     * Create an instance of the null cache driver.
     * @param $config - Driver configuration
     * @returns Cache adapter with null store
     */
    public createNullDriver($config: Record<string, any>): CacheAdapter {
        return this.adapt(new NullStore());
    }

    /**
     * Create an instance of the file cache driver.
     * @param $config - Driver configuration
     * @returns Cache adapter with file store
     */
    public createFileDriver($config: Record<string, any>): CacheAdapter {
        return this.adapt(new FileStore($config['path'], $config, this.getPrefix() || ''));
    }

    /**
     * Create an instance of the database cache driver.
     * @param $config - Driver configuration
     * @returns Cache adapter with database store
     */
    public createDatabaseDriver($config: Record<string, any>): CacheAdapter {
        return this.adapt(new DatabaseStore($config['table'], this.$container.database));
    }

    /**
     * Wrap the given cache store in a repository adapter.
     * @param $cache - Underlying store
     * @returns Cache adapter instance
     */
    public adapt($cache: any): CacheAdapter {
        return new CacheAdapter($cache, this.getConfig('enabled'));
    }

    /**
     * Get the cache prefix.
     * @returns Cache prefix string
     */
    public getPrefix(): string | undefined {
        return super.getConfig(`prefix`);
    }

    /**
     * Get the cache store configuration.
     * @param name - Store name
     * @returns Store configuration object
     */
    public getStoreConfig(name: string): Record<string, any> | undefined {
        return this.getConfig(`stores.${name}`);
    }

    /**
     * Get the driver configuration.
     * @param name - Store name
     * @returns Store configuration object
     */
    public getDriverConfig(name: string): Record<string, any> | undefined {
        return this.getStoreConfig(name);
    }

}

export default CacheManager;