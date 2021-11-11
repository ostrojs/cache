const StoreHelper = require('./StoreHelper')
const kClient = Symbol('client')
const kConnection = Symbol('connection')
const { minutesToMs } = require('../utils')
class MemcachedStore extends StoreHelper {

    constructor($client, $config, $prefix) {
        super($config, $prefix)
        this[kClient] = $client
    }

    get(key, defaultValue = null) {
        return this.connection().get(this.applyDotPrefix(key)).then(result => {
            return this.parseValue(result.value).value
        }).catch(err => defaultValue)
    }

    put(key, value, minutes = 0) {
        const prefixedKey = this.applyDotPrefix(key)
        let {
            serializedValue,
            valueType
        } = this.serializeValue(value)
        let expiration = minutes == Infinity ? 0 : minutesToMs(minutes).toString()
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