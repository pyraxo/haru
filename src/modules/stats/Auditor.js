const moment = require('moment-timezone')
const { Module } = require('../../core')

class Auditor extends Module {
  constructor (...args) {
    super(...args, {
      name: 'guilds:settings',
      events: {
        guildBanAdd: 'onBan',
        guildMemberUpdate: 'memberUpdate',
        guildMemberAdd: 'onJoin',
        guildMemberRemove: 'onLeave'
      }
    })
  }

  init () {
    this.data = this.bot.engine.db.data
  }

  onJoin (guild, user) {
    this.data.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!settings.events.hasOwnProperty('join')) return
      for (const id of settings.events['join']) {
        this.send(id, '', { embed: {
          color: this.colours.green,
          description: `✨  **Member Joined**:  ${user.username}#${user.discriminator} (ID: ${user.id})`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    })
  }

  onLeave (guild, user) {
    this.data.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!settings.events.hasOwnProperty('leave')) return
      for (const id of settings.events['leave']) {
        this.send(id, '', { embed: {
          color: this.colours.blue,
          description: `👋  **Member Left**:  ${user.username}#${user.discriminator} (ID: ${user.id})`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    })
  }

  onBan (guild, user) {
    this.data.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!settings.events.hasOwnProperty('ban')) return
      for (const id of settings.events['ban']) {
        this.send(id, '', { embed: {
          color: this.colours.red,
          description: `🔨  **Member Banned**:  ${user.username}#${user.discriminator} (ID: ${user.id})`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    })
  }

  onKick (guild, user) {
    this.data.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!settings.events.hasOwnProperty('kick')) return
      for (const id of settings.events['kick']) {
        this.send(id, '', { embed: {
          color: this.colours.red,
          description: `👢  **Member Kicked**:  ${user.username}#${user.discriminator} (ID: ${user.id})`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    })
  }

  memberUpdate (guild, member, oldMember) {
    this.data.Guild.fetch(guild.id).then(settings => {
      if (typeof settings.events !== 'object') return
      if (!(!member.nick && oldMember.nick === null) && member.nick !== oldMember.nick) {
        return this.onNickChange(member, oldMember, settings)
      }
      if (member.roles.length !== oldMember.roles.length) {
        return this.onRolesUpdate(member, oldMember, settings)
      }
    })
  }

  onNickChange (member, oldMember, settings) {
    const user = member.user
    if (!settings.events['nick']) return
    for (const id of settings.events['nick']) {
      if (!member.nick) {
        return this.send(id, '', { embed: {
          color: this.colours.silver,
          description: [
            `👤  **Nickname Removed**:  ${user.username}#${user.discriminator} (ID: ${user.id})\n`,
            `**${oldMember.nick || member.username}** has removed their nickname.`
          ].join('\n'),
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      } else {
        return this.send(id, '', { embed: {
          color: this.colours.silver,
          description: [
            `👤  **Nickname Changed**:  ${user.username}#${user.discriminator} (ID: ${user.id})\n`,
            `**${oldMember.nick || member.username}** is now **${member.nick}**.`
          ].join('\n'),
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
        return this.send(id, '', { embed: {
          color: this.colours.orange,
          description: `🔑  **Role Assigned**: __${role}__ to ${user.username}#${user.discriminator}`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      } else {
        const role = member.guild.roles.get(oldMember.roles.find(r => member.roles.indexOf(r) < 0)).name
        return this.send(id, '', { embed: {
          color: this.colours.orange,
          description: `🔑  **Role Removed**: __${role}__ to ${user.username}#${user.discriminator}`,
          footer: { text: moment().locale(settings.lang).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
        }})
      }
    }
  }
}

module.exports = Auditor
