const { Command } = require('../../core')

class Queue extends Command {
  constructor (...args) {
    super(...args, {
      name: 'queue',
      aliases: ['np', 'nowplaying', 'q'],
      description: 'Displays songs that are in queue',
      cooldown: 5,
      options: { guildOnly: true }
    })
  }

  async handle ({ msg, settings, client, cache }, responder) {
    const music = this.bot.engine.modules.get('music')
    if (!music) return

    const conn = music.getConnection(msg.channel)
    const state = music.states.get(msg.guild.id)
    let rep = []
    if (typeof state === 'object') {
      if (conn.playing) {
        const playtime = Math.round(conn.current.playTime / 1000)
        const length = state.length
        let bar = Array(10).fill('━')
        bar[Math.round(playtime / length * 10)] = '🔘'
        const ps = (playtime % 60 < 10 ? '0' : '') + playtime % 60
        const ls = (length % 60 < 10 ? '0' : '') + length % 60

        rep.push(
          `🎧  **${responder.t('{{nowplaying}}')}**:`,
          `${state.title}\n`,
          `▶  ${bar.join('')}  ${Math.round(playtime / 60)}:${ps} / ${Math.round(length / 60)}:${ls}\n`
        )
      }
      const queue = (await cache.client.lrangeAsync(`music:queues:${msg.guild.id}`, 0, 10) || [])
      if (queue.length) rep.push('**__{{queued}}__**\n')
      for (let i = 1; i <= queue.length; i++) {
        const entry = JSON.parse(queue[i - 1])
        rep.push(`\`${i}.\` ${entry.title}`)
      }
      return responder.send(rep)
    } else if (typeof state === 'string') {
      return responder.format('emoji:headphones').send(`**${responder.t('{{nowplaying}}')}**: <${state}>`)
    } else {
      const queue = (await cache.client.lrangeAsync(`music:queues:${msg.guild.id}`, 0, 10) || [])
      if (queue.length) rep.push('**__{{queued}}__**\n')
      for (let i = 1; i <= queue.length; i++) {
        const entry = JSON.parse(queue[i - 1])
        rep.push(`\`${i}.\` ${entry.title}`)
      }
      return responder.send(rep)
    }
  }
}

module.exports = Queue
