const { Command } = require('../../core')

class Slots extends Command {
  constructor (...args) {
    super(...args, {
      name: 'slots',
      description: 'Slot machine command',
      usage: [{ name: 'bet', type: 'int', optional: true, default: 1 }],
      aliases: ['slot'],
      cooldown: 5
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
      '7⃣ x 3': 150,
      '🍐 x 3': 20,
      '🍈 x 3': 20,
      '🍇 x 3': 20,
      '🍊 x 3': 20,
      '💎 x 2': 25,
      '💎 x 3': 200,
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
      if (this.wins[v]) wins.push([v, this.wins[v] * amt])
    }
    return wins
  }

  async handle ({ msg, args, data, settings }, responder) {
    const user = await data.User.fetch(msg.author.id)
    if (args.bet > 1000) args.bet = 1000
    if (args.bet < 1) return responder.error('{{yudodis}}')
    if (user.credits < args.bet) {
      return responder.error('{{insufficient}}', {
        amount: `**${args.bet - user.credits}**`,
        command: `**\`${settings.prefix}wage\`**`
      })
    }

    const machine = this.generateSlots
    let payline = [machine[0][1], machine[1][1], machine[2][1]]

    const winnings = this.checkWinnings(payline, args.bet)
    try {
      user.credits -= args.bet
      for (const win of winnings) {
        user.credits += win[1]
      }
      await user.save()
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
