const { Command } = require('sylphy')

class Goodbye extends Command {
  constructor (...args) {
    super(...args, {
      name: 'goodbye',
      description: 'Allows moderators to send goodbye PMs',
      options: { guildOnly: true, localeKey: 'settings', modOnly: true },
      group: 'moderation'
    })
  }

  handle (container, responder) {
    return responder.selection(['set', 'get', 'enable'], {
      title: '{{goodbye.dialog}}',
      mapFunc: ch => responder.t(`{{goodbye.action.${ch}}}`)
    }).then(arg => arg.length ? this[arg[0]](container, responder) : false)
  }

  set ({ modules, msg, settings }, responder) {
    const butler = modules.get('butler')
    if (!butler) return
    return responder.format('emoji:info').dialog([{
      prompt: [
        '{{goodbye.get}}',
        '```',
        settings.goodbye.msg.replace('`', '\\`'),
        '```',
        '{{goodbye.setDialog}}'
      ],
      input: { type: 'string', name: 'message' }
    }], {
      author: `**${msg.author.username}**`,
      tags: butler.tags.map(k => `**\`${k}\`**`).join(', ')
    }).then(args => {
      settings.goodbye.msg = args.message
      return settings.save()
    }).then(() =>
      responder.success([
        '{{goodbye.success}}',
        '```',
        settings.goodbye.msg.replace('`', '\\`'),
        '```'
      ]), err => {
        if (typeof err === 'undefined') return
        this.logger.error(`Error setting goodbye message for ${msg.channel.guild.name} (${msg.channel.guild.id})`, err)
        return responder.error()
      }
    )
  }

  get ({ settings }, responder) {
    return responder.format('emoji:info').send([
      '{{goodbye.get}}',
      '```',
      settings.goodbye.msg.replace('`', '\\`'),
      '```'
    ])
  }

  enable ({ settings, msg }, responder) {
    settings.goodbye.chan = msg.channel.id
    return settings.save().then(() =>
      responder.success('{{goodbye.enabled}}', {
        channel: `**#${msg.channel.name}**`
      })
    )
  }
}

module.exports = Goodbye
