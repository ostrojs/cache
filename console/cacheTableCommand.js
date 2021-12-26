const Command = require('@ostro/console/command')
class CacheTableCommand extends Command {

    $signature = 'cache:table';

    $description = 'Create a migration for the cache database table';

    constructor($files) {
        super();
        this.$file = $files;
    }

    async handle() {
        let $fullPath = await this.createBaseMigration();

        await this.$file.put($fullPath, await this.$file.get(__dirname + '/stubs/cache.stub'));

        this.info('Migration created successfully!');

    }

    createBaseMigration() {
        let $name = 'create_cache_table';

        let $path = this.$app.databasePath('migrations');

        return this.$app['migration.creator'].create($name, $path);
    }
}

module.exports = CacheTableCommand