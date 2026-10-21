import Command from '@ostro/console/command';

/**
 * Class ForgetCommand.
 */
class ForgetCommand extends Command {

    public get $signature(): string {
        return 'cache:forget';
    }

    public get $description(): string {
        return 'Remove an item from the cache';
    }

    public get $arguments(): any[] {
        return [
            this.createArgument('key', 'The key to remove').required(),
            this.createArgument('store', 'The store to remove the key from')
        ];
    }

    public $cache: any;

    /**
     * Create a new instance.
     * @param {*} $cache
     */
    constructor($cache: any) {
        super()

        this.$cache = $cache;
    }

    /**
     * handle method.
     * @async
     * @returns {any}
     */
    public async handle() {
        await this.$cache.store(this.argument('store')).forget(
            this.argument('key')
        );

        this.info('The [' + this.argument('key') + '] key has been removed from the cache.');
    }
}

export default ForgetCommand;