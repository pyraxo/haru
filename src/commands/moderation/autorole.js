const logger = require('winston')
const { Command, Permitter } = require('../../core')

class Autorole extends Command {
  constructor (...args) {
    super(...args, {
      name: 'autorole',
      description: 'Add a role to a user on join',
      usage: [
        { name: 'role', type: 'role', optional: true }
      ],
      options: { guildOnly: true, localeKey: 'settings', modOnly: true }
    })
  }


  async handle ({ msg, args, data, settings }, responder) {
    if (!args.role) {
      return responder.format('emoji:info').reply('{{autorole.current}}', { role: `**${settings.autorole.name}**` })
    }
    try {
      console.log(args.role);
      console.log(args.role[0].id);
      console.log(args.role[0].name);
      settings.autorole.id = args.role[0].id
      settings.autorole.name = args.role[0].name
      await settings.save()
      return responder.success('{{autorole.success}}', {
        role: `**\`${args.role[0].name}\`**`
      })
    } catch (err) {
      logger.error(`Could not ${cmd} for ${msg.channel.guild.name} (${msg.channel.guild.id}) - ${err}`)
      return responder.error()
    }
  }
}

module.exports = Autorole
