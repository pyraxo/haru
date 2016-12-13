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

  remove (guildID, index = 0) {
    return this.redis.lrangeAsync(`music:queues:${guildID}`, index, index + 1)
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
}

module.exports = Queue
