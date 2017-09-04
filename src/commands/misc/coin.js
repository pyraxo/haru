const { Command } = require('sylphy')

class Coin extends Command {
  constructor (...args) {
    super(...args, {
      name: 'coin',
      description: 'Flip coins',
      aliases: ['coinflip', 'flipcoin'],
      usage: [
        { name: 'times', type: 'int', optional: true, min: 1, max: 1000 }
      ],
      options: { localeKey: 'misc' },
      group: 'misc'
    })
  }

  flip (times = 1) {
    let results = { heads: 0, tails: 0 }
    for (let i = 0; i < times; i++) {
      results[~~(Math.random() * 2) ? 'heads' : 'tails']++
    }
    return results
  }

  handle ({ msg, args }, responder) {
    if (!args.times) {
      return responder.format('emoji:info').reply(`{{coin.${this.flip().heads ? 'heads' : 'tails'}}}`)
    }
    const res = this.flip(args.times)
    return responder.format('emoji:info').reply('{{coin.result}}', {
      heads: `**${res.heads}**`,
      tails: `**${res.tails}**`
    })
  }
}

module.exports = Coin
