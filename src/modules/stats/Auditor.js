const moment = require('moment-timezone')
const { Module, utils } = require('sylphy')

class Auditor extends Module {
  constructor (...args) {
    super(...args, {
      name: 'guilds:settings',
      events: {
        haruMemberBanned: 'onBan',
        haruMemberKicked: 'onKick',
        guildMemberUpdate: 'memberUpdate',
        guildMemberAdd: 'onJoin',
        guildMemberRemove: 'onLeave'
      }
    })
  }

  init () {
    this.db = this._client.plugins.get('db').data
  }

  unload () {
    delete this.db
  }

  onJoin (guild, user) {
    this.db.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!settings.events.hasOwnProperty('join')) return
      for (const id of settings.events['join']) {
        this.send(id, '', { embed: {
          color: utils.getColour('green'),
          description: `✨  **Member Joined**:  ${user.username}#${user.discriminator} (ID: ${user.id})`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    })
  }

  onLeave (guild, user) {
    this.db.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!settings.events.hasOwnProperty('leave')) return
      for (const id of settings.events['leave']) {
        this.send(id, '', { embed: {
          color: utils.getColour('blue'),
          description: `👋  **Member Left**:  ${user.username}#${user.discriminator} (ID: ${user.id})`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    })
  }

  onBan (guild, user, reason) {
    this.db.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!settings.events.hasOwnProperty('ban')) return
      for (const id of settings.events['ban']) {
        this.send(id, '', { embed: {
          color: utils.getColour('red'),
          description: `🔨  **Member Banned**:  ${user.username}#${user.discriminator} (ID: ${user.id})` +
          (reason ? `\n\n**Reason**: ${reason}` : ''),
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    })
  }

  onKick (guild, user, reason) {
    this.db.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!settings.events.hasOwnProperty('kick')) return
      for (const id of settings.events['kick']) {
        this.send(id, '', { embed: {
          color: utils.getColour('red'),
          description: `👢  **Member Kicked**:  ${user.username}#${user.discriminator} (ID: ${user.id})` +
          (reason ? `\n\n**Reason**: ${reason}` : ''),
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    })
  }

  memberUpdate (guild, member, oldMember) {
    this.db.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!(!member.nick && oldMember.nick === null) && member.nick !== oldMember.nick) {
        return this.onNickChange(member, oldMember, settings)
      }
      if (member.roles.length !== oldMember.roles.length) {
        return this.onRolesUpdate(member, oldMember, settings)
      }
    })
  }

  userUpdate (user, oldUser) {
    const guilds = this._client.guilds.find(g => g.members.has(user.id))
    Promise.all(guilds.map(g =>
      this.db.Guild.fetch(g.id).then(settings => {
        if (user.username !== oldUser.username) {
          return this.onNameChange(user, oldUser, settings)
        }
      })
    ))
  }

  onNameChange (user, oldUser, settings) {
    if (typeof settings.events !== 'object') return
    if (!settings.events['name']) return
    for (const id of settings.events['name']) {
      this.send(id, '', { embed: {
        color: utils.getColour('silver'),
        description: `👤  **${oldUser.username}** is now ${user.username}. (ID: ${user.id})`,
        footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
      }})
    }
  }

  onNickChange (member, oldMember, settings) {
    const user = member.user
    if (!settings.events['nick']) return
    for (const id of settings.events['nick']) {
      if (!member.nick) {
        this.send(id, '', { embed: {
          color: utils.getColour('silver'),
          description: `👤  **${oldMember.nick || member.username}** has removed their nickname. (ID: ${user.id})`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      } else {
        this.send(id, '', { embed: {
          color: utils.getColour('silver'),
          description: `👤  **${oldMember.nick || member.username}**'s nickname is now **${member.nick}**. (ID: ${user.id})`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    }
  }

  onRolesUpdate (member, oldMember, settings) {
    const user = member.user
    if (!settings.events['roles']) return
    for (const id of settings.events['roles']) {
      if (member.roles.length > oldMember.roles.length) {
        const role = member.guild.roles.get(member.roles.find(r => oldMember.roles.indexOf(r) < 0)).name
        this.send(id, '', { embed: {
          color: utils.getColour('orange'),
          description: `🔑  **Role Assigned**: __${role}__ to ${user.username}#${user.discriminator}`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      } else {
        const role = member.guild.roles.get(oldMember.roles.find(r => member.roles.indexOf(r) < 0)).name
        this.send(id, '', { embed: {
          color: utils.getColour('orange'),
          description: `🔑  **Role Removed**: __${role}__ to ${user.username}#${user.discriminator}`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    }
  }
}

module.exports = Auditor
