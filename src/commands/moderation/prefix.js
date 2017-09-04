const { Command } = require('sylphy')

class Prefix extends Command {
  constructor (...args) {
    super(...args, {
      name: 'prefix',
      description: 'Allows moderators to set a guild\'s prefix',
      aliases: ['setprefix'],
      usage: [{ name: 'prefix', type: 'string', optional: true }],
      options: { guildOnly: true, localeKey: 'settings', permissions: ['manageGuild'] },
      group: 'moderation'
    })
  }

  async handle ({ msg, args, settings }, responder) {
    if (!args.prefix) {
      return responder.format('emoji:info').reply('{{prefix.current}}', { prefix: `**${settings.prefix}**` })
    }
    try {
      settings.prefix = args.prefix
      await settings.save()
      return responder.success(args.prefix ? '{{prefix.success}}' : '{{prefix.revert}}', {
        prefix: `**\`${args.prefix}\`**`
      })
    } catch (err) {
      this.logger.error(`Could not change prefix to '${args.prefix}' for ${msg.channel.guild.name} (${msg.channel.guild.id}) -`, err)
      return responder.error()
    }
  }
}

module.exports = Prefix
