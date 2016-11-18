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
    const manager = this.bot.engine.modules.get('music')
    if (!manager) return
    if (manager.getBoundChannel(msg.guild.id) !== msg.channel.id) {
      return
    }
    const conn = manager.getConnection(msg.channel)
    if (!conn) {
      return responder.error(this.i18n.shift(this.i18n.get('play.errors.notInChannel', settings.lang), {
        command: `**\`${settings.prefix}summon\`**`
      }))
    }
    manager.skip(msg)
  }
}

module.exports = Skip
