module.exports = function () {
  const type = this.thinky.type
  const object = type.object
  const string = type.string
  const bool = type.boolean

  return {
    tableName: 'Guild',
    schema: {
      id: string(),
      permissions: object().default({}),
      deleted: bool().default(false),
      prefix: string().default(process.env.CLIENT_PREFIX),
      lang: string().default('en'),
      tz: string().default('utc'),
      events: object().default({}),
      welcome: object().schema({
        chan: string().allowNull(true).default(null),
        pm: bool().default(false),
        msg: string().default('Welcome {{user}} to {{guild}}!'),
      }).required().default({}),
      autorole: string().allowNull(true).default(null),
      goodbye: object().schema({
        chan: string().allowNull(true).default(null),
        msg: string().default('User {{user}} has left us.')
      }).required().default({}),
      excluded: bool().default(false)
    },
    expiry: 300
  }
}
