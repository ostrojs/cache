require('@ostro/support/helpers')
const InvalidArgumentException = require('@ostro/support/exceptions/invalidArgumentException')
const CacheAdapter = require('./cacheAdapter')
const {
    Macroable
} = require('@ostro/support/macro')
const kApp = Symbol('app')
const kStores = Symbol('stores')
const kCustomCreators = Symbol('customCreators')
class CacheManager extends Macroable {

    constructor(app) {
        super()
        Object.defineProperties(this, {
            [kApp]: {
                value: app,
            },
            [kStores]: {
                value: {},
                writable: true
            },
            [kCustomCreators]: {
                value: {},
                writable: true
            },
        })
    }

    store($name = null) {
        $name = $name || this.getDefaultDriver();
        return this[kStores][$name] = this.getDriver($name);
    }

    driver($driver = null) {
        return this.store($driver);
    }

    config() {
        return this[kApp]['config'].get('cache')
    }

    getDriver(name) {
        return this[kStores][name] || this.resolve(name);
    }

    resolve(name) {

        let $config = this.getConfig(name);
        if (!($config)) {
            throw new InvalidArgumentException(`Cache store [{${name}}] is not defined.`);
        }
        if ((this[kCustomCreators][$config['driver']])) {
            return this.callCustomCreator($config);
        } else {
            let $driverMethod = 'create' + $config['driver'].ucfirst() + 'Driver';
            if ((this[$driverMethod])) {
                return this[$driverMethod]($config);
            } else {
                throw new InvalidArgumentException(`Driver [{${$config['driver']}}] is not supported.`);
            }
        }
    }

    callCustomCreator($config) {
        return this[kCustomCreators][$config['driver']];
    }

    createMemoryDriver($config) {
        return this.adapt(new(require('./adapter/memory'))($config));
    }

    createRedisDriver($config) {
        return this.adapt(new(require('./adapter/redis'))(new (require('./client/redis'))($config),$config,this.getPrefix()));
    }

    createMemcachedDriver($config) {
        return this.adapt(new(require('./adapter/memcached'))(new (require('./client/memcached'))($config),$config,this.getPrefix()));
    }

    createNullDriver($config) {
        return this.adapt(new(require('./adapter/null'))($config));
    }

    createIcacheDriver($config) {
        return this.adapt(new(require('./adapter/icache'))($config['url'], $config))
    }

    createFileDriver($config) {
        return this.adapt(new(require('./adapter/file'))($config['path'], $config,this.getPrefix()))
    }

    createDatabaseDriver($config) {
        return this.adapt(new(require('./adapter/database'))($config['table'], this[kApp].database))
    }

    adapt($cache) {
        return new CacheAdapter($cache,this[kApp]['config']['cache']['enabled']);
    }

    set($name, $driver) {
        this[kStores][$name] = $driver;
        return this;
    }

    repository($store) {
        return this.adapt($store);
    }

    getPrefix($config = {}) {
        return $config['prefix'] || this[kApp]['config']['cache']['prefix'];
    }

    getConfig($name) {
        return this[kApp]['config']['cache']['stores'][$name];
    }

    getDefaultDriver() {
        return this[kApp]['config']['cache']['default'] || 'null';
    }

    setDefaultDriver($name) {
        this[kApp]['config']['cache.default'] = $name;
    }

    extends($driver, $callback) {
        const config = this.getConfig($driver)
        if (!config) {
            throw new InvalidArgumentException(`Config not found for  [{${$driver}}] driver.`);
        }
        this[kCustomCreators][config['driver']] = $callback.call(this, this);
        return this;
    }

    __get(target, method) {
        return this.make(target.store(), method)
    }
}

module.exports = CacheManager