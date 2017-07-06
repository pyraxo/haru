const logger = require('winston')
const { Command, Permitter } = require('../../core')

class Autorole extends Command {
  constructor (...args) {
    super(...args, {
      name: 'autorole',
      description: 'Add a role to a user on join',
      usage: [
        { name: 'action', displayName: ' add | remove', type: 'string', optional: true }],
      subcommands: {
        add: {
          usage: [
            { name: 'role', type: 'role', optional: false }
          ]
        },
        remove: {
          aliases: ['delete']
        }
      },
      options: { guildOnly: true, localeKey: 'settings', modOnly: true }
    })
  }


  async handle ({ msg, data, settings }, responder) {
    try {
      if (settings.autorole.name === null) {
        return responder.format('emoji:info').reply('{{autorole.none}}')
      }
      return responder.format('emoji:info').reply('{{autorole.current}}', { role: `**${settings.autorole.name}**` })
    } catch (err) {
      logger.error(`Could not ${cmd} for ${msg.channel.guild.name} (${msg.channel.guild.id}) - ${err}`)
      return responder.error()
    }
  }

  async add ({ msg, args, data, settings }, responder) {
    try {
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

  async remove ({ msg, data, settings }, responder) {
    try {
      settings.autorole.id = null
      settings.autorole.name = null
      await settings.save()
      return responder.success('{{autorole.none}}')
    } catch (err) {
      logger.error(`Cound not ${cmd} for ${msg.channel.guild.name} (${msg.channel.guild.id}) - ${err}`)
      return responder.error()
    }
  }
  
}

module.exports = Autorole
