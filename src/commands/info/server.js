const moment = require('moment-timezone')
const { Command } = require('../../core')

class ServerInfo extends Command {
  constructor (...args) {
    super(...args, {
      name: 'server',
      aliases: ['serverinfo'],
      description: 'Displays information of the server',
      options: { guildOnly: true, localeKey: 'infocmd', botPerms: ['embedLinks'] }
    })
  }

  handle ({ msg, args, client, settings }, responder) {
    const guild = msg.channel.guild
    const onlineMembers = guild.members.filter(member => member.status !== 'offline').length
    const owner = guild.members.get(guild.ownerID).user

    return responder.embed({
      color: this.colours.blue,
      author: { name: guild.name, icon_url: guild.iconURL },
      thumbnail: { url: guild.iconURL },
      fields: [
        { name: 'ID', value: guild.id, inline: true },
        { name: responder.t('{{server.shard}}'), value: guild.shard.id, inline: true },
        { name: responder.t('{{server.defaultChannel}}'), value: guild.defaultChannel.mention, inline: true },
        { name: responder.t('{{server.region}}'), value: guild.region, inline: true },
        { name: `${responder.t('{{server.members}}')} (${guild.memberCount})`, value: `${onlineMembers} ${responder.t('{{server.online}}')}`, inline: true },
        {
          name: `${responder.t('{{server.channels}}')} (${guild.channels.size})`,
          value: [
            `${responder.t('{{server.text}}')}: **${guild.channels.filter(c => c.type === 0).length}**`,
            `${responder.t('{{server.voice}}')}: **${guild.channels.filter(c => c.type !== 0).length}**`
          ].join('\n'),
          inline: true
        },
        {
          name: responder.t('{{server.owner}}'),
          value: `**${owner.username}#${owner.discriminator}** (${guild.ownerID})`
        },
        {
          name: responder.t('{{server.createdOn}}'),
          value: moment(guild.createdAt).locale(settings.lang).tz(`${settings.tz}`).format('ddd Do MMM, YYYY [at] hh:mm:ss a')
        },
        {
          name: `${responder.t('{{server.roles}}')} (${guild.roles.size})`,
          value: guild.roles.map(r => r.name).join(', ')
        }

      ]
    }).send()
  }
}

module.exports = ServerInfo
