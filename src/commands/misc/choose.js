const { Command } = require('../../core')

class Choose extends Command {
  constructor (...args) {
    super(...args, {
      name: 'choose',
      description: 'Allows the bot to choose from the given options',
      aliases: ['pick'],
      usage: [
        { name: 'choices', type: 'list', separator: ', ', min: 2, optional: false }
      ]
    })
  }

  handle ({ msg, args }, responder) {
    return responder.format('emoji:thinking').reply('{{pick}}', {
      choice: `**${args.choices[~~(Math.random() * args.choices.length)]}**!`
    })
  }
}

module.exports = Choose
