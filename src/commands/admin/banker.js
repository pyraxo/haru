const logger = require('winston')
const { Command } = require('../../core')

class Banker extends Command {
  constructor (...args) {
    super(...args, {
      name: 'banker',
      description: 'Credit banker!',
      options: {
        adminOnly: true
      },
      subcommands: {
        give: {
          aliases: ['add'],
          usage: [
            { name: 'user', type: 'member', optional: false },
            { name: 'amount', type: 'int', optional: false }
          ]
        },
        take: {
          aliases: ['remove'],
          usage: [
            { name: 'user', type: 'member', optional: false },
            { name: 'amount', type: 'int', optional: false, min: -Infinity, max: 0 }
          ]
        },
        supercharge: 'supercharge'
      }
    })
  }

  async give ({ args, data }, responder) {
    const member = args.user[0]
    const amount = args.amount
    try {
      const user = await data.User.fetch(member.id)
      user.credits += amount
      await user.save()
      return responder.success(`you've given ${member.mention} **${amount}** credits.`)
    } catch (err) {
      logger.error(`Could not give credits to ${member.user.username} (${member.id})`)
      logger.error(err)
    }
  }

  async take ({ args, data }, responder) {
    const member = args.user[0]
    const amount = args.amount
    try {
      const user = await data.User.fetch(member.id)
      user.credits -= amount
      await user.save()
      return responder.success(`you've taken **${amount}** credits from ${member.mention}.`)
    } catch (err) {
      logger.error(`Could not take credits from ${member.user.username} (${member.id})`)
      logger.error(err)
    }
  }

  async supercharge ({ args, data, cache }, responder) {
    // const ids = await cache.client.zrevrangeAsync('credits', 0, 1000)
    const ids = JSON.parse(require('fs').readFileSync(require('path').join(this.bot.paths.resources, 'creds.json')))
    for (const id in ids) {
      const amt = parseInt(ids[id], 10)
      if (amt < 0) continue
      const user = await data.User.fetch(id)
      user.credits += amt
      await user.save()
    }
    return responder.success(`supercharged **${Object.keys(ids).length}** accounts.`)
  }
}

module.exports = Banker
