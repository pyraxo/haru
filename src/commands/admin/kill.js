const util = require('util')
const { Command } = require('sylphy')

class Kill extends Command {
  constructor (...args) {
    super(...args, {
      name: 'kill',
      description: 'Kills all processes',
      options: { adminOnly: true },
      group: 'admin'
    })
  }

  handle (container, responder) {
    return container.plugins.get('ipc').awaitResponse('kill')
    .then(data => responder.format('code:js').send(data.map(d => `${d.id} - ${util.inspect(d.resp)}`).join('\n')))
    .catch(err => responder.format('code:js').send(err))
  }
}

module.exports = Kill
