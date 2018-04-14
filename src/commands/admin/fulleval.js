const { Command } = require('sylphy')

class FullEval extends Command {
  constructor (...args) {
    super(...args, {
      name: 'fulleval',
      description: 'Evaluates an expression across processes',
      options: {
        adminOnly: true
      },
      cooldown: 0,
      group: 'admin'
    })
  }

  async handle (container, responder) {
    const { msg, plugins } = container
    const content = msg.content.split(' ').slice(1).join(' ')
    plugins.get('ipc').awaitResponse('evaluate', { content })
    .then(data => responder.format('code:js').send(data.map(d => {
      const r = d || null
      return [
        `PROCESS ${d.id}:`,
        (r && r.length > 200 ? r.substr(0, 200) + '...' : r) + '\n'
      ].join('\n')
    }).join('\n')))
    .catch(err => responder.format('code:js').send(err))
  }
}

module.exports = FullEval
