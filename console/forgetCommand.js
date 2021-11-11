const Command = require('@ostro/console/command')

class ForgetCommand extends Command {

    get $signature() {
        return 'cache:forget';
    }

    get $description() {
        return 'Remove an item from the cache'
    }

    get $arguments() {
        return [
            this.createArgument('key', 'The key to remove').required(),
            this.createArgument('store', 'The store to remove the key from')
        ]
    }

    constructor($cache) {
        super()

        this.$cache = $cache;
    }

    async handle() {
        await this.$cache.store(this.argument('store')).forget(
            this.argument('key')
        );

        this.info('The [' + this.argument('key') + '] key has been removed from the cache.');
    }
}

module.exports = ForgetCommand