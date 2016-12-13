const logger = require('winston')
const crypto = require('crypto')
const https = require('https')
const moment = require('moment')
const url = require('url')
const querystring = require('querystring')
const ytdl = Promise.promisifyAll(require('ytdl-core'))
const WebSocket = require('ws')

const { Module, Collection } = require('../../core')

class Music extends Module {
  constructor (...args) {
    super(...args, {
      name: 'music',
      events: {
        voiceChannelLeave: 'voiceDC',
        messageCreate: 'onMessage'
      }
    })

    this.redis = this.bot.engine.cache.client

    this.streams = {
      'listen.moe': {
        socket: 'https://listen.moe/api/socket',
        url: 'http://listen.moe:9999/stream'
      }
    }
  }

  init () {
    this.player = this.bot.engine.modules.get('music:player')
    this.queue = this.bot.engine.modules.get('music:queue')

    this.states = new Collection()

    this._validator = setInterval(() => {
      for (const gid of this.states.keys()) {
        if (!this.client.guilds.has(gid)) {
          this.states.delete(gid)
        }
      }
    }, 120000)

    this.connectWS()
  }

  connectWS () {
    this._ws = {}
    this.streamInfo = {}
    for (const streamName in this.streams) {
      const stream = this.streams[streamName]
      let ws = this._ws[streamName] = new WebSocket(stream.socket)
      ws.on('message', data => {
        try {
          if (data) {
            const info = JSON.parse(data)
            this.streamInfo[stream.url] = (s => {
              switch (s) {
                case 'listen.moe': return {
                  title: info.song_name,
                  artist: info.artist_name,
                  requestedBy: info.requested_by
                }
                default: return
              }
            })(streamName)
          }
        } catch (err) {
          logger.error(`Error parsing ${stream.socket} message: ${err}`)
        }
      })
      ws.on('error', err => {
        if (err) {
          logger.error(`Error occurred with ${stream.socket}`)
          logger.error(err)
        }
      })
      ws.on('close', () => {
        logger.error(`Reopening closed ${stream.socket} socket`)
        setTimeout(this.connectWS.bind(this), 2500)
      })
    }
  }

  unload () {
    for (const [guildID, state] of this.states.entries()) {
      let conn = this.client.voiceConnections.get(guildID)
      if (!conn) continue
      conn.removeAllListeners()
      conn.stopPlaying()
      conn.disconnect()
      if (state.channel) {
        this.send(state.channel, ':info:  |  {{terminated}}')
      }
    }

    delete this.states
    clearInterval(this._validator)
    delete this._validator

    for (const ws in this._ws) {
      this._ws[ws].removeAllListeners()
    }
    delete this.streamInfo
    delete this._ws
  }

  bindChannel (guildID, textChannelID) {
    this.states.set(guildID, {
      channel: textChannelID,
      state: null,
      skip: [],
      clear: [],
      shuffle: [],
      volume: 2
    })
  }

  unbindChannel (guildID) {
    this.states.delete(guildID)
  }

  getState (guildID) {
    return this.states.get(guildID)
  }

  checkState (guildID) {
    let state = this.getState(guildID)
    return state ? state.state : null
  }

  modifyState (guildID, stateName, value) {
    let state = this.states.get(guildID)
    if (typeof state !== 'object') return
    state[stateName] = value
    this.states.set(guildID, state)
  }

  getBoundChannel (guildID) {
    const connection = this.states.get(guildID)
    return connection ? connection.channel : null
  }

  getConnection (channel) {
    if (!channel || !channel.guild) return null
    return this.client.voiceConnections.get(channel.guild.id) || null
  }

  getPlaying (guildID) {
    let state = this.checkState(guildID)
    return state
    ? typeof state === 'string'
    ? this.streamInfo[state] || null
    : state
    : null
  }

  async connect (voiceID, textChannel) {
    if (!voiceID || !textChannel || !textChannel.guild) {
      return Promise.reject('notInVoice')
    }
    const guild = textChannel.guild
    let channel = this.getBoundChannel(guild)
    if (channel && channel !== textChannel.id) {
      return Promise.reject('alreadyBinded')
    }
    this.bindChannel(guild.id, textChannel.id)
    if (!this.hasPermissions(textChannel, this.client.user, 'voiceConnect', 'voiceSpeak')) {
      return Promise.reject('noPerms')
    }
    try {
      return await this.client.joinVoiceChannel(voiceID)
    } catch (err) {
      logger.error(`Could not join voice channel ${voiceID} in ${guild.name} (${guild.id}) - ${err}`)
      return Promise.reject('error')
    }
  }

  getFormatUrl (type, formats) {
    const bestaudio = formats.sort((a, b) => b.audioBitrate - a.audioBitrate)
    .find(f => f.audioBitrate > 0 && !f.bitrate) || formats.find(f => f.audioBitrate > 0)

    if (!bestaudio.url) return
    bestaudio._format = type
    return bestaudio
  }

  getBestAudio (mediaInfo) {
    let formats = mediaInfo.formats.filter(f => [249, 250, 251].includes(parseInt(f.itag)))
    if (formats && formats.length) {
      return this.getFormatUrl('webm', formats)
    }
    formats = mediaInfo.formats.filter(f => [141, 140, 139].includes(parseInt(f.itag)))
    if (!formats || !formats.length) {
      formats = mediaInfo.formats.filter(f => f.container === 'mp4')
    }
    if (formats && formats.length) return this.getFormatUrl('mp4', formats)
  }

  async getInfo (url, fetchAll = false) {
    const key = `music:info:${crypto.createHash('sha256').update(url, 'utf8').digest('hex')}`
    let info = await this.redis.getAsync(key).catch(() => false)
    if (info) return JSON.parse(info)

    try {
      info = await ytdl.getInfoAsync(url)
    } catch (err) {
      return Promise.reject(err)
    }

    if (!info || !info.video_id) return Promise.reject('noVideoFound')
    info.url = `https://www.youtube.com/watch?v=${info.video_id}`

    const bestaudio = this.getBestAudio(info)
    if (bestaudio.url) {
      const match = new RegExp('&expire=([0-9]+)').exec(bestaudio.url)
      if (match && match.length) {
        info.expires = parseInt(match[1]) - 900
      }
    }
    const formattedInfo = {
      video_id: info.video_id,
      title: info.title,
      thumbnail_url: info.thumbnail_url,
      url: info.url,
      audiourl: bestaudio.url,
      audioformat: bestaudio._format,
      audiotype: bestaudio.itag,
      length: parseInt(info.length_seconds)
    }
    info = fetchAll ? info : formattedInfo
    this.redis.setex(key, 18000, JSON.stringify(formattedInfo))
    return info
  }

  async queueSong (guildId, voiceChannel, mediaInfo) {
    if (!this.getPlayingState(voiceChannel)) {
      if (mediaInfo.audiourl) {
        try {
          await this.player.play(voiceChannel, mediaInfo)
          return mediaInfo
        } catch (err) {
          return Promise.reject(err)
        }
      }
      try {
        await this.play(voiceChannel)
      } catch (err) {
        return Promise.reject(err)
      }
      return mediaInfo
    }
    await this.queue.add(guildId, mediaInfo)
    return mediaInfo
  }

  fetchPlaylist (pid) {
    return new Promise((resolve, reject) => {
      const req = https.get(
        'https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50' +
        `&playlistId=${pid}&key=${process.env.API_YT}`,
        res => {
          let rawData = ''
          res.on('data', chunk => {
            rawData += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(rawData)
            if (result.error) {
              return Promise.reject(result.error.code === 404 ? 'listNotFound' : 'error')
            }
            return resolve(result)
          })
        }
      )

      req.on('error', err => {
        logger.error('Error encountered while querying playlist')
        logger.error(err)
        return reject('error')
      })

      req.shouldKeepAlive = false
      req.end()
    })
  }

  getPlayingState (channel) {
    const conn = this.client.voiceConnections.get(channel.guild.id)
    if (!conn) return false
    return conn.playing
  }

  async add (guildId, voiceChannel, url) {
    if (typeof url === 'object') url = url.url
    if (typeof url !== 'string') return Promise.reject('invalidURL')
    url = url.replace('/<|>/g', '')
    let mediaInfo
    try {
      mediaInfo = await this.getInfo(url)
    } catch (err) {
      return Promise.reject(err)
    }
    if (mediaInfo && mediaInfo.length && mediaInfo.length > 5400) {
      return Promise.reject('tooLong')
    }
    return this.queueSong(guildId, voiceChannel, mediaInfo)
  }

  voiceDC (member, channel) {
    if (!channel.voiceMembers.has(this.client.user.id)) return
    if (channel.voiceMembers.size === 1 && channel.voiceMembers.has(this.client.user.id)) {
      const textChannel = this.getBoundChannel(channel.guild.id)
      if (textChannel) this.send(textChannel, ':headphones:  |  {{dcInactive}}')
      return this.player.stop(channel, true)
    }
  }

  async play (channel, mediaInfo) {
    if (channel.voiceMembers.size === 1 && channel.voiceMembers.has(this.client.user.id)) {
      return this.player.stop(channel, true)
    }
    const guildId = channel.guild.id
    const textChannel = this.getBoundChannel(guildId)

    if (!textChannel) return Promise.reject('notInChannel')
    const state = this.getState(guildId) || 2
    const volume = state ? state.volume : 2
    if (mediaInfo) {
      return this.player.play(channel, mediaInfo, volume)
    }

    if (!await this.queue.getLength(guildId)) {
      this.send(textChannel, ':info:  |  {{queueFinish}}')
      return this.player.stop(channel)
    }

    const item = await this.queue.shift(guildId)
    const url = mediaInfo ? mediaInfo.url || item.url : item.url

    try {
      mediaInfo = await this.getInfo(url)
    } catch (err) {
      return Promise.reject(err)
    }
    if (!mediaInfo) {
      return this.play(channel)
    }

    return this.player.play(channel, mediaInfo, volume)
  }

  setVolume (guild, volume) {
    this.modifyState(guild.id, 'volume', (parseInt(volume, 10) * 2) / 100)
  }

  async skip (guildId, voiceChannel, authorId, force = false) {
    if (!force && voiceChannel.voiceMembers.size > 2) {
      const state = this.getState(guildId)
      let vote = state.skip || []
      if (vote.includes(authorId)) {
        return Promise.resolve('alreadyVoted')
      }

      vote.push(authorId)

      if ((vote.length / voiceChannel.voiceMembers.filter(m => !m.voiceState.selfDeaf && !m.voiceState.deaf).length - 1) < 0.4) {
        this.modifyState(guildId, 'skip', vote)
        return Promise.resolve('voteSuccess')
      } else {
        this.modifyState(guildId, 'skip', [])
      }
    }

    return this.player.skip(guildId, voiceChannel)
  }

  async clear (guildId, voiceChannel, authorId, force = false) {
    if (!force && voiceChannel.voiceMembers.size > 2) {
      const state = this.getState(guildId)
      let vote = state.clear || []
      if (vote.includes(authorId)) {
        return Promise.resolve('alreadyVoted')
      }

      vote.push(authorId)

      if ((vote.length / voiceChannel.voiceMembers.filter(m => !m.voiceState.selfDeaf && !m.voiceState.deaf).length - 1) < 0.4) {
        this.modifyState(guildId, 'clear', vote)
        return Promise.resolve('voteSuccess')
      } else {
        this.modifyState(guildId, 'clear', [])
      }
    }

    const textChannel = this.getBoundChannel(guildId)
    try {
      await this.queue.clear(guildId)
      return this.send(textChannel, ':success:  |  {{clearQueue}}')
    } catch (err) {
      logger.error(`Could not clear queue for ${guildId}`)
      logger.error(err)

      return this.send(textChannel, ':error:  |  {{%ERROR_FULL}}')
    }
  }

  validate (videoID) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.youtube.com',
        path: '/oembed?url=http://www.youtube.com/watch?v=' + escape(videoID) + '&format=json',
        method: 'HEAD',
        headers: { 'Content-Type': 'application/json' }
      }

      const req = https.request(options, (res) => {
        if (res.statusCode === 404 || res.statusCode === 302 || res.statusMessage === 'Not Found') {
          reject('notFound')
        } else {
          resolve(videoID)
        }
      })
      req.on('error', () => {
        reject('error')
      })
      req.shouldKeepAlive = false
      req.end()
    })
  }

  async getPlaylist (pid) {
    const key = `music:playlist:${crypto.createHash('sha256').update(pid, 'utf8').digest('hex')}`
    let info = await this.redis.getAsync(key).catch(() => false)
    if (info) return JSON.parse(info)

    try {
      const playlist = await this.fetchPlaylist(pid)
      if (!playlist.items.length) return Promise.reject('emptyPlaylist')
      const playlistInfo = {
        id: playlist.etag.substring(1, playlist.etag.length - 1),
        results: playlist.pageInfo.totalResults,
        items: playlist.items.map(i => i.contentDetails.videoId)
      }
      this.redis.setex(key, 21600, JSON.stringify(playlistInfo))
      return playlistInfo
    } catch (err) {
      if (typeof err === 'string') {
        return Promise.reject(err)
      }
      logger.error('Error encountered while getting playlist')
      logger.error(err)
      return Promise.reject('error')
    }
  }

  onMessage (msg) {
    if (!msg.guild) return

    const text = this.getBoundChannel(msg.guild)
    if (!text || text !== msg.channel.id) return

    if (!this.getConnection(msg.channel)) return
    if (!this.isLink(msg.content)) return

    return this.checkLink(msg.content, msg)
  }

  isLink (text) {
    const yt = url.parse(text).host
    return yt && (yt.endsWith('youtube.com') || yt.endsWith('youtu.be'))
  }

  parseLink (text) {
    if (!this.isLink(text)) return false
    const query = querystring.parse(url.parse(text).query)
    return { v: query.v || null, pid: query.list || null }
  }

  queueMulti (items, msg, voiceChannel, prefix) {
    return new Promise((resolve, reject) => {
      let first
      const loop = (i = 0) => {
        const item = items[i++]
        if (i >= items.length) {
          return resolve(first)
        }
        return this.add(msg.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${item}`)
        .then(() => {
          if (!first) first = item
          return loop(i)
        })
        .catch(err => {
          this.send(
            msg.channel,
            `:error:  |  **${msg.author.username}**, ${
              err instanceof Error
              ? `{{errors.errorQueue}}\n\n${err.message}`
              : `{{errors.${err}}}`
            }`,
            {
              url: `<https://www.youtube.com/watch?v=${item}>`,
              command: `**\`${prefix}summon\`**`
            }
          )
          return loop(i)
        })
      }
      return loop()
    })
  }

  async checkLink (text, msg) {
    const conn = this.getConnection(msg.channel)
    const voiceChannel = this.client.getChannel(conn.channelID)
    const query = this.parseLink(text)
    const settings = await this.bot.engine.db.data.Guild.fetch(msg.guild.id)
    try {
      if (query.pid) {
        const m = await this.send(msg.channel, `:hourglass:  |  **${msg.author.username}**, {{queueProgress}}`)
        const playlist = await this.getPlaylist(query.pid)

        const firstVideo = await this.queueMulti(playlist.items, msg, voiceChannel, settings.prefix)
        if (!firstVideo) {
          return this.edit(m, `:error:  |  **${msg.author.username}**, {{errors.emptyPlaylist}}`)
        }

        await this.edit(m, `:success:  |  {{queuedMulti}} - **${msg.author.mention}**`, {
          num: playlist.results - 1
        })
        return this.deleteMessages(msg)
      } else if (query.v) {
        const videoID = await this.validate(query.v)
        const info = await this.add(msg.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${videoID}`)
        const length = info.length ? `(${moment.duration(info.length, 'seconds').format('h[h] m[m] s[s]')}) ` : ''

        await this.send(msg.channel, `:success:  |  {{queued}} **${info.title}** ${length}- **${msg.author.mention}**`)
        return this.deleteMessages(msg)
      }
    } catch (err) {
      if (err instanceof Error) {
        logger.error(`Error adding ${query.v ? 'song ' + query.v : 'playlist ' + query.pid} to ${msg.guild.name} (${msg.guild.id})'s queue`)
        logger.error(err)
        return this.send(msg.channel, ':error:  |  {{%ERROR}}')
      }
      return this.send(msg.channel, `:error:  |  **${msg.author.username}**, {{errors.${err}}}`, { command: `**\`${settings.prefix}summon\`**` })
    }
  }
}

module.exports = Music
