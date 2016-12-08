const logger = require('winston')
const moment = require('moment')

const { Command } = require('../../core')

class Play extends Command {
  constructor (...args) {
    super(...args, {
      name: 'play',
      aliases: ['add'],
      description: 'Streams some music',
      usage: [{ name: 'action', displayName: 'youtube URL | query', optional: true }],
      cooldown: 5,
      options: { guildOnly: true }
    })
  }

  async handle ({ msg, settings, rawArgs, client }, responder) {
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
    const matches = text.match(/^http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-_]*)(&(amp;)?[\w\?‌=]*)?$/)
    if (matches) {
      const url = matches[0]
      try {
        const videoID = await music.validate(matches[2])
        const info = await music.add(msg.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${videoID}`)
        const length = info.length ? `(${moment.duration(info.length, 'seconds').format('h[h] m[m] s[s]')}) ` : ''
        return responder.format('emoji:success').send(`{{queued}} **${info.title}** ${length}- **${msg.author.mention}**`)
      } catch (err) {
        if (err instanceof Error) {
          logger.error(`Error adding ${url} to ${msg.guild.name} (${msg.guild.id})'s queue`)
          logger.error(err)
          return responder.error('{{%ERROR}}')
        }
        return responder.error(`{{errors.${err}}}`, { command: `**\`${settings.prefix}summon\`**` })
      }
    }

    try {
      const result = await searcher.searchYT(msg, 'video', text, 10)
      if (!result || !result.items.length) {
        return responder.error('{{errors.noResults}}', { query: `**${text}**` })
      }
      const info = await music.add(msg.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${result.items[0].id.videoId}`)
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
