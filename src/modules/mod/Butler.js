const moment = require('moment')
const logger = require('winston')
const { Module } = require('../../core')

class Butler extends Module {
  constructor (...args) {
    super(...args, {
      name: 'butler',
      events: {
        guildMemberAdd: 'onJoin',
        guildMemberRemove: 'onLeave'
      }
    })

    this.db = this.bot.engine.db.data
  }

  get tags () {
    return [
      'user',
      'userName',
      'guild',
      'userID',
      'guildID',
      'date',
      'members',
      'humans'
    ]
  }

  onJoin (guild, member) {
    this.db.Guild.fetch(guild.id).then(settings =>
      typeof settings.welcome === 'object' &&
      (settings.welcome.chan || settings.welcome.pm) &&
      (settings.welcome.pm ? this.bot.getDMChannel(member.id) : Promise.resolve(settings.welcome.chan)).then(chan =>
        this.send(chan, this.i18n.shift(settings.welcome.msg, {
          user: member.mention,
          guild: guild.name,
          userName: member.user.username,
          userID: member.id,
          guildID: guild.id,
          date: moment().toString(),
          members: guild.members.size,
          humans: guild.members.filter(m => !m.bot).length
        }))
      )
    ).catch(err => logger.error('Error sending welcome message -', err))
    member.addRole(settings.autorole, 'Added role on user join -Haru').catch(err => logger.error('Error setting role -', err))
  }

  onLeave (guild, member) {
    this.db.Guild.fetch(guild.id).then(settings =>
      typeof settings.goodbye === 'object' &&
      settings.goodbye.chan &&
      this.send(settings.goodbye.chan, this.i18n.shift(settings.goodbye.msg, {
        user: member.mention,
        guild: guild.name,
        userName: member.user.username,
        userID: member.id,
        guildID: guild.id,
        date: moment().toString(),
        members: guild.members.size,
        humans: guild.members.filter(m => !m.bot).length
      }))
    ).catch(err => logger.error('Error sending goodbye message -', err))
  }
}

module.exports = Butler
