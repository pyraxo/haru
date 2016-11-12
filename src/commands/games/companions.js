const { MultiCommand } = require('../../core')

class Companions extends MultiCommand {
  constructor (...args) {
    super(...args, {
      name: 'companions',
      description: 'Animal companion system',
      aliases: ['pets'],
      cooldown: 5
    })

    this.registerSubcommands({
      info: 'info'
    }, 'default')
  }

  default ({ msg }, responder) {

  }

  info ({ msg }, responder) {

  }
}

class PetInfo extends Companions {
  constructor (...args) {
    super(...args, {
      name: 'petinfo',
      description: 'Gets information about your companion'
    })

    this.registerSubcommand('info')
  }
}

module.exports = [ Companions, PetInfo ]
