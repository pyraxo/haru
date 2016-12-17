const { Command } = require('../../core')

class Eightball extends Command {
  constructor (...args) {
    super(...args, {
      name: '8ball',
      description: 'Asks the 8ball a question',
      usage: [
        { name: 'response', displayName: 'question', type: 'string', last: true, optional: false }
      ],
      options: { localeKey: 'misc' }
    })
  }

  handle ({ msg, args }, responder) {
    return responder.format('emoji:question')
    .send([
      `{{8ball.question}}: "${args.response}"\n`,
      `**{{8ball.response}}**: {{8ball.answer_${~~(Math.random() * 20) + 1}}}`
    ], {
      '8ball': ':8ball:',
      user: `**${msg.author.username}**`
    })
  }
}

module.exports = Eightball
