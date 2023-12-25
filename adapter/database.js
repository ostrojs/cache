const kConnection = Symbol('connection');
const kTable = Symbol('table');
const StoreHelper = require('./StoreHelper')

class Database extends StoreHelper {

    constructor(table, $connection) {
        this[kTable] = table;
        this[kConnection] = $connection;
    }

    async get(key) {
        return this[kConnection].table(this[kTable]).where({ key }).first().then(res => (res || Promise.reject(defaultValue))).then((result) => {
            if (Date.now() / 1000 >= Number(result.expiration)) {
                this.forget(key)
                return Promise.reject()
            }
            try {
                result.value = JSON.parse(result.value);
                return result
            } catch (e) { return result }
        })
    }

    async put(key, value, seconds = 0) {
        let { serializedValue, valueType } = this.serializeValue(value)
        return this[kConnection].table(this[kTable]).updateOrInsert({ key }, {
            value: serializedValue,
            valueType: valueType,
            expiration: secondsToMs(seconds).toString()
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