exports.promiseAll = function promiseAll(object) {
    let promisedProperties = [];
    const objectKeys = Object.keys(object);
    objectKeys.forEach((key) => promisedProperties.push(object[key].catch(err => null)));
    return Promise.all(promisedProperties)
        .then((resolvedValues) => {
            return resolvedValues.reduce((resolvedObject, property, index) => {
                resolvedObject[objectKeys[index]] = property;
                return resolvedObject;
            }, object);
        })
}

exports.getSeconds = function getSeconds(duration) {
    if (duration instanceof Date) {
        duration = ((duration.getTime() - Date.now()) / 1000)
    }
    return (duration * 60) > 0 ? duration : 0
}
exports.secondsToMs = function secondsToMs(duration) {
    return Math.floor((Date.now() / 1000) + duration)
}