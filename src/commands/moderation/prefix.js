const logger = require('winston')
const { Command } = require('../../core')

class Prefix extends Command {
  constructor (...args) {
    super(...args, {
      name: 'prefix',
      description: 'Allows moderators to set a guild\'s prefix',
      aliases: ['setprefix'],
      usage: [{ name: 'prefix', type: 'string', optional: true }],
      options: { guildOnly: true, localeKey: 'settings' }
    })
  }

  async handle ({ msg, args, data }, responder) {
    const prefix = args.prefix
    try {
      let guild = await data.Guild.fetch(msg.guild.id)
      guild.prefix = prefix || process.env.CLIENT_PREFIX
      await guild.save()
      return responder.success(prefix ? '{{prefix.success}}' : '{{prefix.revert}}', {
        prefix: `**\`${prefix || process.env.CLIENT_PREFIX}\`**`
      })
    } catch (err) {
      logger.error(`Could not change prefix for ${msg.guild.name} (${msg.guild.id}) - ${err}`)
      return responder.error()
    }
  }
}

module.exports = Prefix
