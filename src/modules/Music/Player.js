const logger = require('winston')
const moment = require('moment')

const { Module } = require('../../core')

class Player extends Module {
  constructor (...args) {
    super(...args, {
      name: 'music:player'
    })
  }

  init () {
    this.manager = this.bot.engine.modules.get('music')
    this.queue = this.bot.engine.modules.get('music:queue')
  }

  async play (channel, mediaInfo, volume = 2) {
    let conn = this.manager.getConnection(channel)
    const textChannel = this.manager.getBoundChannel(channel.guild.id)

    if (!conn || !textChannel) return Promise.reject('notInChannel')
    if (conn.playing) {
      conn.stopPlaying()
    }

    const options = mediaInfo.audioformat === 'webm'
    ? { format: 'webm', frameDuration: 20 }
    : { encoderArgs: ['-af', `volume=${volume}`] }

    conn.play(mediaInfo.audiourl, options)

    conn.on('disconnect', err => {
      this.stop(conn, true)
      if (err) {
        logger.error(`Encountered an error while streaming to ${conn.id}`)
        logger.error(err)
      }
    })

    conn.on('error', err => {
      this.stop(conn).then(() => {
        this.play(conn)
        if (err) {
          logger.error(`Encountered an error while streaming to ${conn.id}`)
          logger.error(err)
        }
      })
    })

    conn.once('end', async () => {
      this.send(textChannel, `⏹  |  {{finishedPlaying}} **${mediaInfo.title}** `)
      if (channel.voiceMembers.size === 1 && channel.voiceMembers.has(this.client.user.id)) {
        return this.stop(channel, true)
      }
      if (!(await this.queue.getLength(channel.guild.id)) || !(await this.queue.shift(channel.guild.id))) {
        this.send(textChannel, 'ℹ  |  {{queueFinish}}')
        return this.stop(channel)
      }
      return this.manager.play(channel)
    })

    return this.send(textChannel, [
      `▶  |  {{nowPlaying}}: **${mediaInfo.title}** ` +
      (mediaInfo.length ? `(${moment.duration(mediaInfo.length, 'seconds').format('h[h] m[m] s[s]')})` : ''),
      `<${mediaInfo.url}>`
    ])
  }

  async stop (channel, leave = false) {
    let conn
    try {
      conn = await this.manager.getConnection(channel)
    } catch (err) {
      return Promise.reject(err)
    }
    if (!conn) return

    conn.removeAllListeners('end')
    if (conn.playing) conn.stopPlaying()

    if (leave) {
      this.client.leaveVoiceChannel(channel.id)
      this.manager.unbindChannel(channel.guild.id)
    }
    return
  }

  async skip (guildID, channel) {
    await this.stop(channel)
    let result = await this.queue.shift(guildID)
    const textChannel = this.manager.getBoundChannel(guildID)
    if (!textChannel) return
    this.send(textChannel, `⏩  |  {{skipping}} **${result.title}**`)

    const length = await this.queue.getLength(channel.guild.id)
    if (!length) {
      this.send(textChannel, 'ℹ  |  {{queueFinish}}')
      return
    }
    return this.manager.play(channel)
  }
}

module.exports = Player
