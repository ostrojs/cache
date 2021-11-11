const { promisify } = require("util");
const fs = require('fs-extra')
const kConnection = Symbol('connection')
const kTable = Symbol('table')

class Database {

    constructor(table, $connection) {
        this[kTable] = table;
        this[kConnection] = $connection;
    }

    async get(key, defaultValue = null) {
        return this[kConnection].table(this[kTable]).where({ key }).first().then(res => (res || Promise.reject(defaultValue))).then((result) => {
                if (Date.now() / 1000 >= Number(result.expiration)) {
                    this.forget(key)
                    return defaultValue
                }
                try { return JSON.parse(result.value) } catch (e) { return result.value }
            })
            .catch(err => defaultValue)
    }

    async put(key, value, minutes = 0) {
        return this[kConnection].table(this[kTable]).updateOrInsert({ key }, {
                value: typeof value == 'object' ? JSON.stringify(value) : value,
                expiration: Math.floor((Date.now() / 1000) + (minutes * 60)).toString()
            })
            .then(result => true)
            .catch(err => false)
    }

    async forget(key) {
        return this[kConnection].table(this[kTable]).where({ key }).delete().then(res => true).catch(err => false)
    }

    async flush() {
        return this[kConnection].table(this[kTable]).delete().then(res => true).catch(err => false)
    }
}

module.exports = Database