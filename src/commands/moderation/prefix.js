const logger = require('winston')
const { Command } = require('../../core')

class Prefix extends Command {
  constructor (...args) {
    super(...args, {
      name: 'prefix',
      description: 'Allows moderators to set a guild\'s prefix',
      aliases: ['setprefix'],
      usage: [{ name: 'prefix', type: 'string', optional: true }],
      options: { guildOnly: true, localeKey: 'settings', permissions: ['manageGuild'] }
    })
  }

  async handle ({ msg, args, data, settings }, responder) {
    if (!args.prefix) {
      return responder.format('emoji:info').reply('{{prefix.current}}', { tz: `**${settings.prefix}**` })
    }
    try {
      settings.prefix = args.prefix
      await settings.save()
      return responder.success(args.prefix ? '{{prefix.success}}' : '{{prefix.revert}}', {
        prefix: `**\`${args.prefix}\`**`
      })
    } catch (err) {
      logger.error(`Could not change prefix to '${args.prefix}' for ${msg.guild.name} (${msg.guild.id}) - ${err}`)
      return responder.error()
    }
  }
}

module.exports = Prefix
