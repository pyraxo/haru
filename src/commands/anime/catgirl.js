const https = require('https')
const logger = require('winston')
const { Command } = require('../../core')

class Catgirl extends Command {
  constructor (...args) {
    super(...args, {
      name: 'catgirl',
      description: 'Fetches a random catgirl',
      options: { perms: ['attachFiles'], localeKey: 'images' }
    })
  }

  async handle ({ msg, args }, responder) {
    const req = https.get('https://catgirls.brussell98.tk/api/random', res => {
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        const url = JSON.parse(data).url
        return responder
        .embed({
          color: this.colours.green,
          description: '📷  ' + responder.t('{{link}}', { image: `**[${responder.t('{{catgirl}}')}](${url})**` }),
          image: { url }
        })
        .send()
      })
    })
    req.on('error', err => {
      logger.error('Error encountered while querying catgirls')
      logger.error(err)
      return responder.error()
    })
    req.keepAlive = false
    req.end()
  }
}

module.exports = Catgirl
