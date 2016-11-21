const { Command } = require('../../core')
const logger = require('winston')

class Summon extends Command {
  constructor (...args) {
    super(...args, {
      name: 'summon',
      description: 'Summons me to a voice channel',
      cooldown: 5
    })
  }

  async handle ({ msg, settings, client }, responder) {
    const music = this.bot.engine.modules.get('music')
    if (!music) return
    const member = msg.member
    const channel = member.voiceState.channelID
    if (channel === null) {
      responder.error('{{notInVoice}}')
      return
    }
    music.connect(channel, msg.channel).then(conn => {
      responder.format('emoji:headphones').send('{{success}}', {
        tags: {
          voice: `**${msg.guild.channels.find(c => c.id === channel).name}**`,
          text: msg.channel.mention,
          command: `**\`${settings.prefix}play\`**`
        }
      })
    }).catch(err => {
      if (err instanceof Error) {
        logger.error(`Could not join voice channel ${channel} in ${msg.guild.name} (${msg.guild.id}) - ${err}`)
        return
      }
      responder.error(`{{errors.${err}}}`, {
        tags: {
          text: msg.guild.channels.get(music.getBoundChannel(msg.guild.id)).mention,
          voice: `**${msg.guild.channels.find(c => c.id === channel).name}**`
        }
      })
    })
  }
}

module.exports = Summon
