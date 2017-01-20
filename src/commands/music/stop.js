const { Command } = require('../../core')

class Stop extends Command {
  constructor (...args) {
    super(...args, {
      name: 'stop',
      aliases: ['destroy'],
      description: 'Stops currently playing music',
      cooldown: 5,
      options: { guildOnly: true, localeKey: 'music' }
    })
  }

  async handle ({ msg, settings, client, modules }, responder) {
    const music = modules.get('music')
    if (!music) return
    const conn = music.getConnection(msg.channel)
    if (!conn) {
      return responder.error('{{errors.notInChannel}}', {
        command: `**\`${settings.prefix}summon\`**`
      })
    }
    if (msg.member.voiceState.channelID !== conn.channelID) {
      return responder.error('{{errors.notInSameVoice}}', {
        channel: `'**${client.getChannel(conn.channelID).name}**'`
      })
    }
    const chan = music.getBoundChannel(msg.channel.guild.id)
    if (chan && chan !== msg.channel.id) {
      return responder.error('{{errors.notChannel}}', {
        channel: client.getChannel(chan).mention,
        deleteDelay: 5000
      })
    }

    const voice = client.getChannel(conn.channelID)
    await music.player.stop(voice, true)
    responder.format('emoji:headphones').send('{{dc}}', {
      voice: `**${voice.name}**`,
      text: msg.channel.mention
    })
  }
}

module.exports = Stop
