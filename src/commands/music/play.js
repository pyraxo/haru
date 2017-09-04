const moment = require('moment')

const { Command } = require('sylphy')

class Play extends Command {
  constructor (...args) {
    super(...args, {
      name: 'search',
      aliases: ['play'],
      description: 'Searches Youtube for music',
      usage: [{ name: 'action', displayName: 'youtube URL | query', optional: true }],
      cooldown: 10,
      options: { guildOnly: true, localeKey: 'music' },
      group: 'music'
    })
  }

  async handle ({ msg, settings, rawArgs, client, trigger, modules }, responder) {
    const music = modules.get('music')
    const searcher = modules.get('music:search')

    const conn = music.getConnection(msg.channel)
    if (!conn) {
      return responder.error('{{errors.notInChannel}}', { command: `**\`${settings.prefix}summon\`**` })
    }
    const chan = music.getBoundChannel(msg.channel.guild.id)
    if (chan && chan !== msg.channel.id) {
      return responder.error('{{errors.notChannel}}', {
        channel: client.getChannel(chan).mention,
        deleteDelay: 5000
      })
    }

    await responder.typing()

    const voiceChannel = client.getChannel(conn.channelID)
    if (rawArgs.length === 0) {
      if (conn.playing && typeof music.checkState(msg.channel.guild.id) !== 'string') {
        return responder.error('{{errors.alreadyPlaying}}', {
          command: `**\`${settings.prefix}play\`**`
        })
      }
      try {
        if (!await music.queue.getLength(msg.channel.guild.id)) {
          return responder.format('emoji:info').reply('{{errors.emptyQueue}}', { play: `**\`${settings.prefix}play\`**` })
        }
        return music.play(voiceChannel)
      } catch (err) {
        this.logger.error(`Encountered erroring querying queue length for ${msg.channel.guild.id} -`, err)
        responder.error('{{%ERROR}}')
      }
    }
    const text = rawArgs.join(' ')
    if (music.isLink(text)) {
      return music.checkLink(text, msg)
    }

    try {
      const result = await searcher.searchYT(msg, 'video', text, 10)
      if (!result || !result.items.length) {
        return responder.error('{{errors.noResults}}', { query: `**${text}**` })
      }

      const video = trigger === 'search'
      ? (await responder.selection(result.items, { mapFunc: i => i.snippet.title }))[0]
      : result.items[0]
      if (!video) return

      const info = await music.add(msg.channel.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${video.id.videoId}`)
      const length = info.length ? `(${moment.duration(info.length, 'seconds').format('h[h] m[m] s[s]')}) ` : ''
      return responder.format('emoji:success').send(`{{queued}} **${info.title}** ${length}- ${msg.author.mention}`)
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(`Error adding query ${text} to ${msg.channel.guild.name} (${msg.channel.guild.id})'s queue -`, err)
        return responder.error('{{%ERROR}}')
      }
      return responder.error(`{{errors.${err}}}`, { command: `**\`${settings.prefix}summon\`**` })
    }
  }
}

module.exports = Play
