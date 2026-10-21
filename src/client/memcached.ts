const kConnection: unique symbol = Symbol('connection');
const kConfig: unique symbol = Symbol('config');

/**
 * Class MemCache.
 */
class MemCache {

    [kConnection]?: any;
    [kConfig]: Record<string, any>;

    /**
     * Create a new instance.
     * @param $config - Memcached configuration object
     */
    constructor($config: Record<string, any>) {
        this[kConfig] = $config;
        if (typeof this[kConfig] == 'object' && this[kConfig] !== null) {
            this[kConfig].options = {};
        }
    }

    /**
     * Get or create Memcached connection.
     * @returns Memcached client connection
     */
    public getConnection(): any {
        if (!this[kConnection]) {
            const memcachedModule = require('memjs');
            const memcached = memcachedModule?.default || memcachedModule;
            const server = this[kConfig]['server'];
            this[kConnection] = (memcached as any).Client.create(
                server['host'] + ':' + server['port'],
                { username: server['user'], password: server['password'], ...this[kConfig].options }
            );
        }
        return this[kConnection];
    }

}

export default MemCache;