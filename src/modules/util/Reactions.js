const Emoji = require('node-emoji')
const { Module, Collection } = require('sylphy')

class Reactions extends Module {
  constructor (...args) {
    super(...args, {
      name: 'reactions',
      events: {
        messageReactionAdd: 'check',
        messageDelete: 'onDelete'
      }
    })
  }

  init () {
    this.menus = new Collection()
  }

  unload () {
    delete this.menus
  }

  async addMulti (msg, emojis) {
    try {
      for (const emoji of emojis) {
        await msg.addReaction(emoji)
      }
      return
    } catch (err) {
      throw err
    }
  }

  addMenu (msg, userID, list = [], { cleanup = true, timeout = 0 } = {}) {
    return new Promise((resolve, reject) => {
      let emojis = list.map(e => Emoji.get(e)[0] !== ':' ? Emoji.get(e) : e)
      this.addMulti(msg, emojis)
      .then(() => {
        this.menus.set(msg.id, { msg, user: userID, emojis, resolve, cleanup })
        if (timeout) setTimeout(() => this.menus.delete(msg.id), timeout)
      })
      .catch(reject)
    })
  }

  onDelete (msg) {
    if (this.menus.has(msg.id)) {
      this.menus.delete(msg.id)
    }
  }

  check (msg, emoji, userID) {
    const menu = this.menus.get(msg.id)
    if (!menu) return
    this._client.getMessage(msg.channel.id, msg.id).then(message => {
      const emCheck = !menu.emojis.includes(
        emoji.id ? `${emoji.name}:${emoji.id}` : Emoji.get(emoji.name)[0] !== ':'
        ? Emoji.get(emoji.name)
        : emoji.name
      )
      if (emCheck || (userID !== menu.user && userID !== this._client.user.id)) {
        return message.removeReaction(emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, userID)
      }
      if (userID === menu.user) {
        menu.resolve(emoji.id ? `${emoji.name}:${emoji.id}` : Emoji.which(emoji.name))
        this.menus.delete(msg.id)
        if (menu.cleanup) this.deleteMessages(message)
      }
    })
  }
}

module.exports = Reactions
