const logger = require('winston')
const moment = require('moment')

const { Command } = require('../../core')

class Play extends Command {
  constructor (...args) {
    super(...args, {
      name: 'search',
      aliases: ['play'],
      description: 'Searches Youtube for music',
      usage: [{ name: 'action', displayName: 'youtube URL | query', optional: true }],
      cooldown: 10,
      options: { guildOnly: true, localeKey: 'music' }
    })
  }

  async handle ({ msg, settings, rawArgs, client, trigger }, responder) {
    const music = this.bot.engine.modules.get('music')
    const searcher = this.bot.engine.modules.get('music:search')

    const conn = music.getConnection(msg.channel)
    if (!conn) {
      return responder.error('{{errors.notInChannel}}', { command: `**\`${settings.prefix}summon\`**` })
    }
    const chan = music.getBoundChannel(msg.guild.id)
    if (chan && chan !== msg.channel.id) {
      return responder.error('{{errors.notChannel}}', {
        channel: client.getChannel(chan).mention,
        deleteDelay: 5000
      })
    }

    const voiceChannel = client.getChannel(conn.channelID)
    if (rawArgs.length === 0) {
      if (conn.playing && typeof music.states.get(msg.guild.id) !== 'string') {
        return responder.error('{{errors.alreadyPlaying}}', {
          command: `**\`${settings.prefix}play\`**`
        })
      }
      try {
        if (!await music.queue.getLength(msg.guild.id)) {
          return responder.format('emoji:info').reply('{{errors.emptyQueue}}', { play: `**\`${settings.prefix}play\`**` })
        }
        return music.play(voiceChannel)
      } catch (err) {
        logger.error(`Encountered erroring querying queue length for ${msg.guild.id}`)
        logger.error(err)
        responder.error('{{%ERROR}}')
      }
    }
    const text = rawArgs.join(' ')
    if (music.isLink(msg.content)) {
      return music.checkLink(msg)
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

      const info = await music.add(msg.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${video.id.videoId}`)
      const length = info.length ? `(${moment.duration(info.length, 'seconds').format('h[h] m[m] s[s]')}) ` : ''
      return responder.format('emoji:success').send(`{{queued}} **${info.title}** ${length}- ${msg.author.mention}`)
    } catch (err) {
      if (err instanceof Error) {
        logger.error(`Error adding query ${text} to ${msg.guild.name} (${msg.guild.id})'s queue`)
        logger.error(err)
        return responder.error('{{%ERROR}}')
      }
      return responder.error(`{{errors.${err}}}`, { command: `**\`${settings.prefix}summon\`**` })
    }
  }
}

module.exports = Play
