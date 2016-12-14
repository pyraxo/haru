const request = require('superagent')
const logger = require('winston')
const { Command } = require('../../core')

class Catgirl extends Command {
  constructor (...args) {
    super(...args, {
      name: 'catgirl',
      description: 'Fetches a random catgirl',
      options: { botPerms: ['embedLinks'], localeKey: 'images' }
    })
  }

  async handle ({ msg, args }, responder) {
    try {
      await responder.typing()
      const url = (await request.get('https://catgirls.brussell98.tk/api/random').set('User-Agent', 'haru v2.1.0')).body.url
      return responder
      .embed({
        color: this.colours.green,
        description: '📷  ' + responder.t('{{link}}', { image: `**[${responder.t('{{catgirl}}')}](${url})**` }),
        image: { url }
      })
      .send()
    } catch (err) {
      logger.error('Error encountered while querying catgirls')
      logger.error(err)
      return responder.error()
    }
  }
}

module.exports = Catgirl
