module.exports = function () {
  const type = this.thinky.type
  const string = type.string
  const number = type.number
  const array = type.array

  return {
    tableName: 'RSS',
    schema: {
      id: string(),
      lastUpdated: number().default(0),
      channels: array().default([]),
      name: string()
    },
    expiry: 300
  }
}
