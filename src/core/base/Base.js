const logger = require('winston')

class Base {
  constructor (bot) {
    if (this.constructor === Base) {
      throw new Error('Must extend abstract Base')
    }

    this.bot = bot
    this.client = bot.client
    this.i18n = bot.engine.i18n

    this.colours = {
      blue: { hex: '#117ea6' },
      green: { hex: '#1f8b4c' },
      red: { hex: '#be2626' }
    }

    for (const colour in this.colours) {
      this.colours[colour].int = this.hexToInt(this.colours[colour].hex)
    }
  }

  getColour (colour) {
    return (this.colours[colour] || this.colours.blue).int
  }

  parseNumber (number) {
    if (typeof number === 'number') number = number.toString()
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  hasRoleHierarchy (guild, user, role) {
    if (!guild) return false

    const member = guild.members.get(user.id)
    if (!member) return false
    for (let r of member.roles) {
      r = guild.roles.get(r)
      if (r.id === role.id) continue
      if (r.position > role.position) return true
    }

    return false
  }

  hasPermissions (guild, user, ...perms) {
    const member = guild.members.get(user.id)
    for (const perm of perms) {
      if (!member.permission.has(perm)) return false
    }
    return true
  }

  async send (channel, content, options = {}) {
    if (typeof channel === 'string') channel = this.client.getChannel(channel)
    const { file = {}, lang = 'en', delay = 0, deleteDelay = 0, tags = {}, embed = {} } = options
    if (delay) {
      await Promise.delay(delay)
    }

    if (Array.isArray(content)) content = content.join('\n')
    content = this.i18n.parse(content, this.labels ? this.labels[0] : this.name.split(':')[0] || null, lang, tags)
    content = content.match(/(.|[\r\n]){1,2000}/g)

    try {
      if (!content || !content.length) {
        let msg = await channel.createMessage({ embed, content: '' }, file)
        if (deleteDelay) setTimeout(() => msg.delete(), deleteDelay)
        return msg
      }
      let replies = await Promise.mapSeries(content, (c, idx) => {
        return channel.createMessage(!idx ? { embed, content: c } : c, !idx ? file : null).then(msg => {
          if (deleteDelay) setTimeout(() => msg.delete(), deleteDelay)
          return msg
        })
      })
      return replies[0]
    } catch (err) {
      logger.error(`Error sending message to ${channel.name} (${channel.id}) - ${err}`)
    }
  }

  hexToInt (colour) {
    return parseInt(colour.replace('#', ''), 16)
  }
}

module.exports = Base
