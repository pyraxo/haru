const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const { Collection, utils } = require('sylphy')

class Station extends Collection {
  constructor (client) {
    super()

    this.pid = process.pid
    this._client = client
    this._cached = []

    process.on('message', this.onMessage.bind(this))
  }

  send (event, data) {
    process.send({
      op: event,
      d: data
    })
  }

  onMessage (message) {
    if (message.topic !== 'broadcast') return

    const command = this.get(message.data.op)
    if (command) {
      return command(message.data, this._client)
    }
  }

  awaitResponse (op, d = {}, dest = -1) {
    const code = crypto.randomBytes(64).toString('hex')
    let payload = { op, d, dest, code }
    const procCount = parseInt(process.env['CLIENT_PROCESSES'], 10)
    return new Promise((resolve, reject) => {
      let replies = new Collection()
      const awaitListener = (msg) => {
        const data = msg.data
        if (data.code !== code) return
        if (!['resp', 'error'].includes(data.op)) return

        if (data.op === 'error') return reject(data.d.error)
        replies.set(data.origin, data.d)

        for (let i = 0; i < procCount; i++) {
          if (!replies.has(i)) return
        }
        process.removeListener('message', awaitListener)
        return resolve(replies)
      }

      process.on('message', awaitListener)
      process.send(payload)

      setTimeout(() => {
        process.removeListener('message', awaitListener)
        return reject(new Error('IPC timed out after 5000ms'))
      }, 5000)
    })
  }

  register (commands) {
    switch (typeof commands) {
      case 'string': {
        const filepath = path.join(process.cwd(), commands)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        const cmds = utils.isDir(filepath) ? utils.requireAll(filepath) : require(filepath)
        this._cached.push(commands)
        return this.register(cmds)
      }
      case 'object': {
        if (Array.isArray(commands)) {
          for (const command of commands) {
            if (typeof command === 'object') {
              this.register(command)
              continue
            }
            this.attach(command)
          }
          return this
        }
        for (const group in commands) {
          const command = commands[group]
          if (typeof command === 'object') {
            this.register(command)
            continue
          }
          this.attach(command)
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  reload () {
    for (const filepath of this._cached) {
      this._client.unload(filepath)
      this._cached.shift()
      this.register(filepath)
    }
    return this
  }

  attach (command) {
    if (!command.name && (typeof command.command !== 'function' || typeof command !== 'function')) {
      this._client.throwOrEmit('ipc:error', new TypeError(`Invalid command - ${command}`))
      return
    }
    this.set(command.name, command.command || command)
    return this
  }

  unregister (name) {
    this.delete(name)
    return this
  }
}

module.exports = Station
