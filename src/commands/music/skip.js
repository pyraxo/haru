const { Command } = require('../../core')

class Skip extends Command {
  constructor (...args) {
    super(...args, {
      name: 'skip',
      description: 'Skips the current music track',
      cooldown: 5,
      options: { guildOnly: true, localeKey: 'play' }
    })
  }

  async handle ({ msg, settings, client }, responder) {
    const music = this.bot.engine.modules.get('music')
    if (!music) return
    if (music.getBoundChannel(msg.guild.id) !== msg.channel.id) {
      return
    }
    if (await music.queue.getLength(msg.guild.id) <= 1) {
      return responder.error('{{errors.emptyQueue}}', {
        play: `**\`${settings.prefix}play\`**`
      })
    }
    const conn = music.getConnection(msg.channel)
    if (!conn) {
      return responder.error('{{errors.notInChannel}}', {
        command: `**\`${settings.prefix}summon\`**`
      })
    }
    return music.skip(msg)
  }
}

module.exports = Skip
