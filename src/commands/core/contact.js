const logger = require('winston')
const moment = require('moment-timezone')
const { Command } = require('../../core')

class Contact extends Command {
  constructor (...args) {
    super(...args, {
      name: 'contact',
      description: 'Report bugs, request features or leave feedback',
      usage: [
        { name: 'type', type: 'string', choices: ['report', 'request'], optional: false },
        { name: 'text', last: true }
      ]
    })
  }

  async handle ({ msg, args, modules, settings }, responder) {
    const portal = modules.get('portal')
    if (!portal) return

    const text = args.text.split(' ').slice(1).join(' ')

    switch (args.type) {
      case 'report': {
        return portal.tunnel('255971654910476288', '', { embed: {
          description: '**Bug Report**\n' + text,
          author: {
            name: `${msg.author.username}#${msg.author.discriminator}`,
            icon_url: msg.author.avatarURL
          },
          footer: {
            text: moment(new Date()).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a')
          }
        }})
      }
      case 'request': {
        return portal.tunnel('253516431092613130', '', { embed: {
          description: '**Suggestion**\n' + text,
          author: {
            name: `${msg.author.username}#${msg.author.discriminator}`,
            icon_url: msg.author.avatarURL
          },
          footer: {
            text: moment(new Date()).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a')
          }
        }})
      }
    }
  }
}

module.exports = Contact
