const StoreHelper = require('./StoreHelper')
const kStorage = Symbol('storage')
class ObjectStore extends StoreHelper {

    constructor($config) {
        super($config)
        this[kStorage] = Object.create(null)
    }

    async get(key, defaultValue = null) {
        let cache = this[kStorage][this.applyDotPrefix(key)]
        if (cache === undefined) {
            return defaultValue
        }
        if (Date.now() / 1000 >= Number(cache.expiration)) {
            this.forget(key)
            return defaultValue
        }
        return cache.value
    }

    async put(key, value, minutes = 0) {
        let expiration = Math.floor((Date.now() / 1000) + minutes * 60)
        this[kStorage][this.applyDotPrefix(key)] = {
            value: value,
            expiration: expiration.toString()
        }
        return true
    }

    async forget(key) {
        delete this[kStorage][this.applyDotPrefix(key)]
        return true
    }

    async flush() {

        this[kStorage] = {}
        return true

    }
}

module.exports = ObjectStore