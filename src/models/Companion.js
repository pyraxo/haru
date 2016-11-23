module.exports = function () {
  const type = this.thinky.type
  const string = type.string
  const number = type.number
  const object = type.object
  const array = type.array

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
      }).default({}),
      hp: number().default(10),
      crit: number().default(1),
      atk: number().default(1),
      inventory: array().default([])
    },
    relations: {
      belongsTo: ['User', 'companion', 'id', 'id']
    }
  }
}
