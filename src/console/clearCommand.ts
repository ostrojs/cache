import Command from '@ostro/console/command';

/**
 * Class ClearCommand.
 */
class ClearCommand extends Command {

    public get $signature(): string {
        return 'cache:clear';
    }

    public get $description(): string {
        return 'Flush the application cache';
    }

    public get $options(): any[] {
        return [
            this.createOption('--store [store] ', 'The name of the store you would like to clear').default(''),
        ];
    }

    public get $arguments(): any[] {
        return [
            this.createArgument('[tag]', 'The cache tags you would like to clear')
        ];
    }

    public $cache: any;
    public $files: any;

    /**
     * Create a new instance.
     * @param {*} $cache
     * @param {*} $files
     */
    constructor($cache: any, $files: any) {
        super()
        this.$cache = $cache;
        this.$files = $files;
    }

    /**
     * handle method.
     * @async
     * @returns {any}
     */
    public async handle() {
        let $successful = await this.cache().flush();

        await this.flushFacades();

        if (!$successful) {
            this.error('Failed to clear cache. Make sure you have the appropriate permissions.');
        }

        this.info('Application cache cleared!');
    }

    declare public $app: any;

    /**
     * flushFacades method.
     * @async
     * @returns {any}
     */
    public async flushFacades() {
        let storageFn = (globalThis as any).storage_path;
        let $storagePath = typeof storageFn === 'function' ? storageFn('framework/cache') : (this.$app?.storagePath ? this.$app.storagePath('framework/cache') : 'storage/framework/cache');
        if (!await this.$files.exists($storagePath)) {
            return;
        }
        let files = await this.$files.files($storagePath)
        for (let $file of files) {
            if ($file.match(/facade-.*\.js/)) {
                await this.$files.delete($file);
            }
        }
    }

    /**
     * cache method.
     * @returns {any}
     */
    public cache() {
        let $cache = this.$cache.store(this.argument('store'));
        let tags = this.tags();
        return (!tags || tags.length === 0) ? $cache : $cache.tags(tags);
    }

    /**
     * tags method.
     * @returns {any}
     */
    public tags() {
        let tags = this.option('tags');
        return typeof tags === 'string' ? tags.split(',').filter(data => data) : [];
    }

}

export default ClearCommand;