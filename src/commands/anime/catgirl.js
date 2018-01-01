const request = require('superagent')
const { Command, utils } = require('sylphy')

class Catgirl extends Command {
  constructor (...args) {
    super(...args, {
      name: 'catgirl',
      description: 'Fetches a random catgirl',
      usage: [{ name: 'nsfw', displayName: '--nsfw', type: 'string', choices: ['--nsfw'], optional: true }],
      options: { botPerms: ['embedLinks'], localeKey: 'images' },
      group: 'anime'
    })
  }

  async handle ({ msg, args }, responder) {
    try {
      if (msg.channel.nsfw === false) return responder.error('{{wrongChannel}}')
      await responder.typing()
      const url = (await request.get(`https://catgirls.brussell98.tk/api/${args.nsfw ? 'nsfw/' : ''}random`).set('User-Agent', 'haru v2.1.0')).body.url
      return responder
      .embed({
        color: utils.getColour('green'),
        description: '📷  ' + responder.t('{{link}}', { image: `**[${responder.t('{{catgirl}}')}](${url})**` }),
        image: { url }
      })
      .send()
    } catch (err) {
      this.logger.error('Error encountered while querying catgirls')
      this.logger.error(err)
      return responder.error()
    }
  }
}

module.exports = Catgirl
