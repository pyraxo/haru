const logger = require('winston')
const { Command } = require('../../core')

class Prefix extends Command {
  constructor (...args) {
    super(...args, {
      name: 'prefix',
      description: 'Allows moderators to set a guild\'s prefix',
      aliases: ['setprefix'],
      usage: [
        { name: 'prefix', type: 'string', optional: true }
      ],
      guildOnly: true
    })
  }

  async handle ({ msg, args, data }, responder) {
    const prefix = args.prefix
    try {
      let guild = await data.Guild.fetch(msg.guild.id)
      guild.prefix = prefix || process.env.CLIENT_PREFIX
      await guild.save()
      responder.success(prefix ? '{{success}}' : '{{revert}}', {
        tags: { prefix: `**\`${prefix || process.env.CLIENT_PREFIX}\`**` }
      })
    } catch (err) {
      logger.error(`Could not change prefix for ${msg.guild.name} (${msg.guild.id}) - ${err}`)
      responder.error('{{%ERROR}}')
    }
  }
}

module.exports = Prefix
