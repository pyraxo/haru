const { Command } = require('sylphy')

class Invite extends Command {
  constructor (...args) {
    super(...args, {
      name: 'invite',
      description: 'Displays my invite link',
      options: { hidden: true, localeKey: 'info' },
      group: 'core'
    })
  }

  handle ({ msg }, responder) {
    return responder.send('{{invite}}', {
      invite: '**<https://pyraxo.moe/haru>**',
      server: '**<https://discord.gg/vYMRRZF>**'
    })
  }
}

module.exports = Invite
