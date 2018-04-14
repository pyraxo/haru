const { Command } = require('sylphy')

class Skip extends Command {
  constructor (...args) {
    super(...args, {
      name: 'skip',
      description: 'Skips the current music track',
      cooldown: 5,
      options: { guildOnly: true, localeKey: 'music' },
      usage: [{ name: 'id', type: 'int', optional: true, min: 1 }],
      group: 'music'
    })
  }

  async handle ({ msg, settings, client, modules, args }, responder) {
    const music = modules.get('music')
    if (!music) return
    const conn = music.getConnection(msg.channel)
    if (!conn) {
      return responder.error('{{errors.notInChannel}}', {
        command: `**\`${settings.prefix}summon\`**`
      })
    }
    if (msg.member.voiceState.channelID !== conn.channelID) {
      return responder.error('{{errors.notInSameVoice}}', {
        channel: `'**${client.getChannel(conn.channelID).name}**'`
      })
    }
    const chan = music.getBoundChannel(msg.channel.guild.id)
    if (chan && chan !== msg.channel.id) {
      return responder.error('{{errors.notChannel}}', {
        channel: client.getChannel(chan).mention,
        deleteDelay: 5000
      })
    }
    if (args.id) {
      try {
        const video = await music.queue.remove(msg.channel.guild.id, args.id - 1)
        if (!video) {
          return responder.error('{{errors.skipNotFound}}')
        }
        return responder.success('{{skipSuccess}}', { song: `**${video.title}**` })
      } catch (err) {
        this.logger.error(`Error skipping video ${args.id - 1} for ${msg.channel.guild.name} (${msg.channel.guild.name})`, err)
        return responder.error()
      }
    }
    const voiceChannel = client.getChannel(conn.channelID)
    return music.skip(msg.channel.guild.id, voiceChannel, msg.author.id, msg.member.permission.has('manageGuild'))
    .then(res => {
      if (typeof res === 'string') return responder.success(`{{${res}}}`)
    })
  }
}

module.exports = Skip
