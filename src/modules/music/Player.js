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

  async stream (channel, url, volume = 2) {
    let conn = this.manager.getConnection(channel)
    await this.stop(channel)

    await Promise.delay(1000)

    this.manager.modifyState(channel.guild.id, 'skip', [])
    this.manager.modifyState(channel.guild.id, 'clear', [])
    conn.play(url)

    logger.info(`Playing ${url} in ${channel.guild.name} (${channel.guild.id})`)

    conn.on('error', err => {
      if (err) {
        this.stop(channel).then(() => {
          const textChannel = this.manager.getBoundChannel(channel.guild.id)
          this.send(textChannel, ':stop:  |  {{errors.error}}')
          this.stream(channel, url, volume)
          logger.error(`Encountered an error while playing stream to ${conn.id}`)
          logger.error(err)
        })
      }
    })

    conn.once('end', () => {
      const textChannel = this.manager.getBoundChannel(channel.guild.id)
      this.send(textChannel, `:stop:  |  {{finishedPlaying}} **${url}**`)
      this.stop(channel)
    })

    this.manager.modifyState(channel.guild.id, 'state', url)
    return
  }

  async play (channel, mediaInfo, volume = 2) {
    if (!channel || !channel.guild) {
      const err = new Error(`${!channel ? 'Channel' : 'Guild'} is undefined for some reason`)
      return Promise.reject(err)
    }
    let conn = this.manager.getConnection(channel)
    const textChannel = this.manager.getBoundChannel(channel.guild.id)

    if (!conn || !textChannel) return Promise.reject('notInChannel')
    await this.stop(channel)

    const options = mediaInfo.audioformat === 'webm'
    ? { format: 'webm', frameDuration: 20 }
    : { encoderArgs: ['-af', `volume=${volume}`] }

    await Promise.delay(2000)

    this.manager.modifyState(channel.guild.id, 'skip', [])
    this.manager.modifyState(channel.guild.id, 'clear', [])

    conn.once('error', err => {
      if (err) {
        this.stop(channel).then(() => {
          logger.error(`Encountered an error while streaming to ${conn.id}`)
          logger.error(err)
          return this.play(channel, mediaInfo, volume)
        })
      }
    })

    conn.once('end', () => {
      this.manager.modifyState(channel.guild.id, 'state', null)
      this.send(textChannel, `:stop:  |  {{finishedPlaying}} **${mediaInfo.title}** `)
      if (channel.voiceMembers.size === 1 && channel.voiceMembers.has(this.bot.user.id)) {
        return this.stop(channel, true)
      }

      return this.queue.isRepeat(channel.guild.id).then(res =>
        (res ? this.queue.add(channel.guild.id, mediaInfo) : Promise.resolve()).then(() =>
          this.manager.play(channel)
        )
      )
    })

    conn.play(mediaInfo.audiourl, options)
    this.manager.modifyState(channel.guild.id, 'state', mediaInfo)

    logger.info(`Playing ${mediaInfo.title} in ${channel.guild.name} (${channel.guild.id})`)

    return this.send(textChannel, [
      `:play:  |  {{nowPlaying}}: **${mediaInfo.title}** ` +
      (mediaInfo.length ? `(${moment.duration(mediaInfo.length, 'seconds').format('h[h] m[m] s[s]')})` : ''),
      `<${mediaInfo.url}>`
    ])
  }

  async stop (channel, leave = false) {
    let conn
    try {
      conn = await this.manager.getConnection(channel)
    } catch (err) {
      throw err
    }
    if (!conn) return

    conn.removeAllListeners('error')
    conn.removeAllListeners('end')
    await Promise.delay(2000)
    if (conn.playing) conn.stopPlaying()

    if (leave) {
      this.bot.leaveVoiceChannel(channel.id)
      this.manager.unbindChannel(channel.guild.id)
      this.manager.states.delete(channel.guild.id)
      await this.queue.clear(channel.guild.id)
    }
    return
  }

  async skip (guildID, channel) {
    await this.stop(channel)
    const length = await this.queue.getLength(channel.guild.id)
    const textChannel = this.manager.getBoundChannel(guildID)
    if (length === 0 && textChannel) {
      this.send(textChannel, ':info:  |  {{queueFinish}}')
      return
    }
    const result = await this.queue.shift(guildID)
    this.send(textChannel, `:skip:  |  {{skipping}} **${this.manager.getPlaying(guildID).title}**`)
    return this.manager.play(channel, result)
  }
}

module.exports = Player
