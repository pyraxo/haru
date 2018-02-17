const moment = require('moment')
const { Command, utils } = require('sylphy')

class Credits extends Command {
  constructor (...args) {
    super(...args, {
      name: 'credits',
      description: 'Currency system',
      aliases: ['credit'],
      cooldown: 5,
      usage: [{ name: 'action', displayName: 'give | claim | peek | top', type: 'string', optional: true }],
      subcommands: {
        claim: 'claim',
        give: {
          usage: [
            { name: 'member', type: 'member', optional: false },
            { name: 'amount', type: 'int', optional: false, min: 1 }
          ],
          options: { guildOnly: true }
        },
        peek: {
          usage: [{ name: 'user', type: 'member', optional: false }],
          options: { guildOnly: true }
        },
        top: {
          aliases: ['lb', 'leaderboards'],
          usage: [{ name: 'page', type: 'int', optional: true, default: 1 }]
        }
      },
      group: 'currency'
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

  async handle ({ msg, client }, responder) {
    try {
      const user = await client.plugins.get('db').data.User.fetch(msg.author.id)
      responder.format('emoji:credits').send('{{balance}}', {
        user: msg.author.username,
        balance: `**\`${user.credits}\`**`
      })
    } catch (err) {
      this.logger.error(err)
    }
  }

  async claim ({ msg, plugins, settings }, responder) {
    const cache = plugins.get('cache')
    const data = plugins.get('db').data
    const claimID = 'claims:' + msg.author.id
    try {
      let res = await cache.client.pttlAsync(claimID)
      switch (res) {
        case -1:
        case -2: {
          const amt = ~~(Math.random() * 100) + 100
          await this.topup(data, msg.author.id, amt)
          await cache.store(claimID, 1, 28800)
          return responder.format('emoji:credits').reply('{{topup}}', { amount: `**${amt}**` })
        }
        default: {
          return responder.format('emoji:credits').reply('{{cooldown}}', {
            time: `**${moment(res + moment()).locale(settings.lang).fromNow(true)}**`
          })
        }
      }
    } catch (err) {
      this.logger.error(`Error claiming credits for ${msg.author.username} (${msg.author.id}): ${err}`)
    }
  }

  async give ({ msg, plugins, args }, responder) {
    const data = plugins.get('db').data
    const [member] = await responder.selection(args.member, { mapFunc: m => `${m.user.username}#${m.user.discriminator}` })
    if (!member) return
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

    return responder.format('emoji:atm').dialog([{
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
    }).then(async arg => {
      if (parseInt(arg.code, 10) !== code) {
        responder.error('{{invalidCode}}')
        return
      }
      const credits2 = (await data.User.fetch(msg.author.id)).credits
      if (credits2 < amt) {
        responder.error('{{insufficientCredits}}', { balance: `**${credits2}**` })
        return
      }
      Promise.all([
        this.topup(data, msg.author.id, -amt),
        this.topup(data, user.id, amt)
      ]).then(() => {
        responder.format('emoji:credits').reply('{{confirmation}}', {
          amount: `**${amt}**`,
          user: `**${user.username}**`,
          afterAmount: `**\`$ ${credits2 - amt}\`**`
        })
      }, err => {
        this.logger.error('Error carrying out transaction', err)
      })
    })
  }

  async peek ({ args, plugins }, responder) {
    const data = plugins.get('db').data
    const [member] = await responder.selection(args.user, { mapFunc: m => `${m.user.username}#${m.user.discriminator}` })
    if (!member) return
    try {
      const user = await data.User.fetch(member.id)
      return responder.format('emoji:credits').send('{{balance}}', {
        user: member.user.username,
        balance: `**\`${user.credits}\`**`
      })
    } catch (err) {
      this.logger.error(err)
    }
  }

  async top ({ args, plugins }, responder) {
    const db = plugins.get('db').models
    try {
      const res = await db.User.filter({ deleted: false }).orderBy(db.r.desc('credits')).limit(10).execute()
      const data = await plugins.get('ipc').awaitResponse('query', {
        queries: [{ prop: 'users', query: 'id', input: res.map(u => u.id) }]
      })
      const users = data.map(d => d[0])
      let unique = []
      for (let i = 0; i < users[0].length; i++) {
        if (users[0][i]) unique.push(users[0][i])
        else {
          let idx = 1
          let usr
          while (idx < data.length) {
            usr = users[idx++][i]
            if (usr) break
          }
          unique.push(usr)
        }
      }
      unique = unique.filter(u => u)
      let maxName = 16
      unique.forEach(u => {
        const str = `${u.username}#${u.discriminator}`
        maxName = str.length + 6 > maxName ? str.length + 6 : maxName
      })
      let maxCred = 4
      res.forEach(r => {
        r = r.credits
        maxCred = String(r).length > maxCred ? String(r).length + 1 : maxCred
      })

      return responder.send([
        '```py',
        `@ ${responder.t('{{topTitle}}')}\n`,
        unique.map((u, i) => (
          utils.padEnd(`[${i + 1}]`, 5) +
          ` ${utils.padEnd(`${u.username}#${u.discriminator}`, maxName)} >>   ` +
          `${utils.padStart(res[i].credits, maxCred)} ${responder.t('{{credits}}')}`
        )).join('\n'),
        '```'
      ].join('\n'))
    } catch (err) {
      this.logger.error('Error getting top credits scoreboards', err)
      return responder.error()
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
