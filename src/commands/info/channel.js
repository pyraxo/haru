const moment = require('moment-timezone')
const { Command } = require('../../core')

class ChannelInfo extends Command {
  constructor (...args) {
    super(...args, {
      name: 'channel',
      aliases: ['cinfo'],
      description: 'Displays information of a channel',
      usage: [{ name: 'member', type: 'channel', optional: true }],
      options: { guildOnly: true }
    })
  }

  async handle ({ msg, args, client, settings }, responder) {
    let channel = msg.channel
    if (args.channel) {
      const [, idx] = await responder.selection(args.channel.map(m => m.name))
      if (typeof idx !== 'number') return
      channel = args.channel[idx]
    }

    return responder.embed({
      color: this.colours.blue,
      author: { name: responder.t('{{title}}', { channel: '#' + channel.name }), icon_url: msg.guild.iconURL },
      fields: [
        { name: 'ID', value: channel.id, inline: true },
        { name: responder.t('{{type}}'), value: responder.t(channel.type === 0 ? '{{text}}' : '{{voice}}'), inline: true },
        {
          name: responder.t('{{createdOn}}'),
          value: moment(new Date(channel.createdAt)).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a')
        }
      ]
    }).send()
  }
}

module.exports = ChannelInfo
