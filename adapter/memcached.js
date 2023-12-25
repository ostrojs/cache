const StoreHelper = require('./StoreHelper')
const kClient = Symbol('client')
const kConnection = Symbol('connection')
const { secondsToMs } = require('../utils')
class MemcachedStore extends StoreHelper {

    constructor($client, $config, $prefix) {
        super($config, $prefix)
        this[kClient] = $client
    }

    get(key) {
        return this.connection().get(this.applyDotPrefix(key)).then(result => {
            return this.parseValue(result.value)
        })
    }

    put(key, value, seconds = 0) {
        const prefixedKey = this.applyDotPrefix(key)
        let {
            serializedValue,
            valueType
        } = this.serializeValue(value)
        let expiration = seconds == Infinity ? 0 : secondsToMs(seconds).toString()
        return this.connection().set(prefixedKey, JSON.stringify({
            value: serializedValue,
            valueType: valueType
        }), { expires: expiration }).then(result => true).catch(err => false)
    }

    forget(key) {

        return this.connection().delete(this.applyDotPrefix(key)).then(res => true).catch(err => false)
    }

    flush() {

        return this.connection().flush().then(res => true).catch(err => false)
    }

    connection() {
        return this[kConnection] = this[kConnection] ? this[kConnection] : this[kClient].getConnection()
    }

}

module.exports = MemcachedStore