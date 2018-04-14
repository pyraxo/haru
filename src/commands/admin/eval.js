const { Command, utils } = require('sylphy')

class Eval extends Command {
  constructor (...args) {
    super(...args, {
      name: 'eval',
      description: 'Evaluates an expression',
      usage: [{ name: 'code', type: 'string', optional: false, last: true }],
      options: { adminOnly: true },
      cooldown: 0,
      group: 'admin'
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
          color = utils.getColour('green')
          break
        }
        case false: {
          title = 'Promise rejected'
          message = result.message
          color = utils.getColour('red')
          break
        }
        default: {
          title = 'Promise'
          message = 'Promise pending'
          color = utils.getColour('blue')
          break
        }
      }
    } else {
      if (success) {
        title = 'Success'
        message = String(result)
        color = utils.getColour('green')
      } else {
        title = 'Error'
        message = result.message
        color = utils.getColour('red')
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

module.exports = Eval
