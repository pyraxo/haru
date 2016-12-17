const { Command } = require('../../core')

class Choose extends Command {
  constructor (...args) {
    super(...args, {
      name: 'choose',
      description: 'Allows the bot to choose from the given options',
      aliases: ['pick'],
      usage: [
        { name: 'choices', displayName: 'choice 1 | choice 2 | etc', type: 'list', separator: ' | ', min: 2, last: true, optional: false }
      ],
      options: { localeKey: 'misc' }
    })
  }

  handle ({ msg, args }, responder) {
    return responder.format('emoji:thinking').reply('{{choose.pick}}', {
      choice: `**${args.choices[~~(Math.random() * args.choices.length)]}**!`
    })
  }
}

module.exports = Choose
