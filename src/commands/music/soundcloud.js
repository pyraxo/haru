const logger = require('winston')
const moment = require('moment')

const { Command } = require('../../core')

class Soundcloud extends Command {
  constructor (...args) {
    super(...args, {
      name: 'soundcloud',
      aliases: ['sc'],
      description: 'Plays songs from Soundcloud',
      usage: [{ name: 'query', optional: false }],
      cooldown: 10,
      options: { guildOnly: true, localeKey: 'music' }
    })
  }

  async handle ({ msg, settings, rawArgs, client, trigger, modules }, responder) {
    const music = modules.get('music')
    const searcher = modules.get('music:search')

    const conn = music.getConnection(msg.channel)
    if (!conn) {
      return responder.error('{{errors.notInChannel}}', { command: `**\`${settings.prefix}summon\`**` })
    }
    const chan = music.getBoundChannel(msg.channel.guild.id)
    if (chan && chan !== msg.channel.id) {
      return responder.error('{{errors.notChannel}}', {
        channel: client.getChannel(chan).mention,
        deleteDelay: 5000
      })
    }

    await responder.typing()

    return music.addSoundcloud(rawArgs.join('_'), msg)
  }
}

module.exports = Soundcloud
