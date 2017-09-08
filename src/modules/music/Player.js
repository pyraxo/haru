const moment = require('moment')
const fs = require('fs')

const { Module } = require('sylphy')

class Player extends Module {
  constructor (...args) {
    super(...args, {
      name: 'music:player'
    })
  }

  init () {
    this.redis = this._client.plugins.get('cache').client
    const m = this._client.plugins.get('modules')
    this.manager = m.get('music')
    this.queue = m.get('music:queue')
  }

  async stream (channel, url, volume = 2) {
    let conn = this.manager.getConnection(channel)
    await this.stop(channel)

    await Promise.delay(1000)

    this.manager.modifyState(channel.guild.id, 'skip', [])
    this.manager.modifyState(channel.guild.id, 'clear', [])
    conn.play(url)

    this.logger.info(`Playing ${url} in ${channel.guild.name} (${channel.guild.id})`)

    conn.on('error', err => {
      if (err) {
        this.stop(channel).then(() => {
          const textChannel = this.manager.getBoundChannel(channel.guild.id)
          this.send(textChannel, ':stop_button:  |  {{errors.error}}')
          this.stream(channel, url, volume)
          this.logger.error(`Encountered an error while playing stream to ${conn.id} -`, err)
        })
      }
    })

    conn.once('end', () => {
      const textChannel = this.manager.getBoundChannel(channel.guild.id)
      this.send(textChannel, `:stop_button:  |  {{finishedPlaying}} **${url}**`)
      this.stop(channel)
    })

    this.manager.modifyState(channel.guild.id, 'state', url)
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
        this.stop(channel, true).then(() => {
          this.logger.error(`Encountered an error while streaming to ${conn.id} -`, err)
          // return this.play(channel, mediaInfo, volume)
          return this.send(textChannel, '{{errors.connError}}', { err: `**${err.message || 'Stream error'}**` })
        })
      }
    })

    conn.once('end', () => {
      this.manager.modifyState(channel.guild.id, 'state', null)
      this.send(textChannel, `:stop_button:  |  {{finishedPlaying}} **${mediaInfo.title}** `)
      if (channel.voiceMembers.size === 1 && channel.voiceMembers.has(this._client.user.id)) {
        return this.stop(channel, true)
      }

      const localPath = `music:downloads:${mediaInfo.audiourl}`
      this.redis.getAsync(localPath).then(res => res >= 10 && this.redis.delAsync(localPath).then(() => fs.unlink(localPath)))

      return this.queue.isRepeat(channel.guild.id).then(res =>
        (res ? this.queue.add(channel.guild.id, mediaInfo) : Promise.resolve()).then(() =>
          this.manager.play(channel)
        )
      )
    })

    let tries = 0
    while (!conn.ready && ++tries < 5) {
      await Promise.delay(1000)
    }
    if (!conn.ready) {
      this.logger.info(`Voice connection not ready after 5 tries - ${channel.guild.name} (${channel.guild.id})`)
      await this.stop(channel, true)
      return this.send(textChannel, '{{errors.notReadyYet}}')
    }
    const filepath = this.manager.getFile(mediaInfo.audioformat, mediaInfo.url)
    conn.play(filepath || mediaInfo.audiourl, options)
    this.manager.modifyState(channel.guild.id, 'state', mediaInfo)

    this.logger.info(`Playing ${mediaInfo.title} in ${channel.guild.name} (${channel.guild.id})`)

    return this.send(textChannel, [
      `:arrow_forward:  |  {{nowPlaying}}: **${mediaInfo.title}** ` +
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
      this._client.leaveVoiceChannel(channel.id)
      this.manager.unbindChannel(channel.guild.id)
      this.manager.states.delete(channel.guild.id)
      await this.queue.clear(channel.guild.id)
    }
  }

  async skip (guildID, channel) {
    await this.stop(channel)
    const length = await this.queue.getLength(channel.guild.id)
    const textChannel = this.manager.getBoundChannel(guildID)
    if (length === 0 && textChannel) {
      this.send(textChannel, ':information_source:  |  {{queueFinish}}')
      return
    }
    const result = await this.queue.shift(guildID)
    this.send(textChannel, `:fast_forward:  |  {{skipping}} **${this.manager.getPlaying(guildID).title}**`)
    return this.manager.play(channel, result)
  }
}

module.exports = Player
