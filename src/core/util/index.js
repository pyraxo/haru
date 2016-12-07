const util = require('./Util')

module.exports = Object.assign({
  Collection: require('./Collection'),
  Responder: require('./Responder'),
  Locales: require('./Locales'),
  Parser: require('./Parser'),
  Emojis: require('./Emojis'),
  LocalCache: require('./LocalCache'),
  Cache: require('./Cache')
}, util)
