const chalk = require('chalk')
const logger = require('winston')
const moment = require('moment')
const { Module } = require('../../core')

class GuildLog extends Module {
  constructor (...args) {
    super(...args, {
      name: 'guilds',
      events: {
        guildCreate: 'newGuild',
        guildDelete: 'delGuild'
      }
    })

    this.logChannel = this.client.getChannel('249814267786690580')
  }

  newGuild (guild) {
    if (!this.logChannel) return
    logger.info(`Guild created: ${guild.name} (${guild.id})`)
    logger.info(`${chalk.cyan.bold('U:')} ${guild.members.size} | ${chalk.cyan.bold('S:')} ${guild.shard.id}`)

    this.send(this.logChannel, '', { embed: {
      author: {
        name: guild.name,
        icon_url: guild.iconURL
      },
      title: `Guild Created: ${guild.members.size} members`,
      color: this.getColour('green'),
      footer: {
        text: `Shard ${guild.shard.id}  |  ${moment().format('ddd Do MMM, YYYY [at] hh:mm:ss a')}`
      }
    }})
  }

  delGuild (guild) {
    if (!this.logChannel) return
    logger.info(`Guild deleted: ${guild.name} (${guild.id})`)
    logger.info(`${chalk.cyan.bold('U:')} ${guild.members.size} | ${chalk.cyan.bold('S:')} ${guild.shard.id}`)

    this.send(this.logChannel, '', { embed: {
      author: {
        name: guild.name,
        icon_url: guild.iconURL
      },
      title: `Guild Deleted: ${guild.members.size} members`,
      color: this.getColour('red'),
      footer: {
        text: `Shard ${guild.shard.id}  |  ${moment().format('ddd Do MMM, YYYY [at] hh:mm:ss a')}`
      }
    }})
  }
}

module.exports = GuildLog
