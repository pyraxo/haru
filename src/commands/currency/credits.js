const moment = require('moment')
const logger = require('winston')
const { Command } = require('../../core')

class Credits extends Command {
  constructor (...args) {
    super(...args, {
      name: 'credits',
      description: 'Currency system',
      aliases: ['credit'],
      cooldown: 5,
      usage: [{ name: 'action', displayName: 'give | claim', type: 'string', optional: true }],
      subcommands: {
        claim: 'claim',
        give: {
          usage: [
            { name: 'member', type: 'member', optional: false },
            { name: 'amount', type: 'int', optional: false }
          ]
        },
        peek: {
          usage: [{ name: 'user', type: 'member', optional: false }]
        }
      }
    })
  }

  async topup (data, id, amt) {
    try {
      let user = await data.User.fetch(id)
      user.credits += amt
      await user.save()
      return user
    } catch (err) {
      throw err
    }
  }

  async handle ({ msg, data }, responder) {
    try {
      const user = await data.User.fetch(msg.author.id)
      responder.format('emoji:credits').send('{{balance}}', {
        user: msg.author.username,
        balance: `**\`${user.credits}\`**`
      })
    } catch (err) {
      this.logError(err)
    }
  }

  async claim ({ msg, cache, data }, responder) {
    const claimID = 'claims:' + msg.author.id
    try {
      let res = await cache.client.pttlAsync(claimID)
      switch (res) {
        case -1:
        case -2: {
          const amt = ~~(Math.random() * 100) + 50
          await this.topup(data, msg.author.id, amt)
          await cache.store(claimID, 1, 28800)
          responder.format('emoji:credits').reply('{{topup}}', { amount: `**${amt}**` })
          break
        }
        default: {
          responder.format('emoji:credits').reply('{{cooldown}}', {
            time: `**${moment(res + moment()).fromNow(true)}**`
          })
          break
        }
      }
    } catch (err) {
      logger.error(`Error claiming credits for ${msg.author.username} (${msg.author.id}): ${err}`)
    }
  }

  async give ({ msg, cache, data, args }, responder) {
    const member = args.member[0]
    if (member.id === msg.author.id) {
      responder.error('{{selfSenderError}}')
      return
    }
    const credits = (await data.User.fetch(msg.author.id)).credits
    const user = member.user
    const amt = args.amount

    if (user.bot) {
      responder.error('{{botUserError}}')
      return
    }

    if (credits < amt) {
      responder.error('{{insufficientCredits}}', { balance: `**${credits}**` })
      return
    }

    const code = ~~(Math.random() * 8999) + 1000

    responder.format('emoji:atm').dialog([{
      prompt: '{{dialog}}',
      input: { type: 'string', name: 'code' }
    }], {
      author: `**${msg.author.username}**`,
      amount: `**${amt}**`,
      user: `**${user.username}#${user.discriminator}**`,
      balance: `**\`$ ${credits}\`**`,
      afterAmount: `**\`$ ${credits - amt}\`**`,
      code: `**\`${code}\`**`,
      exit: '**`cancel`**',
      tries: 1
    }).then(arg => {
      if (parseInt(arg.code, 10) !== code) {
        responder.error('{{invalidCode}}')
        return
      }
      Promise.all([
        this.topup(data, msg.author.id, -amt),
        this.topup(data, user.id, amt)
      ]).then(() => {
        responder.format('emoji:credits').reply('{{confirmation}}', {
          amount: `**${amt}**`,
          user: `**${user.username}**`,
          afterAmount: `**\`$ ${credits - amt}\`**`
        })
      }, err => {
        logger.error('Error carrying out transaction')
        logger.error(`S: ${msg.author.username} (${msg.author.id}) | T: ${user.username} (${user.id})`)
        logger.error(err)
      })
    })
  }

  async peek ({ args, data }, responder) {
    try {
      const user = await data.User.fetch(args.user[0].id)
      responder.format('emoji:credits').send('{{balance}}', {
        user: args.user[0].user.username,
        balance: `**\`${user.credits}\`**`
      })
    } catch (err) {
      this.logError(err)
    }
  }
}

class Claim extends Credits {
  constructor (...args) {
    super(...args, {
      name: 'wage',
      description: 'Claim your credits every 8 hours',
      aliases: [],
      usage: [],
      options: { localeKey: 'credits' },
      subcommand: 'claim'
    })
  }
}

module.exports = [ Credits, Claim ]
