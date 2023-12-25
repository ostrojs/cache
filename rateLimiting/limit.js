
const Unlimited = require('./unlimited')
class Limit {

    $key;


    $maxAttempts;


    $decayMinutes;


    $responseCallback;


    constructor($key = '', $maxAttempts = 60, $decayMinutes = 1) {
        this.$key = $key;
        this.$maxAttempts = $maxAttempts;
        this.$decayMinutes = $decayMinutes;
    }


    static perMinute($maxAttempts) {
        return new this.constructor('', $maxAttempts);
    }

    static perMinutes($decayMinutes, $maxAttempts) {
        return new this.constructor('', $maxAttempts, $decayMinutes);
    }

    static perHour($maxAttempts, $decayHours = 1) {
        return new this.constructor('', $maxAttempts, 60 * $decayHours);
    }

    static perDay($maxAttempts, $decayDays = 1) {
        return new this.constructor('', $maxAttempts, 60 * 24 * $decayDays);
    }

    static none() {
        return new Unlimited;
    }

    by($key) {
        this.$key = $key;

        return this;
    }

    response($callback) {
        this.$responseCallback = $callback;

        return this;
    }
}

module.exports = Limit;