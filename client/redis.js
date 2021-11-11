const redis = require('redis')
const kConnection = Symbol('connection')
const kConfig = Symbol('config')

class RedisClient {

    constructor($config) {
        this[kConfig] = $config
        return this
    }

    getConnection() {
        if (!this[kConnection]) {
            let server = this[kConfig]['server']
            this[kConnection] = redis.createClient(server['port'],server['host'],server)
            this[kConnection].auth(server['password'])
        }
        return this[kConnection]
    }

}
module.exports = RedisClient