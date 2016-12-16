const logger = require('winston')
const { Module } = require('../../core')

class Queue extends Module {
  constructor (...args) {
    super(...args, {
      name: 'music:queue'
    })

    this.redis = this.bot.engine.cache.client
  }

  add (guildID, video, prepend = false) {
    if (typeof video === 'object') video = JSON.stringify(video)
    return this.redis[`${prepend ? 'lpush' : 'rpush'}Async`](`music:queues:${guildID}`, video)
  }

  async remove (guildID, index = 0, count = 1) {
    const info = await this.getSongs(guildID, index)
    const res = await this.redis.lremAsync(`music:queues:${guildID}`, count, info)
    if (res) return JSON.parse(info[0])
    return null
  }

  async shift (guildID) {
    return JSON.parse(await this.redis.lpopAsync(`music:queues:${guildID}`))
  }

  clear (guildID) {
    return this.redis.delAsync(`music:queues:${guildID}`)
  }

  getLength (guildID) {
    return this.redis.llenAsync(`music:queues:${guildID}`)
  }

  isRepeat (guildID) {
    return this.redis.sismemberAsync('music:repeats', guildID)
  }

  async getSongs (guildID, start = 0, stop = start) {
    return await this.redis.lrangeAsync(`music:queues:${guildID}`, start, stop)
  }
}

module.exports = Queue
