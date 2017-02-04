const { Command } = require('../../core')

class Shuffle extends Command {
  constructor (...args) {
    super(...args, {
      name: 'shuffle',
      description: 'Shuffle the music queue',
      cooldown: 5,
      options: { guildOnly: true, localeKey: 'music' }
    })
  }

  shuffle (array) {
    let len = array.length
    while (len--) {
      let j = ~~(Math.random() * (len + 1))
      let temp = array[len]
      array[len] = array[j]
      array[j] = temp
    }
    return array
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
    const chan = music.getBoundChannel(msg.channel.guild.id)
    if (chan && chan !== msg.channel.id) {
      return responder.error('{{errors.notChannel}}', {
        channel: client.getChannel(chan).mention,
        deleteDelay: 5000
      })
    }
    const key = `music:queues:${msg.channel.guild.id}`
    const queue = (await cache.client.lrangeAsync(key, 0, -1) || [])
    if (!queue.length) {
      return responder.format('emoji:info').reply('{{errors.emptyQueue}}', { play: `**\`${settings.prefix}play\`**` })
    }
    const newQueue = this.shuffle(queue)
    await cache.client.delAsync(key)
    await cache.client.lpushAsync(key, newQueue)
    return responder.success('{{shuffled}}', { num: `**${newQueue.length}**` })
  }
}

module.exports = Shuffle
