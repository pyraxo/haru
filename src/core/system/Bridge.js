class Bridge {
  constructor (commander) {
    this.commander = commander
    this.tasks = []
    this.collectors = []
  }

  push (middleware) {
    if (!middleware.hasOwnProperty('process')) {
      throw new Error('Middleware must contain the process method')
    }
    if (typeof middleware.process !== 'function') {
      throw new Error('Middleware process must be a function')
    }
    this.tasks.push(middleware.process)
  }

  collect (options) {
    const { tries = 10, time = 60, matches = 10, channel, author, filter } = options
    let collector = {
      collected: [],
      _tries: 0,
      _matches: 0,
      _listening: false,
      _ended: false
    }
    collector.stop = () => {
      collector._listening = false
      this.collectors.splice(this.collectors.indexOf(collector), 1)
    }
    collector.next = () => {
      return new Promise((resolve, reject) => {
        collector._resolve = resolve
        if (time) {
          collector._timer = setTimeout(() => {
            reject({ reason: 'timeout', arg: time, collected: collector.collected })
          }, time * 1000)
        }
        if (collector._ended) {
          collector.stop()
          reject(collector._ended)
        }
        
        collector._listening = true
      })
    }
    collector.passMessage = msg => {
      if (!collector._listening) return false
      if (author && author !== msg.author.id) return false
      if (channel && channel !== msg.channel.id) return false
      if (typeof filter === 'function' && !filter(msg)) return false

      collector.collected.push(msg)
      if (collector.collected.size >= (matches || Infinity)) {
        collector._ended = { reason: 'maxMatches', arg: matches }
      } else if (tries && collector.collected.size === (tries || Infinity)) {
        collector._ended = { reason: 'max', arg: tries }
      }
      collector._resolve(msg)
      clearTimeout(collector._timer)
      return true
    }
    this.collectors.push(collector)
    return collector
  }

  destroy () {
    this.tasks = []
  }

  async handle (container) {
    const { msg } = container
    for (let collector of this.collectors) {
      const collected = collector.passMessage(msg)
      if (collected) return
    }
    for (const task of this.tasks) {
      try {
        const result = await task(container)
        if (!result) return Promise.reject()
        container = result
      } catch (err) {
        throw err
      }
    }
    try {
      if (!container.trigger) return Promise.reject()
      this.commander.execute(container.trigger, container)
    } catch (err) {
      throw err
    }
    return container
  }
}

module.exports = Bridge
