const fs = require('fs-extra')
const StoreHelper = require('./StoreHelper')
const { minutesToMs } = require('../utils')
class FileStore extends StoreHelper {

    constructor($root, $config, $prefix) {
        super($config, $prefix)
        this.setRootPath($root)
    }

    async get(key, defaultValue = null) {
        return fs.readJson(this.applyPathPrefix(key)).then((result) => {
            if (Date.now() / 1000 >= Number(result.expiration)) {
                this.forget(key)
                return null
            }
            return this.parseValue(result).value
        })
    }

    async put(key, value, minutes = 0) {
        let { serializedValue, valueType } = this.serializeValue(value)
        return fs.writeJson(this.applyPathPrefix(key), ({
                value: serializedValue,
                valueType: valueType,
                expiration: minutesToMs(minutes).toString()
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