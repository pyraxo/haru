const moment = require('moment')
const { Command } = require('../../core')

class Slots extends Command {
  constructor (...args) {
    super(...args, {
      name: 'slots',
      description: 'Slot machine command',
      usage: [{ name: 'bet', type: 'int', optional: true, default: 1 }],
      aliases: ['slot'],
      cooldown: 6
    })

    this.reel = [
      '🍇', '🍊', '🇱🇻', '🍈', '🍌', '🍒', '🍉', '🔔', '💎', '🍐', '🍇', '🍊',
      '🍈', '🍒', '🍌', '🍉', '🇱🇻', '💎', '🍌', '🔔', '🍇', '🍐', '🍊',
      '🍊', '🍌', '🍒', '🇱🇻', '🍐', '🍈', '🍇', '🍌'
    ]

    this.wins = {
      '🍒 x 1': 2,
      '🍒 x 2': 5,
      '🍒 x 3': 10,
      '7⃣ x 2': 50,
      '7⃣ x 3': 125,
      '🍐 x 3': 20,
      '🍈 x 3': 20,
      '🍇 x 3': 20,
      '🍊 x 3': 20,
      '🍌 x 3': 20,
      '💎 x 2': 25,
      '💎 x 3': 175,
      '🔔 x 3': 50,
      '🍉 x 3': 20,
      '🇱🇻 x 2': 40,
      '🇱🇻 x 3': 100
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

  checkWinnings (payline, amt) {
    let wins = []
    const res = payline.reduce((p, c) => {
      p[c] = (p[c] || 0) + 1
      return p
    }, {})
    for (const r in res) {
      const v = `${r} x ${res[r]}`
      if (this.wins[v]) wins.push([v, this.wins[v] * amt, this.wins[v]])
    }
    return wins
  }

  doSlots (bet, amount) {
    const machine = this.generateSlots
    const payline = [machine[0][1], machine[1][1], machine[2][1]]
    const winnings = this.checkWinnings(payline, bet)
    
    const rando = Math.random()
    return !winnings.length ? [ machine, payline, winnings ]
    : random >= (0.8 / winnings[0][2])
    ? this.doSlots(bet, amount) : [ machine, payline, winnings ]
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
    if (args.bet > 10000) args.bet = 10000
    if (args.bet < 1) return responder.error('{{yudodis}}')
    if (user.credits < args.bet) {
      return responder.error('{{insufficient}}', {
        amount: `**${args.bet - user.credits}**`,
        command: `**\`${settings.prefix}wage\`**`
      })
    }

    const [machine, payline, winnings] = this.doSlots(args.bet, user.credits)
    try {
      user.credits -= args.bet
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
      `|| ${machine[0][0]} ${machine[1][0]} ${machine[2][0]} ||`,
      `> ${payline.join(' ')} <`,
      `|| ${machine[0][2]} ${machine[1][2]} ${machine[2][2]} ||\n`,
      winnings.length
      ? `{{won}}\n\n${winnings.map(w => `${w[0]}: **${w[1]} {{credits}}**`).join('\n')}`
      : '{{lost}}'
    ], {
      user: `**${msg.author.username}**`,
      amount: `**${args.bet}**`
    })
  }
}

module.exports = Slots
