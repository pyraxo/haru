const { Command } = require('../../core')

class Eval extends Command {
  constructor (...args) {
    super(...args, {
      name: 'eval',
      description: 'Evaluates an expression',
      usage: [{ name: 'code', type: 'string', optional: false, last: true }],
      options: {
        adminOnly: true
      },
      cooldown: 0
    })
  }

  createEmbed (success = true, isPromise = false, result) {
    let title
    let color
    let message
    if (isPromise) {
      switch (success) {
        case true: {
          title = 'Promise resolved'
          message = String(result || 'undefined')
          color = this.colours.green
          break
        }
        case false: {
          title = 'Promise rejected'
          message = result.message
          color = this.colours.red
          break
        }
        default: {
          title = 'Promise'
          message = 'Promise pending'
          color = this.colours.blue
          break
        }
      }
    } else {
      if (success) {
        title = 'Success'
        message = String(result)
        color = this.colours.green
      } else {
        title = 'Error'
        message = result.message
        color = this.colours.red
      }
    }
    return { title, color, description: message }
  }

  async handle (container, responder) {
    const { client } = container
    let resp
    try {
      resp = eval(container.args.code) // eslint-disable-line
    } catch (err) {
      resp = err
    }

    const success = !(resp instanceof Error)
    const isPromise = resp && !!(resp.then)

    const message = await responder.embed(
      this.createEmbed(isPromise ? null : success, isPromise, resp)
    ).send()

    if (!isPromise) return

    resp
    .then(result => message.edit({ content: '', embed: this.createEmbed(true, true, result) }))
    .catch(err => message.edit({ content: '', embed: this.createEmbed(false, true, err) }))
  }
}

class FullEval extends Command {
  constructor (...args) {
    super(...args, {
      name: 'fulleval',
      description: 'Evaluates an expression across processes',
      options: {
        adminOnly: true
      },
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
