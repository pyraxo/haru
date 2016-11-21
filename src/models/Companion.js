module.exports = function () {
  const type = this.thinky.type
  const string = type.string
  const number = type.number
  const object = type.object

  return {
    tableName: 'Companion',
    schema: {
      id: string(),
      type: string(),
      name: string().default('Mongrel'),
      exp: number().default(0),
      stats: object().schema({
        wins: number().default(0),
        losses: number().default(0)
      }).default({})
    },
    relations: {
      belongsTo: ['User', 'companion', 'id', 'id']
    }
  }
}
