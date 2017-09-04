const request = require('superagent')

const { Module } = require('sylphy')

class Cleverbot extends Module {
  constructor (...args) {
    super(...args, {
      name: 'cleverbot'
    })

    this.sessions = []
  }

  async respond (content, message, channel) {
    const nick = channel.id + message.author.id
    if (this.sessions.indexOf(nick) < 0) {
      try {
        var res = (await request.post('https://cleverbot.io/1.0/create').send({
          user: process.env['API_CLEVERBOT_USER'],
          key: process.env['API_CLEVERBOT_KEY'],
          nick: nick
        })).body
      } catch (err) {
        this.logger.error('Error initialising Cleverbot.io instance -', err)
        return
      }
      if (res.status === 'Error: reference name already exists' || res.status === 'success') {
        this.sessions.push(nick)
      } else {
        this.logger.error('Status with Cleverbot.io creation: ' + res.status)
        return
      }
    }
    try {
      var req = (await request.post('https://cleverbot.io/1.0/ask').send({
        user: process.env['API_CLEVERBOT_USER'],
        key: process.env['API_CLEVERBOT_KEY'],
        nick: nick,
        text: content
      })).body
      if (req.status !== 'success') {
        this.logger.error('Status with Cleverbot.io query: ' + req.status)
        return
      }
      return this.send(channel, `💬  |  ${req.response}`)
    } catch (err) {
      this.logger.error('Error querying Cleverbot.io -', err)
    }
  }
}

module.exports = Cleverbot
