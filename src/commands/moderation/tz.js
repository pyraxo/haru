const moment = require('moment-timezone')
const { Command } = require('sylphy')

class Timezone extends Command {
  constructor (...args) {
    super(...args, {
      name: 'timezone',
      description: 'Allows moderators to set a guild\'s timezone',
      aliases: ['tz'],
      usage: [{ name: 'tz', type: 'string', optional: true }],
      options: { guildOnly: true, localeKey: 'settings', modOnly: true },
      group: 'moderation'
    })
  }

  async handle ({ msg, args, settings }, responder) {
    if (!args.tz) {
      return responder.format('emoji:info').reply('{{tz.current}}', { tz: `**${settings.tz}**` })
    }
    if (moment.tz.names().indexOf(args.tz) < 0) {
      return responder.error('{{tz.notFound}}', {
        tz: `**\`${args.tz}\`**`,
        link: '**<https://awau.moe/haru-timezones>**'
      })
    }
    try {
      settings.tz = args.tz
      await settings.save()
      return responder.success('{{tz.success}}', {
        tz: `**\`${args.tz}\`**`
      })
    } catch (err) {
      this.logger.error(`Could not change timezone to '${args.tz}' for ${msg.channel.guild.name} (${msg.channel.guild.id})`, err)
      return responder.error()
    }
  }
}

module.exports = Timezone
