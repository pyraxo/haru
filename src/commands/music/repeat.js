const logger = require('winston')
const { Command } = require('../../core')

class Repeat extends Command {
  constructor (...args) {
    super(...args, {
      name: 'repeat',
      description: 'Toggles repeat mode, where songs get repeated in the queue',
      cooldown: 5,
      options: { guildOnly: true, localeKey: 'music' }
    })
  }

  async handle ({ msg, settings, client, modules, cache }, responder) {
    const music = modules.get('music')
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

    try {
      const isRepeat = await music.queue.isRepeat(msg.guild.id)
      await cache.client[isRepeat ? 'srem' : 'sadd']('music:repeats', msg.guild.id)

      return responder.success(`{{repeat${isRepeat ? 'Off' : 'On'}}}`)
    } catch (err) {
      logger.error(`Error toggling repeat for ${msg.guild.name} (${msg.guild.id})`)
      logger.error(err)
      return responder.error()
    }
  }
}

module.exports = Repeat
