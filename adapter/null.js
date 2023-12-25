class NullStore {

    async get(key,defaultValue=null) {
        return null
    }

    async put(key, value, seconds = 0) {
        return true
    }

    async forget(key) {
        return true
    }

    async flush() {
        return true
    }

}

module.exports = NullStore