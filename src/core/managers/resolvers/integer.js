module.exports = {
  type: 'int',
  resolve: (content, { min = 0, max = Infinity }) => {
    const num = parseInt(content, 10)
    if (isNaN(num)) {
      return Promise.reject({ message: '{{%resolver.int.NOT_INT}}' })
    }
    if (num > max) {
      return Promise.reject({
        message: '{{%resolver.int.MAX}}',
        tags: { max }
      })
    }
    if (num < min) {
      return Promise.reject({
        message: '{{%resolver.int.MIN}}',
        tags: { min }
      })
    }
    return Promise.resolve(num)
  }
}
