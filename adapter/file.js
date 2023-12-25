const fs = require('fs-extra')
const StoreHelper = require('./StoreHelper')
const { secondsToMs } = require('../utils')
class FileStore extends StoreHelper {

    constructor($root, $config, $prefix) {
        super($config, $prefix)
        this.setRootPath($root)
    }

    async get(key) {
        return fs.readJson(this.applyPathPrefix(key)).then((result) => {
            if (Date.now() / 1000 >= Number(result.expiration)) {
                this.forget(key)
                return Promise.reject()
            }
            return this.parseValue(result)
        })
    }

    async put(key, value, seconds = 0) {
        let { serializedValue, valueType } = this.serializeValue(value)
        return fs.writeJson(this.applyPathPrefix(key), ({
            value: serializedValue,
            valueType: valueType,
            expiration: secondsToMs(seconds).toString()
        }))
            .then(result => true)
    }

    async forget(key) {
        return fs.remove(this.applyPathPrefix(key))
    }

    async flush() {
        return fs.emptyDir(this.getRootPath())
    }
}

module.exports = FileStore