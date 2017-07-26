const cleverbot = require('cleverbot.io')
talk = new cleverbot(process.env.CLEVERIO_USER, process.env.CLEVERIO_KEY)

const { Module } = require('../../core')

class CleverIO extends Module {
  constructor(...args) {
    super(...args, {
      name: 'cleverio'
    })

    talk.create(function (err, session) {
    })
  }

    async respond (message, channel) {
      talk.ask(`${message}`, (err, response) => {
        if (err) console.log(err)
      if (!response) return
      this.send(channel, `💬  |  ${response}`)
    })
  }
}
module.exports = CleverIO
