const { Command } = require('../../core')

class Invite extends Command {
  constructor (...args) {
    super(...args, {
      name: 'invite',
      description: 'Displays my invite link',
      options: { hidden: true, localeKey: 'info' }
    })
  }

  async handle ({ msg }, responder) {
    responder.send('{{invite}}', {
      invite: '**https://pyraxo.moe/haru**',
      server: '**<https://discord.gg/bBqpAKw>**'
    })
  }
}

module.exports = Invite
