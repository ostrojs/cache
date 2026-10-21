import Command from '@ostro/console/command';
/**
 * Class CacheTableCommand.
 */
class CacheTableCommand extends Command {

    public get $signature(): string {
        return 'cache:table';
    }

    public get $description(): string {
        return 'Create a migration for the cache database table';
    }

    public $file: any;
    declare public $app: any;

    /**
     * Create a new instance.
     * @param {*} $files
     */
    constructor($files: any) {
        super();
        this.$file = $files;
    }

    /**
     * handle method.
     * @async
     * @returns {any}
     */
    public async handle() {
        let $fullPath = await this.createBaseMigration();

        let stubName = $fullPath.endsWith('.ts') ? '/stubs/cache.ts.stub' : '/stubs/cache.stub';
        await this.$file.put($fullPath, await this.$file.get(__dirname + stubName));

        this.info('Migration created successfully!');

    }

    /**
     * createBaseMigration method.
     * @returns {any}
     */
    public createBaseMigration() {
        let $name = 'create_cache_table';

        let $path = this.$app.databasePath('migrations');

        return this.$app['migration.creator'].create($name, $path);
    }
}

export default CacheTableCommand;