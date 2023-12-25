const Promise = require("bluebird")
const StoreHelper = require('./StoreHelper')
const kClient = Symbol('client')
const kConnection = Symbol('connection')
const { secondsToMs } = require('../utils')
class RedisStore extends StoreHelper {

    constructor($redisClient, $config, $prefix) {
        super($config, $prefix)
        this[kClient] = $redisClient
    }

    async get(key) {
        return this.connection().getAsync(this.applyDotPrefix(key)).then(result => {
            return this.parseValue(result)
        })
    }

    async put(key, value, seconds = 0) {
        const prefixedKey = this.applyDotPrefix(key)
        let {
            serializedValue,
            valueType
        } = this.serializeValue(value)
        let expiration = seconds == Infinity ? [] : ['EX', (secondsToMs(seconds)).toString()]
        return this.connection().setAsync(prefixedKey, JSON.stringify({
            value: serializedValue,
            valueType: valueType
        }), ...expiration).then(result => true).catch(err => false)
    }

    async forget(key) {
        return this.connection().delAsync(this.applyDotPrefix(key)).then(res => true).catch(err => false)
    }

    async flush() {
        return this.connection().flushdbAsync().then(res => true).catch(err => false)
    }

    connection() {
        return this[kConnection] = this[kConnection] ? this[kConnection] : Promise.promisifyAll(this[kClient].getConnection())
    }

}

module.exports = RedisStore