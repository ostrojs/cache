/**
 * Resolves an object whose values are promises. If a promise rejects, it resolves to null.
 *
 * @typeParam T - Output object type
 * @param object - Object with promise values
 * @returns Object with resolved values
 */
export function promiseAll<T extends Record<string, any> = Record<string, any>>(object: Record<string, Promise<any>>): Promise<T> {
    const promisedProperties: Promise<any>[] = [];
    const objectKeys: string[] = Object.keys(object);
    objectKeys.forEach((key: string) => promisedProperties.push(object[key].catch((err: any) => null)));
    return Promise.all(promisedProperties)
        .then((resolvedValues: any[]) => {
            return resolvedValues.reduce((resolvedObject: Record<string, any>, property: any, index: number) => {
                resolvedObject[objectKeys[index]] = property;
                return resolvedObject;
            }, object as unknown as Record<string, any>) as T;
        });
}

/**
 * Normalizes duration to seconds from Date or number.
 *
 * @param duration - Date instance or duration in seconds
 * @returns Duration in seconds
 */
export function getSeconds(duration: Date | number): number {
    if (duration instanceof Date) {
        duration = ((duration.getTime() - Date.now()) / 1000);
    }
    return (duration * 60) > 0 ? duration : 0;
}

/**
 * Calculates future epoch timestamp in seconds.
 *
 * @param duration - Seconds to add to current timestamp
 * @returns Future epoch timestamp in seconds
 */
export function secondsToMs(duration: number): number {
    return Math.floor((Date.now() / 1000) + duration);
}