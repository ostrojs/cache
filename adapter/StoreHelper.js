const path = require('path')
const url = require('url')
const crypto = require('crypto')
const fs = require('fs-extra')
const kConfig = Symbol('config')
const kPrefix = Symbol('prefix')
const kRootPath = Symbol('rootPah')
const kRootUrl = Symbol('rootUrl')

class StoreHelper {

    constructor(config, prefix = '') {
        this[kConfig] = config;
        this[kPrefix] = prefix;
    }

    getConfig() {
        return this[kConfig] || null
    }

    setRootUrl(root) {
        this[kRootUrl] = url.resolve(root, '')
    }

    setRootPath(root) {
        this[kRootPath] = path.normalize(root)
        fs.mkdirSync(path.normalize(this[kRootPath]), {
            recursive: true
        })
    }

    getPrefix() {
        return this[kPrefix] || ''
    }

    applyDotPrefix(key = '') {
        return this.getPrefix() + '.' + key
    }

    getRootPath() {
        return this[kRootPath]
    }

    applyPathPrefix(dest) {
        return path.resolve(this[kRootPath], crypto.createHash('md5').update(this.getPrefix() + '_' + dest).digest('hex'))
    }

    getRootUrl() {
        return this[kRootUrl]
    }

    applyUrlPrefix(dest = '/') {
        return url.resolve(([this[kRootUrl], dest].join('/')), '')
    }

    ensureDirectory(dir, callback) {
        fs.ensureDir(dir, callback)
    }

    parsePath(dest) {
        return path.parse(dest)
    }

    dirname(dest) {
        return this.parsePath(dest).dir
    }

    getContent(content) {
        if (Array.isArray(content))
            return content[0]
        else
            return content
    }

    getBufferData(content) {
        return this.getContent(content).buffer
    }

    valueType(value) {
        return valueType(value)
    }

    serializeValue(value) {
        let dataType = this.valueType(value)
        return {
            serializedValue: dataType != 'string' ? JSON.stringify(value) : value,
            valueType: dataType
        }
    }

    parseValue(obj) {
        obj = Buffer.isBuffer(obj) ? obj.toString() : obj
        obj = typeof obj == 'string' ? JSON.parse(obj) : obj
        if (['json', 'array', 'number'].includes(obj.valueType)) {
            obj.value = JSON.parse(obj.value)
        }
        obj.expiration = Number(obj.expiration)
        return obj
    }
}
module.exports = StoreHelper