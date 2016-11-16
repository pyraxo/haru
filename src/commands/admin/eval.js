const util = require('util')
const { Command } = require('../../core')

class Eval extends Command {
  constructor (...args) {
    super(...args, {
      name: 'eval',
      description: 'Evaluates an expression',
      adminOnly: true,
      cooldown: 0
    })
  }

  async handle (container, responder) {
    const { msg, settings } = container
    let resp
    try {
      resp = eval(msg.content.substr(settings.prefix.length).split(' ').slice(1).join(' '))
    } catch (err) {
      resp = `${err.message}\n\n${err.stack}`
    }
    if (Array.isArray(resp) || typeof resp === 'object') {
      resp = util.inspect(resp)
    }
    responder.format('code:js').send(
      resp.length > 200 ? resp.substr(0, 200) + '...' : resp
    )
  }
}

class FullEval extends Command {
  constructor (...args) {
    super(...args, {
      name: 'fulleval',
      description: 'Evaluates an expression across processes',
      adminOnly: true,
      cooldown: 0
    })
  }

  async handle (container, responder) {
    const { msg } = container
    const content = msg.content.split(' ').slice(1).join(' ')
    this.bot.engine.ipc.awaitResponse('evaluate', { content })
    .then(data => responder.format('code:js').send(data.map(d => {
      const r = d.result || null
      return [
        `PROCESS ${d.id}:`,
        (r && r.length > 200 ? r.substr(0, 200) + '...' : r) + '\n'
      ].join('\n')
    }).join('\n')))
    .catch(err => responder.format('code:js').send(err))
  }
}

module.exports = [ Eval, FullEval ]
