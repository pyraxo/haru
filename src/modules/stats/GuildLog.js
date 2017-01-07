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

    this.logChannel = '249814267786690580'
  }

  init () {
    this.data = this.bot.engine.db.data
    this.portal = this.bot.engine.modules.get('portal')
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
        servercount: this.bot.guilds.size
      })
      .end((err, res) => {
        if (err) return logger.error(`Could not update Carbon statistics: ${err}`)
        if (res.statusCode !== 200) return logger.error(`Error updating Carbon statistics: Code ${res.statusCode}`)
        logger.info(`Updated guild count on Carbonitex: ${res.text}`)
      })
    }

    if (process.env.API_DBOTS) {
      request
      .post(`https://bots.discord.pw/api/bots/${this.bot.user.id}/stats`)
      .send({
        shard_id: process.env.BASE_SHARD_ID,
        shard_count: process.env.CLIENT_PROCESSES,
        server_count: this.bot.guilds.size
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
    logger.info(`Guild created: ${guild.name} (${guild.id})`)
    logger.info(`${chalk.cyan.bold('U:')} ${guild.memberCount} | ${chalk.cyan.bold('S:')} ${guild.shard.id}`)

    this.sendStats()
    this.portal.tunnel(this.logChannel, '', { embed: {
      author: {
        name: guild.name,
        icon_url: guild.iconURL
      },
      title: `Guild Created: ${guild.memberCount} members`,
      color: this.getColour('green'),
      footer: {
        text: `Shard ${guild.shard.id}  |  ${moment().format('ddd Do MMM, YYYY [at] hh:mm:ss a')}`
      }
    }})

    this.send(guild.defaultChannel, '{{join}}', {
      help: `**\`${process.env.CLIENT_PREFIX}help\`**`,
      about: `**\`${process.env.CLIENT_PREFIX}info\`**`
    })

    setTimeout(() => (
      this.data.Guild.fetch(guild.id).then(settings => {
        settings.deleted = false
        return settings.save().catch(logger.error)
      }).catch(err => {
        logger.error(`Could not load settings for ${guild.name} (${guild.id})`)
        logger.error(err)
      })
    ), 1000 * parseInt(process.env.BASE_SHARD_ID))
  }

  delGuild (guild) {
    logger.info(`Guild deleted: ${guild.name} (${guild.id})`)
    logger.info(`${chalk.cyan.bold('U:')} ${guild.memberCount} | ${chalk.cyan.bold('S:')} ${guild.shard.id}`)

    this.sendStats()
    this.portal.tunnel(this.logChannel, '', { embed: {
      author: {
        name: guild.name,
        icon_url: guild.iconURL
      },
      title: `Guild Deleted: ${guild.memberCount} members`,
      color: this.getColour('red'),
      footer: {
        text: `Shard ${guild.shard.id}  |  ${moment().format('ddd Do MMM, YYYY [at] hh:mm:ss a')}`
      }
    }})

    setTimeout(() => (
      this.data.Guild.fetch(guild.id).then(settings => {
        settings.deleted = true
        return settings.save().catch(logger.error)
      }).catch(err => {
        logger.error(`Could not load settings for ${guild.name} (${guild.id})`)
        logger.error(err)
      })
    ), 1000 * parseInt(process.env.BASE_SHARD_ID))
  }
}

module.exports = GuildLog
