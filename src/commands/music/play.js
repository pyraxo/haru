const http = require('http')
const logger = require('winston')
const moment = require('moment')

const { Command } = require('../../core')

class Play extends Command {
  constructor (...args) {
    super(...args, {
      name: 'play',
      aliases: ['add'],
      description: 'Streams some music',
      cooldown: 5
    })
  }

  validate (videoID) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.youtube.com',
        port: 80,
        path: '/oembed?url=http://www.youtube.com/watch?v=' + escape(videoID) + '&format=json',
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json'
        }
      }

      const req = http.request(options, (res) => {
        if (res.statusCode === '404' || res.statusCode === '302') {
          reject('notFound')
        } else {
          resolve(videoID)
        }
        req.on('error', () => {
          reject('error')
        })
      })
      req.shouldKeepAlive = false
      req.end()
    })
  }

  async handle ({ msg, settings, rawArgs, client }, responder) {
    const music = this.bot.engine.modules.get('music')
    const searcher = this.bot.engine.modules.get('music:search')
    if (music.getBoundChannel(msg.guild.id) !== msg.channel.id) {
      return
    }

    const conn = music.getConnection(msg.channel)
    if (!conn) {
      return responder.error('{{errors.notInChannel}}', { tags: { command: `**\`${settings.prefix}summon\`**` } })
    }
    const voiceChannel = client.getChannel(conn.channelID)
    if (rawArgs.length === 0) {
      try {
        if (!(await music.queue.getLength(msg.guild.id))) {
          return responder.format('emoji:info').reply('{{errors.emptyQueue}}', { tags: { play: `**\`${settings.prefix}play\`**` } })
        }
        return music.play(voiceChannel)
      } catch (err) {
        logger.error(`Encountered erroring querying queue length for ${msg.guild.id}`)
        logger.error(err)
        responder.error('{{%ERROR}}')
      }
    }
    const text = rawArgs.join(' ')
    const matches = text.match(/^https:\/\/(www\.)?youtube\.com\/watch\?v=(\S{11})$/)
    if (matches) {
      const url = matches[0]
      try {
        const videoID = await this.validate(matches[2])
        const info = await music.add(msg.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${videoID}`)
        const length = info.length ? `(${moment.duration(info.length, 'seconds').format('h[h] m[m] s[s]')}) ` : ''
        return responder.format('emoji:success').send(`{{queued}} **${info.title}** ${length}- **${msg.author.mention}**`)
      } catch (err) {
        if (err instanceof Error) {
          logger.error(`Error adding ${url} to ${msg.guild.name} (${msg.guild.id})'s queue`)
          logger.error(err)
          return responder.error('{{%ERROR}}')
        }
        return responder.error(`{{errors.${err}}}`, { tags: { command: `**\`${settings.prefix}summon\`**` } })
      }
    }

    try {
      const result = await searcher.searchYT(msg, 'video', text, 10)
      if (!result) {
        return responder.error('{{noResults}}', { tags: { query: `**${text}**` } })
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
      return responder.error(`{{errors.${err}}}`, { tags: { command: `**\`${settings.prefix}summon\`**` } })
    }
  }
}

module.exports = Play
