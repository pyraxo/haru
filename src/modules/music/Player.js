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
    conn.play(url)

    conn.on('disconnect', err => {
      this.stop(channel, true)
      if (err) {
        logger.error(`Encountered an error while streaming to ${conn.id}`)
        logger.error(err)
      }
    })

    conn.on('error', err => {
      this.stop(channel).then(() => {
        this.stream(channel, url, volume)
        if (err) {
          logger.error(`Encountered an error while streaming to ${conn.id}`)
          logger.error(err)
        }
      })
    })

    this.manager.modifyState(channel.guild.id, 'state', url)
    return
  }

  async play (channel, mediaInfo, volume = 2) {
    let conn = this.manager.getConnection(channel)
    const textChannel = this.manager.getBoundChannel(channel.guild.id)

    if (!conn || !textChannel) return Promise.reject('notInChannel')
    await this.stop(channel)

    const options = mediaInfo.audioformat === 'webm'
    ? { format: 'webm', frameDuration: 20 }
    : { encoderArgs: ['-af', `volume=${volume}`] }

    conn.play(mediaInfo.audiourl, options)
    this.manager.modifyState(channel.guild.id, 'state', mediaInfo)

    conn.once('disconnect', err => {
      this.stop(channel, true)
      if (err) {
        logger.error(`Encountered an error while streaming to ${conn.id}`)
        logger.error(err)
      }
    })

    conn.once('error', err => {
      this.stop(channel).then(() => {
        if (err) {
          logger.error(`Encountered an error while streaming to ${conn.id}`)
          logger.error(err)
        }
        return this.play(channel, mediaInfo, volume)
      })
    })

    conn.once('end', () => {
      this.manager.modifyState(channel.guild.id, 'state', null)
      this.send(textChannel, `:stop:  |  {{finishedPlaying}} **${mediaInfo.title}** `)
      if (channel.voiceMembers.size === 1 && channel.voiceMembers.has(this.client.user.id)) {
        return this.stop(channel, true)
      }
      return this.manager.play(channel)
    })

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

    conn.removeAllListeners('end')
    await Promise.delay(5000)
    if (conn.playing) conn.stopPlaying()

    if (leave) {
      this.client.leaveVoiceChannel(channel.id)
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
    if (textChannel) this.send(textChannel, `:skip:  |  {{skipping}} **${this.manager.states.get(guildID).title}**`)
    return this.manager.play(channel, result)
  }
}

module.exports = Player
