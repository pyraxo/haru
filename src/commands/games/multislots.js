const moment = require('moment')
const { Command } = require('../../core')

class Multislots extends Command {
  constructor (...args) {
    super(...args, {
      name: 'multislots',
      description: 'Multi-line slot machine command',
      usage: [{ name: 'bet', type: 'int', optional: true, default: 1 }],
      aliases: ['multislot'],
      cooldown: 6,
      options: {
        localeKey: 'slots'
      }
    })

    this.reel = [
      '🍇', '🍊', '🇱🇻', '🍈', '🍌', '🍒', '🍉', '🔔', '💎', '🍐', '🍇', '🍊',
      '🍈', '🍒', '🍌', '🍉', '🇱🇻', '💎', '🍌', '🔔', '🍇', '🍐', '🍊',
      '🍊', '🍌', '🍒', '🇱🇻', '🍐', '🍈', '🍇', '🍌', '7⃣'
    ]

    this.wins = {
      '🍒 x 1': 2,
      '🍒 x 2': 5,
      '🍒 x 3': 10,
      '7⃣ x 2': 50,
      '7⃣ x 3': 150,
      '🍐 x 3': 20,
      '🍈 x 3': 20,
      '🍇 x 3': 20,
      '🍊 x 3': 20,
      '🍌 x 3': 20,
      '💎 x 2': 25,
      '💎 x 3': 100,
      '🔔 x 3': 50,
      '🍉 x 3': 20,
      '🇱🇻 x 2': 40,
      '🇱🇻 x 3': 75
    }
  }

  get generateSlots () {
    const reels = this.reel
    let machine = []
    for (let i = 0; i < 3; i++) {
      const res = ~~(Math.random() * (reels.length - 2))
      machine.push(reels.slice(res, res + 3))
    }
    return machine
  }

  checkWinnings (payline1, payline2, payline3, amt) {
    let wins = []
    const res = payline1.reduce((p, c) => {
      p[c] = (p[c] || 0) + 1
      return p
    }, {})
    for (const r in res) {
      const v = `${r} x ${res[r]}`
      if (this.wins[v]) wins.push([v, this.wins[v] * amt])
    }
    const res2 = payline2.reduce((p2, c2) => {
      p2[c2] = (p2[c2] || 0) + 1
      return p2
    }, {})
    for (const r2 in res2) {
      const v2 = `${r2} x ${res2[r2]}`
      if (this.wins[v2]) wins.push([v2, this.wins[v2] * amt])
    }
    const res3 = payline3.reduce((p3, c3) => {
      p3[c3] = (p3[c3] || 0) + 1
      return p3
    }, {})
    for (const r3 in res3) {
      const v3 = `${r3} x ${res3[r3]}`
      if (this.wins[v3]) wins.push([v3, this.wins[v3] * amt])
    }
    return wins
  }

  doSlots (bet, amount) {
    const machine = this.generateSlots
    const payline1 = [machine[0][0], machine[1][0], machine[2][0]]
    const payline2 = [machine[0][1], machine[1][1], machine[2][1]]
    const payline3 = [machine[0][2], machine[1][2], machine[2][2]]
    const winnings = this.checkWinnings(payline1, payline2, payline3, bet)

    const rando = Math.random()
    return (amount > 1000000 && winnings.length && rando >= 0.5)
    ? this.doSlots(bet, amount) : [ machine, payline1, payline2, payline3, winnings ]
  }

  async handle ({ msg, args, data, settings, cache }, responder) {
    let dailyWins = await cache.client.getAsync(`slots:${msg.author.id}`)
    if (parseInt(dailyWins, 10) >= 1000000) {
      const res = await cache.client.pttlAsync(`slots:${msg.author.id}`)
      return responder.error('{{dailyLimit}}', {
        time: `${moment(res + moment()).fromNow(true)}`
      })
    }
    const user = await data.User.fetch(msg.author.id)
    if (args.bet > 5000) args.bet = 5000
    if (args.bet < 1) return responder.error('{{yudodis}}')
    if (user.credits < args.bet * 3) {
      return responder.error('{{insufficient}}', {
        amount: `**${args.bet * 3 - user.credits}**`,
        command: `**\`${settings.prefix}wage\`**`
      })
    }

    const [machine, payline1, payline2, payline3, winnings] = this.doSlots(args.bet, user.credits)
    try {
      user.credits -= args.bet * 3
      let total = 0
      for (const win of winnings) {
        user.credits += win[1]
        total += win[1]
      }
      await user.save()
      await cache.client.multi()
      .incrby(`slots:${msg.author.id}`, total)
      .expire(`slots:${msg.author.id}`, 86400)
      .execAsync()
    } catch (err) {
      return responder.error()
    }
    return responder.send([
      '**__   S   L   O   T   S   __**',
      `> ${payline1.join(' ')} <`,
      `> ${payline2.join(' ')} <`,
      `> ${payline3.join(' ')} <\n`,
      winnings.length
      ? `{{won}}\n\n${winnings.map(w => `${w[0]}: **${w[1]} {{credits}}**`).join('\n')}`
      : '{{lost}}'
    ], {
      user: `**${msg.author.username}**`,
      amount: `**${args.bet} **x3`
    })
  }
}

module.exports = Multislots
