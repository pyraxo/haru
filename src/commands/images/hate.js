const gm = require('gm')
const path = require('path')
const logger = require('winston')
const { Command } = require('../../core')

class Hate extends Command {
  constructor (...args) {
    super(...args, {
      name: 'hate',
      description: 'I-I hate you!',
      usage: [
        { name: 'text', optional: true }
      ]
    })
  }

  handle ({ msg, args }, responder) {
    const input = args.text ? args.text.replace(/<@!*(\d{17,18})>/gi, (matched, id) => {
      let member = msg.guild.members.find(m => m.id === id)
      return member ? member.nick || member.user.username : matched
    }) : msg.author.username
    const text = [
      'I hate',
      'you,',
      input.match(/.{1,8}/g).join('-\n'),
      '-chan!'
    ].join('\n')

    gm(path.join(this.bot.paths.resources, 'images/hate.png'))
    .font(path.join(this.bot.paths.resources, 'fonts/animeace.ttf'), 13.5)
    .gravity('Center')
    .drawText(-67, 32, text)
    .toBuffer('PNG', (err, buf) => {
      if (err) {
        logger.error(`Error creating 'hate' image - ${err}`)
        responder.error('{{%ERROR}}')
        return
      }
      responder.upload(buf, 'love.png')
    })
  }
}

module.exports = Hate
