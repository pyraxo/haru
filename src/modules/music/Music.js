const logger = require('winston')
const crypto = require('crypto')
const https = require('https')
const moment = require('moment')
const url = require('url')
const querystring = require('querystring')
const ytdl = Promise.promisifyAll(require('ytdl-core'))

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

    this.states = new Collection()
    this.connections = new Collection()
    this.volume = new Map()
    this.redis = this.bot.engine.cache.client
  }

  init () {
    this.player = this.bot.engine.modules.get('music:player')
    this.queue = this.bot.engine.modules.get('music:queue')

    this._validator = setInterval(() => {
      for (const gid of this.connections.keys()) {
        if (!this.client.guilds.has(gid)) {
          this.connections.delete(gid)
        }
      }

      for (const gid of this.states.keys()) {
        if (!this.client.guilds.has(gid)) {
          this.states.delete(gid)
        }
      }
    }, 120000)
  }

  bindChannel (guildID, textChannelID) {
    this.connections.set(guildID, textChannelID)
  }

  unbindChannel (guildID) {
    this.connections.delete(guildID)
  }

  getBoundChannel (guildID) {
    return this.connections.get(guildID) || null
  }

  getConnection (channel) {
    if (!channel || !channel.guild) return null
    if (this.client.voiceConnections) {
      return this.client.voiceConnections.get(channel.guild.id) || null
    }
    return null
  }

  async connect (voiceID, textChannel) {
    if (!voiceID || !textChannel || !textChannel.guild) {
      return Promise.reject('notChannel')
    }
    const guild = textChannel.guild
    let channel = this.connections.get(guild.id)
    if (channel && channel !== textChannel.id) {
      return Promise.reject('alreadyBinded')
    }
    this.bindChannel(guild.id, textChannel.id)
    if (!this.hasPermissions(guild, this.client.user, 'voiceConnect', 'voiceSpeak')) {
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
      expires: info.expires ? Date.now() - info.expires - 300 : null,
      length: parseInt(info.length_seconds)
    }
    info = fetchAll ? info : formattedInfo
    this.redis.setex(key, formattedInfo.expires || 21600, JSON.stringify(formattedInfo))
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
      this.send(textChannel, ':headphones:  |  {{dcInactive}}')
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
    const volume = this.volume.get(guildId) || 2
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
    this.volume.set(guild.id, (parseInt(volume, 10) * 2) / 100)
  }

  async skip (guildId, voiceChannel, authorId, force = false) {
    if (!force && voiceChannel.voiceMembers.size > 2) {
      let vote = this.votes.get(guildId) || []
      if (vote.includes(authorId)) {
        return Promise.resolve('alreadyVoted')
      }

      vote.push(authorId)

      if ((vote.length / voiceChannel.voiceMembers.filter(m => !m.voiceState.selfDeaf && !m.voiceState.deaf).length - 1) < 0.5) {
        this.votes.set(guildId, vote)
        return Promise.resolve('voteSuccess')
      } else {
        this.votes.delete(guildId)
      }
    }

    return this.player.skip(guildId, voiceChannel)
  }

  validate (videoID) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.youtube.com',
        port: 443,
        path: '/oembed?url=http://www.youtube.com/watch?v=' + escape(videoID) + '&format=json',
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json'
        }
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

    const text = this.connections.get(msg.guild.id)
    if (!text || text !== msg.channel.id) return

    if (!this.getConnection(msg.channel)) return
    if (!this.isLink(msg.content)) return

    return this.checkLink(msg)
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

  async checkLink (msg) {
    const conn = this.getConnection(msg.channel)
    const voiceChannel = this.client.getChannel(conn.channelID)
    const query = this.parseLink(msg.content)
    try {
      if (query.pid) {
        const playlist = await this.getPlaylist(query.pid)
        const firstVideo = playlist.items.shift()
        const info = await this.add(msg.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${firstVideo}`)
        const length = info.length ? `(${moment.duration(info.length, 'seconds').format('h[h] m[m] s[s]')}) ` : ''

        playlist.items.forEach(async i => {
          console.log(i)
          try {
            await this.add(msg.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${i}`)
          } catch (err) {
            await this.send(msg.channel, ':error:  |  {{errors.error}}')
          }
        })

        await this.send(msg.channel, `:success:  |  {{queuedMulti}} - **${msg.author.mention}**`, {
          song: `**${info.title}** ${length}`,
          num: playlist.results - 1
        })
        return this.deleteMessages([msg])
      } else if (query.v) {
        const videoID = await this.validate(query.v)
        const info = await this.add(msg.guild.id, voiceChannel, `https://www.youtube.com/watch?v=${videoID}`)
        const length = info.length ? `(${moment.duration(info.length, 'seconds').format('h[h] m[m] s[s]')}) ` : ''

        await this.send(msg.channel, `:success:  |  {{queued}} **${info.title}** ${length}- **${msg.author.mention}**`)
        return this.deleteMessages([msg])
      }
    } catch (err) {
      if (err instanceof Error) {
        logger.error(`Error adding ${query.v ? 'song ' + query.v : 'playlist ' + query.list} to ${msg.guild.name} (${msg.guild.id})'s queue`)
        logger.error(err)
        return this.send(':error:  |  {{%ERROR}}')
      }
      const settings = await this.bot.engine.db.data.Guild.fetch(msg.guild.id)
      return this.send(msg.channel, `:error:  |  **${msg.author.username}**, {{errors.${err}}}`, { command: `**\`${settings.prefix}summon\`**` })
    }
  }
}

module.exports = Music
