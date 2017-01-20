const { Command } = require('../../core')

class Clear extends Command {
  constructor (...args) {
    super(...args, {
      name: 'clear',
      description: 'Clear the music queue',
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
    const chan = music.getBoundChannel(msg.channel.guild.id)
    if (chan && chan !== msg.channel.id) {
      return responder.error('{{errors.notChannel}}', {
        channel: client.getChannel(chan).mention,
        deleteDelay: 5000
      })
    }
    const voiceChannel = client.getChannel(conn.channelID)
    return music.clear(msg.channel.guild.id, voiceChannel, msg.author.id)
    .then(res => {
      if (typeof res === 'string') responder.success(`{{${res}}}`)
    })
  }
}

module.exports = Clear
