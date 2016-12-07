const moment = require('moment-timezone')
const { Command } = require('../../core')

class Whois extends Command {
  constructor (...args) {
    super(...args, {
      name: 'whois',
      aliases: ['uinfo', 'user'],
      description: 'Displays information of a user',
      usage: [
        { name: 'member', type: 'member', optional: true }
      ]
    })
  }

  async handle ({ msg, args, client, settings }, responder) {
    let member = msg.member
    if (args.member) {
      const [, idx] = await responder.selection(args.member.map(m => `${m.user.username}#${m.user.discriminator}`))
      if (typeof idx !== 'number') return
      member = args.member[idx]
    }

    const roleNames = member.roles.map(r => msg.channel.guild.roles.get(r).name)
    const sharedServers = client.guilds.filter(g => g.members.get(member.id)).map(g => g.name) || responder.t('{{none}}')

    return responder.embed({
      color: this.colours.blue,
      author: { name: `${member.user.username}#${member.user.discriminator}`, icon_url: member.user.avatarURL },
      description: member.game ? `${responder.t('{{playing}}')} **${member.game.name}**` : null,
      thumbnail: { url: member.user.avatarURL },
      fields: [
        { name: 'ID', value: member.id, inline: true },
        { name: responder.t('{{status}}'), value: member.status || responder.t('{{none}}'), inline: true },
        {
          name: `${responder.t('{{roles}}')}  (${roleNames.length})`,
          value: roleNames.length > 0 ? roleNames.join(', ') : responder.t('{{none}}'),
          inline: true
        },
        { name: responder.t('{{nick}}'), value: member.nick || responder.t('{{none}}'), inline: true },
        {
          name: `${responder.t('{{shared}}')} (${sharedServers.length})`,
          value: [
            sharedServers.splice(0, 5).join('\n'),
            sharedServers.length > 5 ? responder.t('{{more}}', { num: sharedServers.length - 5 }) : ''
          ].join('\n')
        },
        {
          name: responder.t('{{createdOn}}'),
          value: moment(new Date(member.user.createdAt)).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a'),
          inline: false
        },
        {
          name: responder.t('{{joinedOn}}'),
          value: moment(new Date(member.joinedAt)).tz(settings.tz).format('ddd Do MMM, YYYY [at] hh:mm:ss a'),
          inline: false
        }
      ]
    }).send()
  }
}

module.exports = Whois
