const moment = require('moment-timezone')
const { Command } = require('../../core')

class Whois extends Command {
  constructor (...args) {
    super(...args, {
      name: 'whois',
      aliases: ['uinfo', 'user'],
      description: 'Displays information of a user',
      usage: [{ name: 'member', type: 'member', optional: true }],
      options: { guildOnly: true, localeKey: 'infocmd', perms: ['embedLinks'] }
    })
  }

  async handle ({ msg, args, client, settings }, responder) {
    let member = msg.member
    if (args.member) {
      member = (await responder.selection(args.member, { mapFunc: m => `${m.user.username}#${m.user.discriminator}` }))[0]
      if (!member) return
    }

    const roleNames = member.roles.map(r => msg.channel.guild.roles.get(r).name)
    const sharedServers = client.guilds.filter(g => g.members.get(member.id)).map(g => g.name) || responder.t('{{whois.none}}')

    return responder.embed({
      color: this.colours.blue,
      author: { name: `${member.user.username}#${member.user.discriminator}`, icon_url: member.user.avatarURL },
      description: member.game ? `${responder.t('{{whois.playing}}')} **${member.game.name}**` : undefined,
      thumbnail: { url: member.user.avatarURL },
      fields: [
        { name: 'ID', value: member.id, inline: true },
        { name: responder.t('{{whois.status}}'), value: member.status || responder.t('{{whois.none}}'), inline: true },
        {
          name: `${responder.t('{{whois.roles}}')}  (${roleNames.length})`,
          value: roleNames.length > 0 ? roleNames.join(', ') : responder.t('{{whois.none}}'),
          inline: true
        },
        { name: responder.t('{{whois.nick}}'), value: member.nick || responder.t('{{whois.none}}'), inline: true },
        {
          name: `${responder.t('{{whois.shared}}')} (${sharedServers.length})`,
          value: [
            sharedServers.splice(0, 5).join('\n'),
            sharedServers.length > 5 ? responder.t('{{whois.more}}', { num: sharedServers.length - 5 }) : ''
          ].join('\n')
        },
        {
          name: responder.t('{{whois.createdOn}}'),
          value: moment(new Date(member.user.createdAt)).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a'),
          inline: false
        },
        {
          name: responder.t('{{whois.joinedOn}}'),
          value: moment(new Date(member.joinedAt)).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a'),
          inline: false
        }
      ]
    }).send()
  }
}

module.exports = Whois
