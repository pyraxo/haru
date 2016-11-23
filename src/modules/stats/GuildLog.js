const chalk = require('chalk')
const logger = require('winston')
const moment = require('moment')
const request = require('superagent')

const { Module } = require('../../core')

class GuildLog extends Module {
  constructor (...args) {
    super(...args, {
      name: 'guilds',
      events: {
        guildCreate: 'newGuild',
        guildDelete: 'delGuild',
        ready: 'sendStats'
      }
    })

    this.logChannel = this.client.getChannel('249814267786690580')
  }

  sendStats () {
    if (process.env.API_CARBONITEX) {
      request
      .post('https://www.carbonitex.net/discord/data/botdata.php')
      .type('json')
      .send({
        key: process.env.API_CARBONITEX,
        shard_id: process.env.BASE_SHARD_ID,
        shard_count: process.env.CLIENT_PROCESSES,
        servercount: this.client.guilds.size
      })
      .end((err, res) => {
        if (err) return logger.error(`Could not update Carbon statistics: ${err}`)
        if (res.statusCode !== 200) return logger.error(`Error updating Carbon statistics: Code ${res.statusCode}`)
        logger.info(`Updated guild count on Carbonitex: ${res.text}`)
      })
    }

    if (process.env.API_DBOTS) {
      request
      .post(`https://bots.discord.pw/api/bots/${this.client.user.id}/stats`)
      .send({
        shard_id: process.env.BASE_SHARD_ID,
        shard_count: process.env.CLIENT_PROCESSES,
        server_count: this.client.guilds.size
      })
      .set('Authorization', process.env.API_DBOTS)
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        if (err) return logger.error(err)
        if (res.statusCode !== 200) return logger.error(`D-bots returned code ${res.statusCode}`)
        logger.info(`Updated guild count on Discord Bots - ${res.body.stats[0].server_count}`)
      })
    }
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

    this.sendStats()
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

    this.sendStats()
  }
}

module.exports = GuildLog
