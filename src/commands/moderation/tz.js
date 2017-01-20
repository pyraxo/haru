const logger = require('winston')
const moment = require('moment-timezone')
const { Command } = require('../../core')

class Timezone extends Command {
  constructor (...args) {
    super(...args, {
      name: 'timezone',
      description: 'Allows moderators to set a guild\'s timezone',
      aliases: ['tz'],
      usage: [{ name: 'tz', type: 'string', optional: true }],
      options: { guildOnly: true, localeKey: 'settings', permissions: ['manageGuild'] }
    })
  }

  async handle ({ msg, args, data, settings }, responder) {
    if (!args.tz) {
      return responder.format('emoji:info').reply('{{tz.current}}', { tz: `**${settings.tz}**` })
    }
    if (moment.tz.names().indexOf(args.tz) < 0) {
      return responder.error('{{tz.notFound}}', {
        tz: `**\`${args.tz}\`**`,
        link: '**<http://frid.li/timezones>**'
      })
    }
    try {
      settings.tz = args.tz
      await settings.save()
      return responder.success('{{tz.success}}', {
        tz: `**\`${args.tz}\`**`
      })
    } catch (err) {
      logger.error(`Could not change timezone to '${args.tz}' for ${msg.channel.guild.name} (${msg.channel.guild.id}) - ${err}`)
      return responder.error()
    }
  }
}

module.exports = Timezone
