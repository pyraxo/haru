const moment = require('moment-timezone')
const { Command } = require('../../core')

class ChannelInfo extends Command {
  constructor (...args) {
    super(...args, {
      name: 'channel',
      aliases: ['cinfo'],
      description: 'Displays information of a channel',
      usage: [{ name: 'member', type: 'channel', optional: true }],
      options: { guildOnly: true, localeKey: 'infocmd', botPerms: ['embedLinks'] }
    })
  }

  async handle ({ msg, args, client, settings }, responder) {
    let channel = msg.channel
    if (args.channel) {
      channel = (await responder.selection(args.channel, { mapFunc: c => c.name }))[0]
      if (!channel) return
    }

    return responder.embed({
      color: this.colours.blue,
      author: { name: responder.t('{{channel.title}}', { channel: '#' + channel.name }), icon_url: msg.channel.guild.iconURL },
      fields: [
        { name: 'ID', value: channel.id, inline: true },
        { name: responder.t('{{channel.type}}'), value: responder.t(channel.type === 0 ? '{{channel.text}}' : '{{channel.voice}}'), inline: true },
        {
          name: responder.t('{{channel.createdOn}}'),
          value: moment(channel.createdAt).locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a')
        }
      ]
    }).send()
  }
}

module.exports = ChannelInfo
