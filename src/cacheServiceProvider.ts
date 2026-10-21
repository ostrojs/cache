import ServiceProvider from '@ostro/support/serviceProvider';
import cacheManager from './cacheManager';

/**
 * Class CacheServiceProvider.
 */
class CacheServiceProvider extends ServiceProvider {

    /**
     * register method.
     * @returns {any}
     */
    public register() {
       this.$app.singleton('cache', function(app) {
            return new cacheManager(app);
        });
    }

    /**
     * boot method.
     * @async
     * @returns {any}
     */
    public async boot() {
    }

}
export default CacheServiceProvider;