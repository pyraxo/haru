const { Command } = require('sylphy')

class Changelog extends Command {
  constructor (...args) {
    super(...args, {
      name: 'changelog',
      description: 'Fetches the changelog',
      options: { localeKey: 'settings' },
      group: 'core'
    })
  }

  async handle ({ msg, plugins }, responder) {
    const data = (await plugins.get('ipc').awaitResponse('channelLogs', {
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
