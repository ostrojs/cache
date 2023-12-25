
const InteractsWithTime = require('@ostro/support/interactsWithTime');

class RateLimiter extends InteractsWithTime {

    $cache;

    $limiters = {};

    constructor($cache) {
        super();
        this.$cache = $cache;
    }

    for($name, $callback) {
        this.$limiters[$name] = $callback;

        return this;
    }

    limiter($name) {
        return this.$limiters[$name] ?? null;
    }

    async attempt($key, $maxAttempts, $callback, $decaySeconds = 60) {
        if (await this.tooManyAttempts($key, $maxAttempts)) {
            return false;
        }
        $result = await $callback();
        if (is_null($result)) {
            $result = true;
        }

        return this.hit($key, $decaySeconds);

    }

    async tooManyAttempts($key, $maxAttempts) {
        if (await this.attempts($key) >= $maxAttempts) {
            if (await this.$cache.has(this.cleanRateLimiterKey($key) + ':timer')) {
                return true;
            }

            await this.resetAttempts($key);
        }

        return false;
    }

    async hit($key, $decaySeconds = 60) {
        $key = this.cleanRateLimiterKey($key);

        await this.$cache.put(
            $key + ':timer', this.availableAt($decaySeconds), $decaySeconds
        );
        if (!await this.$cache.has($key)) {
            await this.$cache.put($key, 0, $decaySeconds);
        }

        const $hits = await this.$cache.increment($key);

        return $hits;
    }

    attempts($key) {
        $key = this.cleanRateLimiterKey($key);

        return this.$cache.get($key, 0);
    }

    resetAttempts($key) {
        $key = this.cleanRateLimiterKey($key);

        return this.$cache.forget($key);
    }

    async remaining($key, $maxAttempts) {
        $key = this.cleanRateLimiterKey($key);

        const $attempts = await this.attempts($key);

        return $maxAttempts - $attempts;
    }

    retriesLeft($key, $maxAttempts) {
        return this.remaining($key, $maxAttempts);
    }


    clear($key) {
        $key = this.cleanRateLimiterKey($key);

        this.resetAttempts($key);

        return this.$cache.forget($key + ':timer');
    }

    async availableIn($key) {
        $key = this.cleanRateLimiterKey($key);
        return Math.max(0, await this.$cache.get($key + ':timer') - this.currentTime());
    }

    cleanRateLimiterKey($key) {
        return $key.replace(/&([a-z])[a-z]+;/ig, '$1');
    }
}

module.exports = RateLimiter