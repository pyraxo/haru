const util = require('util')
const { Command } = require('sylphy')

class Reload extends Command {
  constructor (...args) {
    super(...args, {
      name: 'reload',
      description: 'Reloads commands, middleware and modules',
      options: {
        adminOnly: true
      },
      cooldown: 0,
      usage: [
        { name: 'type', type: 'string', optional: true }
      ],
      group: 'admin'
    })
  }

  async handle ({ plugins, args }, responder) {
    try {
      const data = await plugins.get('ipc').awaitResponse('reloadFile', { type: args.type })
      return responder.format('code:js').send(data.map(d => `${d.id} - ${util.inspect(d.resp)}`).join('\n'))
    } catch (err) {
      return responder.format('code:js').send(err)
    }
  }
}

module.exports = Reload
