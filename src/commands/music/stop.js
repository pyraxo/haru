const { Command } = require('../../core')

class Stop extends Command {
  constructor (...args) {
    super(...args, {
      name: 'stop',
      aliases: ['destroy'],
      description: 'Stops currently playing music',
      cooldown: 5
    })
  }

  async handle ({ msg, settings, client }, responder) {
    const music = this.bot.engine.modules.get('music')
    if (!music) return
    if (music.getBoundChannel(msg.guild.id) !== msg.channel.id) {
      return
    }
    const conn = music.getConnection(msg.channel)
    if (!conn) {
      return responder.error(this.i18n.shift(this.i18n.get('play.errors.notInChannel', settings.lang), {
        command: `**\`${settings.prefix}summon\`**`
      }))
    }
    const voice = client.getChannel(conn.channelID)
    await music.player.stop(voice, true)
    responder.format('emoji:headphones').send('{{success}}', {
      tags: {
        voice: `**${voice.name}**`,
        text: msg.channel.mention
      }
    })
  }
}

module.exports = Stop
