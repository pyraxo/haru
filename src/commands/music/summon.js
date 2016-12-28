const { Command } = require('../../core')
const logger = require('winston')

class Summon extends Command {
  constructor (...args) {
    super(...args, {
      name: 'summon',
      description: 'Summons me to a voice channel',
      cooldown: 5,
      options: { guildOnly: true, localeKey: 'music' }
    })
  }

  async handle ({ msg, settings, client, modules }, responder) {
    const music = modules.get('music')
    if (!music) return
    const member = msg.member
    const channel = member.voiceState.channelID
    if (channel === null) {
      return responder.error('{{errors.notInVoice}}')
    }
    const vc = msg.guild.channels.get(channel)

    if (!this.hasPermissions(vc, this.bot.user, 'voiceConnect')) {
      return responder.error('{{errors.noPerms}}', {
        voice: `**${vc.name}**`
      })
    }

    try {
      await music.connect(channel, msg.channel)
      return responder.format('emoji:headphones').send('{{joinSuccess}}', {
        voice: `**${vc.name}**`,
        text: msg.channel.mention,
        command: `**\`${settings.prefix}play\`**`
      })
    } catch (err) {
      if (err instanceof Error) {
        logger.error(`Could not join voice channel ${channel} in ${msg.guild.name} (${msg.guild.id}) - ${err}`)
        return
      }
      return responder.error(`{{errors.${err}}}`, {
        text: msg.guild.channels.get(music.getBoundChannel(msg.guild.id)).mention,
        voice: `**${vc.name}**`
      })
    }
  }
}

module.exports = Summon
