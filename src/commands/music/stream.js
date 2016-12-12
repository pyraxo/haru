const { Command } = require('../../core')

class Stream extends Command {
  constructor (...args) {
    super(...args, {
      name: 'stream',
      description: 'Plays from a supported stream',
      cooldown: 5,
      usage: [{ name: 'station', type: 'string', optional: false, choices: ['listen.moe'] }],
      options: { guildOnly: true, localeKey: 'music' }
    })
  }

  async handle ({ msg, settings, client, args }, responder) {
    const music = this.bot.engine.modules.get('music')
    if (!music) return
    const conn = music.getConnection(msg.channel)
    if (!conn) {
      return responder.error('{{errors.notInChannel}}', {
        command: `**\`${settings.prefix}summon\`**`
      })
    }
    const chan = music.getBoundChannel(msg.guild.id)
    if (chan && chan !== msg.channel.id) {
      return responder.error('{{errors.notChannel}}', {
        channel: client.getChannel(chan).mention,
        deleteDelay: 5000
      })
    }

    await responder.typing()

    const voice = client.getChannel(conn.channelID)
    await music.player.stop(voice)

    const station = music.streams[args.station].url
    await music.player.stream(voice, station)
    return responder.format('emoji:headphones').send('{{switch}}', {
      station: '**' + args.station + '**'
    })
  }
}

module.exports = Stream
