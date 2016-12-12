const Emoji = require('node-emoji')
const { Module, Collection, Emojis } = require('../../core')

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

  addMulti (msg, emojis) {
    return new Promise((resolve, reject) => {
      (function loop (i) {
        msg.addReaction(emojis[i]).then(() => {
          i++
          if (i !== emojis.length) return loop(i)
          return resolve()
        }).catch(reject)
      })(0)
    })
  }

  addMenu (msg, userID, emojis = [], cleanup = true) {
    return new Promise((resolve, reject) => {
      emojis = emojis.filter(e => Emojis[e] || Emoji.get(e) || e.split(':').length === 2)
      this.addMulti(msg, emojis.map(e => Emojis[e] || Emoji.get(e)))
      .then(() => this.menus.set(msg.id, { msg, user: userID, emojis, resolve, cleanup }))
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
    this.client.getMessage(msg.channel.id, msg.id).then(message => {
      const emCheck = !menu.emojis.includes(emoji.id ? `${emoji.name}:${emoji.id}` : Emoji.which(emoji.name))
      if (emCheck || (userID !== menu.user && userID !== this.client.user.id)) {
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
