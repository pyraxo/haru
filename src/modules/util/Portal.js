const logger = require('winston')

const { Module, Collection } = require('../../core')

class Portal extends Module {
  constructor (...args) {
    super(...args, {
      name: 'portal',
      events: {
        messageCreate: 'messageCreate'
      }
    })

    this.ipc = this.bot.engine.ipc
    this.data = this.bot.engine.db.data
    this.db = this.bot.engine.db.models
    this.listeners = new Map()
  }

  init () {
    this.listeners.set('messagePortal', this.receive.bind(this))

    this.ipc.removeAllListeners()
    for (const [event, listener] of this.listeners.entries()) {
      this.ipc.on(event, listener)
    }

    this.portals = new Collection()
  }

  unload () {
    this.ipc.removeAllListeners()
    delete this.ipc
    delete this.listeners
    delete this.portals
  }

  messageCreate (msg) {
    const portal = this.portals.get(msg.channel.id)
    if (!portal) return
    const wrapper = portal.messageWrapper
    return this.tunnel(portal.dest, typeof wrapper === 'function' ? wrapper(msg) : msg)
  }

  open (origin, dest, messageWrapper) {
    this.portals.set(origin, { dest, messageWrapper })
    this.portals.set(dest, { dest: origin, messageWrapper })
  }

  close (channel) {
    if (!this.portals.has(channel)) return
    const dest = this.portals.get(channel).dest
    this.portals.delete(channel)
    this.portals.delete(dest)
  }

  receive ({ channelID, content, options }) {
    const channel = this.client.getChannel(channelID)
    if (!channel) return
    return this.send(channel, content, options)
  }

  tunnel (channelID, content, options) {
    return this.ipc.send('broadcast', {
      op: 'messagePortal',
      d: { channelID, content, options }
    })
  }
}

module.exports = Portal
