const Limit = require('./limit');
class GlobalLimit extends Limit {

    constructor($maxAttempts, $decayMinutes = 1) {
        super('', $maxAttempts, $decayMinutes);
    }
}

module.exports = GlobalLimit;