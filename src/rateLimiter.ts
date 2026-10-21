import InteractsWithTime from '@ostro/support/interactsWithTime';
import type { ICacheRepository } from '@ostro/contracts/cache/repositry';

const is_null = (val: unknown): boolean => val == null;

/**
 * Class RateLimiter.
 */
class RateLimiter extends InteractsWithTime {

    public $cache: ICacheRepository;

    public $limiters: Record<string, Function> = {};

    /**
     * Create a new instance.
     * @param $cache - Cache repository instance
     */
    constructor($cache: ICacheRepository) {
        super();
        this.$cache = $cache;
    }

    /**
     * Register a named limiter configuration.
     * @param $name - Limiter name
     * @param $callback - Limiter callback
     * @returns Fluent instance
     */
    for($name: string, $callback: Function): this {
        this.$limiters[$name] = $callback;

        return this;
    }

    /**
     * Retrieve a named limiter callback.
     * @param $name - Limiter name
     * @returns Limiter callback or null
     */
    public limiter($name: string): Function | null {
        return this.$limiters[$name] ?? null;
    }

    /**
     * Attempt to execute a callback within rate limits.
     * @param $key - Cache key identifier
     * @param $maxAttempts - Maximum attempts allowed
     * @param $callback - Action callback
     * @param $decaySeconds - Decay time in seconds
     * @returns Hit count or false if limit reached
     */
    public async attempt($key: string, $maxAttempts: number, $callback: Function, $decaySeconds: number = 60): Promise<number | false> {
        if (await this.tooManyAttempts($key, $maxAttempts)) {
            return false;
        }
        let $result = await $callback();
        if (is_null($result)) {
            $result = true;
        }

        return this.hit($key, $decaySeconds);
    }

    /**
     * Determine if given key has exceeded max attempts.
     * @param $key - Cache key identifier
     * @param $maxAttempts - Maximum attempts allowed
     * @returns True if limit exceeded
     */
    public async tooManyAttempts($key: string, $maxAttempts: number): Promise<boolean> {
        if (await this.attempts($key) >= $maxAttempts) {
            if (await this.$cache.has(this.cleanRateLimiterKey($key) + ':timer')) {
                return true;
            }

            await this.resetAttempts($key);
        }

        return false;
    }

    /**
     * Increment the counter for a given key.
     * @param $key - Cache key identifier
     * @param $decaySeconds - Decay time in seconds
     * @returns Hits count
     */
    public async hit($key: string, $decaySeconds: number = 60): Promise<number> {
        $key = this.cleanRateLimiterKey($key);

        await this.$cache.put(
            $key + ':timer', this.availableAt($decaySeconds), $decaySeconds
        );
        if (!await this.$cache.has($key)) {
            await this.$cache.put($key, 0, $decaySeconds);
        }

        const $hits = (await this.$cache.increment($key)) as number;

        return $hits;
    }

    /**
     * Get the number of attempts for the given key.
     * @param $key - Cache key identifier
     * @returns Number of attempts
     */
    public attempts($key: string): Promise<number> {
        $key = this.cleanRateLimiterKey($key);

        return this.$cache.get($key, 0) as Promise<number>;
    }

    /**
     * Reset the number of attempts for the given key.
     * @param $key - Cache key identifier
     * @returns True if reset succeeded
     */
    public resetAttempts($key: string): Promise<boolean> {
        $key = this.cleanRateLimiterKey($key);

        return this.$cache.forget($key);
    }

    /**
     * Get the number of remaining attempts.
     * @param $key - Cache key identifier
     * @param $maxAttempts - Maximum attempts allowed
     * @returns Remaining attempts
     */
    public async remaining($key: string, $maxAttempts: number): Promise<number> {
        $key = this.cleanRateLimiterKey($key);

        const $attempts = await this.attempts($key);

        return $maxAttempts - $attempts;
    }

    /**
     * Alias for remaining().
     * @param $key - Cache key identifier
     * @param $maxAttempts - Maximum attempts allowed
     * @returns Remaining attempts
     */
    public retriesLeft($key: string, $maxAttempts: number): Promise<number> {
        return this.remaining($key, $maxAttempts);
    }

    /**
     * Clear the hits and timer for the key.
     * @param $key - Cache key identifier
     * @returns True if clear succeeded
     */
    public clear($key: string): Promise<boolean> {
        $key = this.cleanRateLimiterKey($key);

        this.resetAttempts($key);

        return this.$cache.forget($key + ':timer');
    }

    /**
     * Get the number of seconds until the "key" is accessible again.
     * @param $key - Cache key identifier
     * @returns Remaining seconds
     */
    public async availableIn($key: string): Promise<number> {
        $key = this.cleanRateLimiterKey($key);
        const timerVal = ((await this.$cache.get($key + ':timer')) as number) || 0;
        return Math.max(0, timerVal - this.currentTime());
    }

    /**
     * Clean the rate limiter key from HTML entities.
     * @param $key - Rate limiter key
     * @returns Sanitized key
     */
    public cleanRateLimiterKey($key: string): string {
        return $key.replace(/&([a-z])[a-z]+;/ig, '$1');
    }
}

export default RateLimiter;