const StoreHelper = require('./StoreHelper');
const kStorage = Symbol('storage');
const { secondsToMs } = require('../utils')

class ObjectStore extends StoreHelper {

    constructor($config) {
        super($config)
        this[kStorage] = Object.create(null)
    }

    async get(key) {
        let cache = this[kStorage][this.applyDotPrefix(key)]
        if (cache === undefined) {
            return Promise.reject()
        }
        if (Date.now() / 1000 >= cache.expiration) {
            this.forget(key)
            return Promise.reject()
        }
        return Promise.resolve(cache)
    }

    async put(key, value, seconds = 0) {
        let expiration = secondsToMs(seconds);
        this[kStorage][this.applyDotPrefix(key)] = {
            value: value,
            expiration: expiration
        }
        return true
    }

    async forget(key) {
        delete this[kStorage][this.applyDotPrefix(key)]
        return Promise.resolve(true)
    }

    async flush() {

        this[kStorage] = {}
        return Promise.resolve(true)

    }
}

module.exports = ObjectStore