module.exports = function () {
  const type = this.thinky.type
  const string = type.string
  const number = type.number
  const bool = type.boolean
  const array = type.array

  return {
    tableName: 'User',
    schema: {
      id: string(),
      credits: number().default(0),
      exp: number().default(0),
      level: number().default(0),
      petfood: number().default(0),
      deleted: bool().default(false),
      title: string().default('Commoner'),
      description: string().default('A simple wandering soul'),
      team: string().default('None'),
      inventory: array().default([]),
      excluded: bool().default(false)
    },
    expiry: 300,
    relations: {
      hasOne: ['Companion', 'companion', 'id', 'id']
    }
  }
}
