/**
 * Class Limit.
 */
class Limit {

    public $key: string;
    public $maxAttempts: number;
    public $decayMinutes: number;
    $responseCallback?: Function;

    /**
     * Create a new instance.
     * @param $key - Limiter key identifier
     * @param $maxAttempts - Maximum allowed attempts
     * @param $decayMinutes - Decay duration in minutes
     */
    constructor($key: string = '', $maxAttempts: number = 60, $decayMinutes: number = 1) {
        this.$key = $key;
        this.$maxAttempts = $maxAttempts;
        this.$decayMinutes = $decayMinutes;
    }

    /**
     * Create rate limit per minute.
     * @param $maxAttempts - Maximum allowed attempts
     * @returns New Limit instance
     */
    static perMinute($maxAttempts: number): Limit {
        return new this('', $maxAttempts);
    }

    /**
     * Create rate limit for given minutes.
     * @param $decayMinutes - Decay duration in minutes
     * @param $maxAttempts - Maximum allowed attempts
     * @returns New Limit instance
     */
    static perMinutes($decayMinutes: number, $maxAttempts: number): Limit {
        return new this('', $maxAttempts, $decayMinutes);
    }

    /**
     * Create rate limit per hour.
     * @param $maxAttempts - Maximum allowed attempts
     * @param $decayHours - Decay duration in hours
     * @returns New Limit instance
     */
    static perHour($maxAttempts: number, $decayHours: number = 1): Limit {
        return new this('', $maxAttempts, 60 * $decayHours);
    }

    /**
     * Create rate limit per day.
     * @param $maxAttempts - Maximum allowed attempts
     * @param $decayDays - Decay duration in days
     * @returns New Limit instance
     */
    static perDay($maxAttempts: number, $decayDays: number = 1): Limit {
        return new this('', $maxAttempts, 60 * 24 * $decayDays);
    }

    /**
     * Create an unlimited rate limit.
     * @returns New Unlimited instance
     */
    static none(): Limit.Unlimited {
        return new Limit.Unlimited();
    }

    /**
     * Set the key for the rate limit.
     * @param $key - Key identifier
     * @returns Fluent instance
     */
    public by($key: string): this {
        this.$key = $key;

        return this;
    }

    /**
     * Set the response callback.
     * @param $callback - Custom response callback
     * @returns Fluent instance
     */
    public response($callback: Function): this {
        this.$responseCallback = $callback;

        return this;
    }
}

namespace Limit {
    /**
     * Class GlobalLimit.
     */
    export class GlobalLimit extends Limit {
        /**
         * Create a new GlobalLimit instance.
         * @param $maxAttempts - Maximum allowed attempts
         * @param $decayMinutes - Decay duration in minutes
         */
        constructor($maxAttempts: number, $decayMinutes: number = 1) {
            super('', $maxAttempts, $decayMinutes);
        }
    }

    /**
     * Class Unlimited.
     */
    export class Unlimited extends GlobalLimit {
        /**
         * Create a new Unlimited instance.
         */
        constructor() {
            super(Infinity);
        }
    }
}

export default Limit;