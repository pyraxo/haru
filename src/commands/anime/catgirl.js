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
    const options = {
      host: 'catgirls.brussell98.tk',
      port: 443,
      path: '/api/random',
      headers: { 'User-Agent': 'haru v2.1.0' }
    }
    const req = https.get(options, res => {
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
