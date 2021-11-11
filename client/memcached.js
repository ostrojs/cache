const memcached  = require('memjs')
const kConnection = Symbol('connection')
const kConfig = Symbol('config')

class MemCache {

    constructor($config) {
        this[kConfig] = $config
        if(typeof this[kConfig] == 'object'){
            this[kConfig].options = {}
        }
        return this
    }

    getConnection() {
        if (!this[kConnection]) {
            let server = this[kConfig]['server']
            this[kConnection] = memcached.Client.create(server['host']+':'+server['port'],{username:server['user'],password:server['password'],...this[kConfig].options})
        }
        return this[kConnection]
    }

}
module.exports = MemCache