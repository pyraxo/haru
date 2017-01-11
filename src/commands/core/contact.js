const moment = require('moment')
const { Command } = require('../../core')

class Contact extends Command {
  constructor (...args) {
    super(...args, {
      name: 'contact',
      description: 'Report bugs, request features or leave feedback',
      usage: [
        {
          name: 'type',
          displayName: 'report | request | feedback',
          type: 'string',
          choices: ['report', 'request', 'feedback'],
          optional: false
        },
        { name: 'text', last: true }
      ]
    })
  }

  async handle ({ msg, args, modules, settings }, responder) {
    const portal = modules.get('portal')
    if (!portal) return

    const text = args.text
    let channelID = '253516403124994049'
    let title = 'Feedback'

    switch (args.type) {
      case 'report': {
        channelID = '255971654910476288'
        title = 'Bug Report'
        break
      }
      case 'request': {
        channelID = '253516431092613130'
        title = 'Suggestion'
        break
      }
    }

    portal.tunnel(channelID, '', { embed: {
      description: `**${title}**\n` + text,
      author: {
        name: `${msg.author.username}#${msg.author.discriminator}`,
        icon_url: msg.author.avatarURL
      },
      footer: {
        text: moment().locale(settings.lang).format('ddd Do MMM, YYYY [at] hh:mm:ss a')
      }
    }})

    return responder.success('your feedback has been sent. Thank you for your time!')
  }
}

module.exports = Contact
