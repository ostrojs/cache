require('@ostro/support/helpers')
const InvalidArgumentException = require('@ostro/support/exceptions/invalidArgumentException')
const CacheAdapter = require('./cacheAdapter')
const Manager = require('@ostro/support/manager')

class CacheManager extends Manager {

    $type = 'cache';

    store(name = null) {
        return this.driver(name)
    }

    resolve(name) {

        let $config = this.getStoreConfig(name);

        if (!($config)) {
            throw new InvalidArgumentException(`Cache store [${name}] is not defined.`);
        }
        return super.resolve($config['driver'], $config)
    }

    createMemoryDriver($config) {
        return this.adapt(new(require('./adapter/memory'))($config));
    }

    createRedisDriver($config) {
        return this.adapt(new(require('./adapter/redis'))(new(require('./client/redis'))($config), $config, this.getPrefix()));
    }

    createMemcachedDriver($config) {
        return this.adapt(new(require('./adapter/memcached'))(new(require('./client/memcached'))($config), $config, this.getPrefix()));
    }

    createNullDriver($config) {
        return this.adapt(new(require('./adapter/null'))($config));
    }

    createFileDriver($config) {
        return this.adapt(new(require('./adapter/file'))($config['path'], $config, this.getPrefix()))
    }

    createDatabaseDriver($config) {
        return this.adapt(new(require('./adapter/database'))($config['table'], this.$container.database))
    }

    adapt($cache) {
        return new CacheAdapter($cache, this.$config.get(`${this.$type}.enabled`));
    }

    getPrefix() {
        return this.$config.get(`${this.$type}.prefix`);
    }

    getStoreConfig(name) {
        return this.$config.get(`${this.$type}.stores.${name}`);
    }

}

module.exports = CacheManager