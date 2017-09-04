const crypto = require('crypto')
const YouTube = require('youtube-node')
const yt = require('bluebird').promisifyAll(new YouTube())

const { Module } = require('sylphy')

class Search extends Module {
  constructor (...args) {
    super(...args, {
      name: 'music:search'
    })

    if (!process.env.API_YT) throw new Error('Missing Youtube API key')
    yt.setKey(process.env.API_YT)
  }

  init () {
    this.redis = this._client.plugins.get('cache').client
  }

  parseItems (result) {
    return result.items.map(item => {
      const type = (item.id ? item.id.kind || item.kind : item.kind).replace('youtube#', '')
      const id = (item.id && typeof item.id === 'object')
      ? item.id.videoId || item.id.playlistId
      : (item.contentDetails) ? item.contentDetails.videoId : null

      const url = type === 'video'
      ? `https://www.youtube.com/watch?v=${id}`
      : `https://www.youtube.com/playlist?list=${id}`
      const thumbnailUrl = item.snippet.thumbnails ? item.snippet.thumbnails.default.url : ''

      return {
        video_id: id,
        type,
        title: item.snippet.title,
        thumbnail_url: thumbnailUrl,
        url
      }
    })
  }

  async searchYT (msg, type = 'video', queryArg, limit = 10) {
    let query = queryArg.replace(/[^\w\s]/gi, '').toLowerCase()
    const queryKey = `music:search:${crypto.createHash('sha256').update(query, 'utf8').digest('hex')}`

    try {
      let result = await this.redis.getAsync(queryKey)

      if (result && result.length) {
        result = JSON.parse(result)
        return result
      }
    } catch (err) {
      this.logger.error('Could not query YT cache', err)
    }

    yt.addParam('type', type)
    try {
      const result = await yt.searchAsync(query, limit)
      if (!result || !result.items) return Promise.resolve()

      this.redis.setex(queryKey, 24 * 60 * 60, JSON.stringify(result))
      return result
    } catch (err) {
      return Promise.reject(err)
    }
  }

  async playlist (msg, id) {
    yt.addParam('maxResults', '50')
    try {
      const result = await yt.getPlayListsItemsByIdPromise(id)
      if (!result || !result.length) return Promise.resolve()
      return this.parseItems(result)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

module.exports = Search
