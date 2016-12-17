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

  addMenu (msg, userID, list = [], cleanup = true) {
    return new Promise((resolve, reject) => {
      let emojis = list.filter(e => Emojis[e] || Emoji.get(e) || e.split(':').length === 2)
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
    this.bot.getMessage(msg.channel.id, msg.id).then(message => {
      const emCheck = !menu.emojis.includes(emoji.id ? `${emoji.name}:${emoji.id}` : Emoji.which(emoji.name))
      if (emCheck || (userID !== menu.user && userID !== this.bot.user.id)) {
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
