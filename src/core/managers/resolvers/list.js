module.exports = {
  type: 'list',
  resolve: (content, { separator = ', ', maxLength = Infinity, minLength = 0, max = Infinity, min = 0, unique = false }) => {
    const list = content.split(separator)
    const num = list.length
    if (num > max) {
      return Promise.reject({
        message: '{{%resolver.list.MAX}}',
        tags: { max }
      })
    }
    if (num < min) {
      return Promise.reject({
        message: '{{%resolver.list.MIN}}',
        tags: { min }
      })
    }

    const itemLength = list.map(item => item.length)
    if (Math.max(...itemLength) > maxLength) {
      return Promise.reject({
        message: '{{%resolver.list.MAX_LENGTH}}',
        tags: { maxLength }
      })
    }
    if (Math.min(...itemLength) < minLength) {
      return Promise.reject({
        message: '{{%resolver.list.MIN_LENGTH}}',
        tags: { minLength }
      })
    }

    if (unique && new Set(list).size < list.length) {
      return Promise.reject({
        message: '{{%resolver.list.DUPES}}'
      })
    }
    return Promise.resolve(list)
  }
}
