const request = require('superagent')
const logger = require('winston')
const { Command } = require('../../core')

class Catgirl extends Command {
  constructor (...args) {
    super(...args, {
      name: 'catgirl',
      description: 'Fetches a random catgirl',
      usage: [{ name: 'nsfw', displayName: '--nsfw', type: 'string', choices: ['--nsfw'], optional: true, default: false }],
      options: { botPerms: ['embedLinks'], localeKey: 'images' }
    })
  }

  async handle ({ msg, args }, responder) {
    try {
      if (msg.channel.nsfw === false) return responder.error('{{wrongChannel}}')
      await responder.typing()
      const id = (await request.get(`https://nekos.brussell.me/api/v1/random/image${args.nsfw ? '?nsfw=true' : ''}`).set('User-Agent', 'haru v2.1.0')).body.images[0].id
      const url = `https://nekos.brussell.me/image/${id}`
      return responder
      .embed({
        color: this.colours.green,
        description: '📷  ' + responder.t('{{link}}', { image: `**[${responder.t('{{catgirl}}')}](${url})**` }),
        image: { url }
      })
      .send()
    } catch (err) {
      logger.error('Error encountered while querying catgirls -', err)
      return responder.error()
    }
  }
}

module.exports = Catgirl
