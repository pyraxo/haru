const { Command } = require('../../core')

class Skip extends Command {
  constructor (...args) {
    super(...args, {
      name: 'skip',
      description: 'Skips the current music track',
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
    music.skip(msg)
  }
}

module.exports = Skip
