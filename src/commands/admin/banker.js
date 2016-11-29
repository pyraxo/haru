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
            { name: 'amount', type: 'int', optional: false }
          ]
        }
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
}

module.exports = Banker
