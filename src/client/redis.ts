const kConnection: unique symbol = Symbol('connection');
const kConfig: unique symbol = Symbol('config');

/**
 * Class RedisClient.
 */
class RedisClient {

    [kConnection]?: any;
    [kConfig]: Record<string, any>;

    /**
     * Create a new instance.
     * @param $config - Redis configuration object
     */
    constructor($config: Record<string, any>) {
        this[kConfig] = $config;
    }

    /**
     * Get or create Redis connection.
     * @returns Redis connection instance
     */
    public getConnection(): any {
        if (!this[kConnection]) {
            const redisModule = require('redis');
            const redis = redisModule?.default || redisModule;
            const server = this[kConfig]['server'];
            this[kConnection] = (redis as any).createClient(server['port'], server['host'], server);
            this[kConnection].auth(server['password']);
        }
        return this[kConnection];
    }

}

export default RedisClient;