module.exports = function validateStorage (storage) {
  for (let item of storage) {
    let valid = /^[a-zA-Z0-9_-]+$/g.test(item)
    if (!valid) {
      throw Error(`@storage-private name is invalid, must be [a-zA-Z0-9_-]: ${item}`)
    }
  }
}
