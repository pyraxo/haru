const gm = require('gm')
const path = require('path')
const { Command } = require('sylphy')

class Love extends Command {
  constructor (...args) {
    super(...args, {
      name: 'love',
      description: 'I-I love you!',
      usage: [
        { name: 'text', optional: true, last: true }
      ],
      options: { botPerms: ['attachFiles'] },
      group: 'images'
    })
  }

  async handle ({ msg, args }, responder) {
    let input = args.text ? args.text.replace(/<@!*(\d{17,18})>/gi, (matched, id) => {
      let member = msg.channel.guild.members.get(id)
      return member ? member.nick || member.user.username : matched
    }) : msg.author.username
    if (input.length > 300) input = input.substring(0, 300) + '...'
    const text = [
      'I\'ll always',
      'love you,',
      input.match(/.{1,10}/g).join('-\n')
    ].join('\n')

    await responder.typing()

    gm(path.join(process.cwd(), 'res', 'images', 'love.png'))
    .font(path.join(process.cwd(), 'res', 'fonts', 'animeace.ttf'), 13.5)
    .gravity('Center')
    .drawText(-188, -20, text)
    .toBuffer('PNG', (err, buf) => {
      if (err) {
        this.logger.error('Error creating \'hate\' image')
        this.logger.error(err)
        responder.error()
        return
      }
      responder.file('love.png', buf).send()
    })
  }
}

module.exports = Love
