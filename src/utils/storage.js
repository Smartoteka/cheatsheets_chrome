/**
 * Retrieve object from Chrome's Local StorageArea
 * @param {string} key
 */
const get = async function (key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, function (value) {
        resolve(value[key])
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Get whole value from Chrome Local StorageArea.
 *
 * @param {string or array of string keys} keys
 */

const getAll = async function (keys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(...keys, function (value) {
        resolve(value)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Save Object in Chrome's Local StorageArea
 * @param {*} obj
 */
const set = async function (obj) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(obj, function () {
        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Removes Object from Chrome Local StorageArea.
 *
 * @param {string or array of string keys} keys
 */
const remove = async function (keys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(keys, function () {
        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Setting up a hook
 *
 * @param {string, function} value
 }} value
 */

function watch(value, fn) {
  chrome.storage.onChanged.addListener((changes) => {
    if (value in changes) {
      const change = changes[value]
      fn(change.oldValue, change.newValue)
    }
  })
}

export default {
  get,
  getAll,
  set,
  remove,
  watch,
}
