/**
 * Class MemCache.
 */
class MemCache {
    #connection?: any;
    #config: Record<string, any>;

    /**
     * Create a new instance.
     * @param $config - Memcached configuration object
     */
    constructor($config: Record<string, any>) {
        this.#config = $config;
        if (typeof this.#config == 'object' && this.#config !== null) {
            this.#config.options = {};
        }
    }

    /**
     * Get or create Memcached connection.
     * @returns Memcached client connection
     */
    public getConnection(): any {
        if (!this.#connection) {
            const memcachedModule = require('memjs');
            const memcached = memcachedModule?.default || memcachedModule;
            const server = this.#config['server'];
            const memcachedClient = memcached as { Client: { create: (server: string, opts?: unknown) => unknown } };
            this.#connection = memcachedClient.Client.create(
                server['host'] + ':' + server['port'],
                { username: server['user'], password: server['password'], ...this.#config.options }
            );
        }
        return this.#connection;
    }
}

export default MemCache;