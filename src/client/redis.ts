/**
 * Class RedisClient.
 */
class RedisClient {
    #connection?: any;
    #config: Record<string, any>;

    /**
     * Create a new instance.
     * @param $config - Redis configuration object
     */
    constructor($config: Record<string, any>) {
        this.#config = $config;
    }

    /**
     * Get or create Redis connection.
     * @returns Redis connection instance
     */
    public getConnection(): any {
        if (!this.#connection) {
            const redisModule = require('redis');
            const redis = redisModule?.default || redisModule;
            const server = this.#config['server'];
            const redisClientFactory = redis as { createClient: (port: number, host: string, opts?: unknown) => { auth: (pass: string) => void } };
        this.#connection = redisClientFactory.createClient(server['port'], server['host'], server);
            this.#connection.auth(server['password']);
        }
        return this.#connection;
    }
}

export default RedisClient;