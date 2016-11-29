const { Command } = require('../../core')

class Stats extends Command {
  constructor (...args) {
    super(...args, {
      name: 'stats',
      description: 'Statistics about me',
      options: { hidden: true }
    })
  }

  async handle ({ msg, settings }, responder) {

  }
}

module.exports = Stats
