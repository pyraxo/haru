const logger = require('winston')
const { Command } = require('../../core')

class Lang extends Command {
  constructor (...args) {
    super(...args, {
      name: 'lang',
      description: 'Allows moderators to set a guild\'s language',
      aliases: ['setlang'],
      usage: [{
        name: 'lang',
        type: 'string',
        optional: false,
        choices: [
          'en'
        ]
      }],
      options: { guildOnly: true, localeKey: 'settings' }
    })
  }

  async handle ({ msg, args, data }, responder) {
    const lang = args.lang
    try {
      let guild = await data.Guild.fetch(msg.guild.id)
      guild.lang = lang
      await guild.save()
      return responder.success(lang, {
        lang: `**\`${lang}\`**`
      })
    } catch (err) {
      logger.error(`Could not change language for ${msg.guild.name} (${msg.guild.id}) - ${err}`)
      return responder.error()
    }
  }
}

module.exports = Lang
