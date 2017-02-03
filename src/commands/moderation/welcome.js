const logger = require('winston')
const { Command } = require('../../core')

class Welcome extends Command {
  constructor (...args) {
    super(...args, {
      name: 'welcome',
      description: 'Allows moderators to send welcome messages',
      options: { guildOnly: true, localeKey: 'settings', permissions: ['manageGuild'] }
    })
  }

  handle (container, responder) {
    const { msg, data, settings } = container
    return responder.selection(['set', 'get', 'enable'], {
      title: '{{welcome.dialog}}',
      mapFunc: ch => responder.t(`{{welcome.action.${ch}}}`)
    }).then(arg => arg.length ? this[arg[0]](container, responder) : false)
  }

  set ({ modules, msg, settings }, responder) {
    const butler = modules.get('butler')
    if (!butler) return
    return responder.format('emoji:info').dialog([{
      prompt: [
        '{{welcome.get}}',
        '```',
        settings.welcome.msg.replace('`', '\\`'),
        '```',
        '{{welcome.setDialog}}'
      ],
      input: { type: 'string', name: 'message' }
    }], {
      author: `**${msg.author.username}**`,
      tags: butler.tags.map(k => `**\`${k}\`**`).join(', ')
    }).then(args => {
      settings.welcome.msg = args.message
      return settings.save()
    }).then(() =>
      responder.success([
        '{{welcome.success}}',
        '```',
        settings.welcome.msg.replace('`', '\\`'),
        '```'
      ]), err => {
      logger.error(`Error setting welcome message for ${msg.channel.guild.name} (${msg.channel.guild.id}) -`, err)
      return responder.error()
    })
  }

  async get ({ settings }, responder) {
    return responder.format('emoji:info').send([
      '{{welcome.get}}',
      '```',
      settings.welcome.msg.replace('`', '\\`'),
      '```'
    ])
  }

  enable ({ settings, msg }, responder) {
    settings.welcome.chan = msg.channel.id
    return settings.save().then(() =>
      responder.success('{{welcome.enabled}}', {
        channel: `**#${msg.channel.name}**`
      })
    )
  }
}

module.exports = Welcome
