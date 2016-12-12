const { Command } = require('../../core')

class Queue extends Command {
  constructor (...args) {
    super(...args, {
      name: 'queue',
      aliases: ['np', 'nowplaying', 'q'],
      description: 'Displays songs that are in queue',
      cooldown: 5,
      options: { guildOnly: true, localeKey: 'music' }
    })
  }

  async handle ({ msg, settings, client, cache, modules }, responder) {
    const music = modules.get('music')
    if (!music) return

    const conn = music.getConnection(msg.channel)
    const state = music.checkState(msg.guild.id)
    let rep = []
    if (state === null) {
      const queue = (await cache.client.lrangeAsync(`music:queues:${msg.guild.id}`, 0, 10) || [])
      if (queue.length) rep.push('**__{{queuedSongs}}__**\n')
      for (let i = 1; i <= queue.length; i++) {
        const entry = JSON.parse(queue[i - 1])
        rep.push(`\`${i}.\` ${entry.title}`)
      }
      return rep.length
      ? responder.send(rep)
      : responder.format('emoji:info').reply('{{errors.emptyQueue}}', { play: `**\`${settings.prefix}play\`**` })
    } else if (typeof state === 'object') {
      if (conn.playing) {
        const playtime = Math.round(conn.current.playTime / 1000)
        const length = state.length
        let bar = Array(10).fill('━')
        bar[Math.round(playtime / length * 10)] = '🔘'
        const ps = (playtime % 60 < 10 ? '0' : '') + playtime % 60
        const ls = (length % 60 < 10 ? '0' : '') + length % 60

        rep.push(
          `🎧  **${responder.t('{{nowPlaying}}')}**:`,
          `${state.title}\n`,
          `▶  ${bar.join('')}  ${Math.round(playtime / 60)}:${ps} / ${Math.round(length / 60)}:${ls}\n`
        )
      }
      const queue = (await cache.client.lrangeAsync(`music:queues:${msg.guild.id}`, 0, 10) || [])
      if (queue.length) rep.push('**__{{queuedSongs}}__**\n')
      for (let i = 1; i <= queue.length; i++) {
        const entry = JSON.parse(queue[i - 1])
        rep.push(`\`${i}.\` ${entry.title}`)
      }
      return rep.length
      ? responder.send(rep)
      : responder.format('emoji:info').reply('{{errors.emptyQueue}}', { play: `**\`${settings.prefix}play\`**` })
    } else if (typeof state === 'string') {
      const info = music.getPlaying(msg.guild.id)
      return responder.format('emoji:headphones').send('**{{nowPlaying}}**:\n{{streamInfo}}', {
        title: `"**${info.title}**"`,
        artist: info.artist,
        requestedBy: info.requestedBy
      })
    }
  }
}

module.exports = Queue
