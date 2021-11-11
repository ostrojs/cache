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

exports.getMinutes = function getMinutes(duration) {
    if (duration instanceof Date) {
        duration = ((duration.getTime() - Date.now()) / 1000) / 60
    }
    return   (duration * 60) > 0 ? duration : 0
}
exports.minutesToMs = function minutesToMs(duration) {
    return Math.floor((Date.now() / 1000) + (duration * 60))
}