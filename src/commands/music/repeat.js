const { Command } = require('sylphy')

class Repeat extends Command {
  constructor (...args) {
    super(...args, {
      name: 'repeat',
      description: 'Toggles repeat mode, where songs get repeated in the queue',
      cooldown: 5,
      options: { guildOnly: true, localeKey: 'music' },
      group: 'music'
    })
  }

  async handle ({ msg, settings, client, modules }, responder) {
    const cache = client.plugins.get('cache')
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

    try {
      const isRepeat = await music.queue.isRepeat(msg.channel.guild.id)
      await cache.client[isRepeat ? 'srem' : 'sadd']('music:repeats', msg.channel.guild.id)

      return responder.success(`{{repeat${isRepeat ? 'Off' : 'On'}}}`)
    } catch (err) {
      this.logger.error(`Error toggling repeat for ${msg.channel.guild.name} (${msg.channel.guild.id})`, err)
      return responder.error()
    }
  }
}

module.exports = Repeat
