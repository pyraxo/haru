const { Command } = require('sylphy')

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
      },
      group: 'admin'
    })
  }

  async give ({ args, client }, responder) {
    const member = args.user[0]
    const amount = args.amount
    const data = client.plugins.get('db').data
    try {
      const user = await data.User.fetch(member.id)
      user.credits += amount
      await user.save()
      return responder.success(`you've given ${member.mention} **${amount}** credits.`)
    } catch (err) {
      this.logger.error(`Could not give credits to ${member.user.username} (${member.id})`)
      this.logger.error(err)
    }
  }

  async take ({ args, client }, responder) {
    const member = args.user[0]
    const amount = args.amount
    const data = client.plugins.get('db').data
    try {
      const user = await data.User.fetch(member.id)
      user.credits -= amount
      await user.save()
      return responder.success(`you've taken **${amount}** credits from ${member.mention}.`)
    } catch (err) {
      this.logger.error(`Could not take credits from ${member.user.username} (${member.id})`)
      this.logger.error(err)
    }
  }
}

module.exports = Banker
