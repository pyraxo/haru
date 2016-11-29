const logger = require('winston')
const moment = require('moment')
const { Command } = require('../../core')

class Stats extends Command {
  constructor (...args) {
    super(...args, {
      name: 'stats',
      description: 'Statistics about me'
    })
  }

  async handle ({ msg, settings, client, cache }, responder) {
    try {
      var results = await this.bot.engine.ipc.awaitResponse('stats')
    } catch (err) {
      logger.error('Could not fetch stats')
      logger.error(err)
      return responder.error()
    }
    let stats = {
      u: 0,
      g: 0,
      vc: 0,
      tc: 0
    }
    results.forEach(elem => {
      for (const stat in elem.result) {
        stats[stat] += elem.result[stat]
      }
    })
    return responder.embed({
      author: {
        name: 'pyraxo#6400',
        url: 'https://pyraxo.moe/haru',
        icon_url: 'https://twitter.com/pyraxo/profile_image?size=original'
      },
      description: [
        `**[${responder.t('{{server}}')}](https://discord.gg/bBqpAKw)**`
      ].join('\n'),
      color: this.colours.pink,
      fields: [
        {
          name: responder.t('{{users}}'),
          value: stats.u,
          inline: true
        },
        {
          name: responder.t('{{channels}}'),
          /*
          value: [
            `${stats.vc + stats.tc} ${responder.t('{{total}}')}`,
            `${stats.tc} ${responder.t('{{text}}')}`,
            `${stats.vc} ${responder.t('{{voice}}')}`
          ].join('\n'),
          */
          value: stats.vc + stats.tc,
          inline: true
        },
        {
          name: responder.t('{{guilds}}'),
          value: stats.g,
          inline: true
        },
        {
          name: responder.t('{{uptime}}'),
          value: moment.duration(client.uptime, 'milliseconds').format('h[h] m[m] s[s]'),
          inline: true
        },
        {
          name: responder.t('{{memoryUsage}}'),
          value: (process.memoryUsage().rss / 1000000).toFixed(2) + ' MB',
          inline: true
        },
        {
          name: responder.t('{{commandsUsed}}'),
          value: await cache.client.getAsync('cmdUsage'),
          inline: true
        }
      ]
    }).send()
  }
}

module.exports = Stats
