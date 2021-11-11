const ServiceProvider = require('@ostro/support/serviceProvider');
const cacheManager = require('./cacheManager')

class CacheServiceProvider extends ServiceProvider {

    register() {
       this.$app.singleton('cache', function(app) {
            return new cacheManager(app);
        });
    }

    async boot() {
    }

}
module.exports = CacheServiceProvider