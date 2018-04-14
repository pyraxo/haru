const { Module, Collection } = require('sylphy')

class Portal extends Module {
  constructor (...args) {
    super(...args, {
      name: 'portal',
      events: {
        messageCreate: 'messageCreate'
      }
    })
    this.portals = new Collection()
  }

  init () {
    const plugins = this._client.plugins
    this.ipc = plugins.get('ipc')
    this.data = plugins.get('db').data
    this.db = plugins.get('db').models

    this.ipc.attach({
      name: 'messagePortal',
      command: this.receive.bind(this)
    })
  }

  unload () {
    this.ipc.unregister('messagePortal')
    delete this.listeners
    delete this.portals
  }

  messageCreate (msg) {
    if (msg.author.bot) return
    const portal = this.portals.get(msg.channel.id)
    if (!portal) return
    const wrapper = portal.messageWrapper
    return this.tunnel(portal.dest, typeof wrapper === 'function' ? wrapper(msg) : msg.content)
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

  receive (data) {
    const { channelID, content, options } = data.d
    const channel = this._client.getChannel(channelID)
    if (!channel) return
    return this.send(channel, content, options)
  }

  tunnel (channelID, content, options) {
    return process.send({
      op: 'messagePortal',
      d: { channelID, content, options },
      dest: -1
    })
  }
}

module.exports = Portal
