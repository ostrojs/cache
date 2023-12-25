const GlobalLimit = require('./globalLimit');
class Unlimited extends GlobalLimit {

    constructor() {
        super(Infinity);
    }
}

module.exports = Unlimited;