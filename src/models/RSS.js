module.exports = function () {
  const type = this.thinky.type
  const string = type.string

  return {
    tableName: 'RSS',
    schema: {
      id: string(),
      url: string()
    },
    relations: {
      belongsTo: ['Guild', 'rss', 'id', 'id']
    }
  }
}
