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

  async handle ({ msg, settings, client }, responder) {
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
    const voiceChannel = client.getChannel(conn.channelID)
    return music.skip(msg.guild.id, voiceChannel, msg.author.id)
    .then(res => {
      if (typeof res === 'string') responder.success(`{{${res}}}`)
    })
  }
}

module.exports = Skip
