const { Command } = require('sylphy')

class Dice extends Command {
  constructor (...args) {
    super(...args, {
      name: 'dice',
      description: 'Rolls some dice, using dice notation',
      aliases: ['diceroll', 'rolldice'],
      usage: [
        { name: 'notation', displayName: '(rolls)d(sides)][+|-|\\*|/(offset)', type: 'string', optional: true }
      ],
      options: { localeKey: 'misc' },
      group: 'misc'
    })
  }

  roll (n = 1, f = 6, offset = '+0') {
    const num = Math.min(parseInt(n, 10), 100)
    const faces = Math.min(parseInt(f, 10), 100)
    let res = []
    let total = 0
    for (let i = 0; i < num; i++) {
      const result = ~~(Math.random() * faces) + 1
      res.push(result)
      total += result
    }
    switch (offset[0]) {
      case '+': {
        total += parseInt(offset.substring(1), 10)
        break
      }
      case '-': {
        total -= parseInt(offset.substring(1), 10)
        break
      }
      case '*': {
        total *= parseInt(offset.substring(1), 10)
        break
      }
      case '/': {
        total /= parseInt(offset.substring(1), 10)
        break
      }
    }
    return { total: +total.toFixed(2), results: res }
  }

  handle ({ msg, args, settings, trigger }, responder) {
    if (!args.notation) {
      return responder.send(':game_die: **1d6**  |  {{dice.result}}', {
        result: `**${this.roll().total}**`
      })
    }
    if (/^[1-9]*$/.test(args.notation)) {
      return responder.send(`:game_die: **${args.notation}d6**  |  {{dice.result}}`, {
        result: `**${this.roll(args.notation).total}**`
      })
    }
    const input = args.notation.match(/^(\d+)?d(\d+)([\+\-\*\/]\d+)?$/i)
    if (input === null) {
      return responder.error([
        '{{dice.invalid}}\n',
        this.resolver.wrongUsage(this.usage, { prefix: settings.prefix, command: trigger })
      ], { text: `'**${args.notation}**'` })
    }
    const result = this.roll(...input.slice(1))
    return responder.send([
      `:game_die: **${args.notation}**  |  {{dice.result}}`,
      result.results.length > 1 ? ['```xl', result.results.join(' '), '```'].join('\n') : ''
    ], {
      result: `**${result.total}**`
    })
  }
}

module.exports = Dice
