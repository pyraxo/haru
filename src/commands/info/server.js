const moment = require('moment-timezone')
const { Command } = require('../../core')

class ServerInfo extends Command {
  constructor (...args) {
    super(...args, {
      name: 'server',
      aliases: ['serverinfo'],
      description: 'Displays information of the server',
      options: { guildOnly: true }
    })
  }

  handle ({ msg, args, client, settings }, responder) {
    const guild = msg.guild
    const onlineMembers = guild.members.filter(member => member.status !== 'offline').length
    const owner = guild.members.get(guild.ownerID).user

    return responder.embed({
      color: this.colours.blue,
      author: { name: guild.name, icon_url: guild.iconURL },
      thumbnail: { url: guild.iconURL },
      fields: [
        { name: 'ID', value: guild.id, inline: true },
        { name: responder.t('{{shard}}'), value: guild.shard.id, inline: true },
        { name: responder.t('{{defaultChannel}}'), value: guild.defaultChannel.mention, inline: true },
        { name: responder.t('{{region}}'), value: guild.region, inline: true },
        { name: `${responder.t('{{members}}')} (${guild.memberCount})`, value: `${onlineMembers} ${responder.t('{{online}}')}`, inline: true },
        {
          name: `${responder.t('{{channels}}')} (${guild.channels.size})`,
          value: [
            `${responder.t('{{text}}')}: **${guild.channels.filter(c => c.type === 0).length}**`,
            `${responder.t('{{voice}}')}: **${guild.channels.filter(c => c.type !== 0).length}**`
          ].join('\n'),
          inline: true
        },
        {
          name: responder.t('{{owner}}'),
          value: `**${owner.username}#${owner.discriminator}** (${guild.ownerID})`
        },
        {
          name: responder.t('{{createdOn}}'),
          value: moment(new Date(guild.createdAt)).tz(`${settings.tz}`).format('ddd Do MMM, YYYY [at] hh:mm:ss a')
        },
        {
          name: `${responder.t('{{roles}}')} (${guild.roles.size})`,
          value: guild.roles.map(r => r.name).join(', ')
        }

      ]
    }).send()
  }
}

module.exports = ServerInfo
