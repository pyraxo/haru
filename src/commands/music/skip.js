const { Command } = require('../../core')

class Skip extends Command {
  constructor (...args) {
    super(...args, {
      name: 'skip',
      description: 'Skips the current music track',
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
    const chan = music.getBoundChannel(msg.guild.id)
    if (chan && chan !== msg.channel.id) {
      return responder.error('{{errors.notChannel}}', {
        channel: client.getChannel(chan).mention,
        deleteDelay: 5000
      })
    }
    const voiceChannel = client.getChannel(conn.channelID)
    return music.skip(msg.guild.id, voiceChannel, msg.author.id)
    .then(res => {
      if (typeof res === 'string') return responder.success(`{{${res}}}`)
    })
  }
}

module.exports = Skip
