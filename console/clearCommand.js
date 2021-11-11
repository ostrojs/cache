const Command = require('@ostro/console/command')

class ClearCommand extends Command {

    get $signature() {
        return 'cache:clear';
    }

    get $description() {
        return 'Flush the application cache'
    };

    get $options() {
        return [
            this.createOption('--store [store] ', 'The name of the store you would like to clear').default(''),
        ]
    }

    get $arguments() {
        return [
            this.createArgument('[tag]', 'The cache tags you would like to clear')
        ]
    }

    constructor($cache, $files) {
        super()

        this.$cache = $cache;
        this.$files = $files;
    }

    async handle() {
        let $successful = await this.cache().flush();

        await this.flushFacades();

        if (!$successful) {
            this.error('Failed to clear cache. Make sure you have the appropriate permissions.');
        }

        this.info('Application cache cleared!');
    }

    async flushFacades() {
        let $storagePath = storage_path('framework/cache')
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

    cache() {
        return this.$cache.store(this.argument('store'));

        return empty(this.tags()) ? $cache : $cache.tags(this.tags());
    }

    tags() {
        return this.option('tags').split(',').filter(data => data)
    }

}

module.exports = ClearCommand