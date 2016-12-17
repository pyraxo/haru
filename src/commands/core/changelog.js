const { Command } = require('../../core')

class Changelog extends Command {
  constructor (...args) {
    super(...args, {
      name: 'changelog',
      description: 'Pong!',
      options: { localeKey: 'settings' }
    })
  }

  async handle ({ msg }, responder) {
    const data = (await this.bot.engine.ipc.awaitResponse('channelLogs', {
      queries: [{ channel: '258206438940344320', limit: 2 }]
    })).find(d => Array.isArray(d.result)).result[0]
    return responder.format('emoji:info').send([
      '**{{changelog}}**\n',
      data[0].content + '\n',
      data[1].content
    ])
  }
}

module.exports = Changelog
