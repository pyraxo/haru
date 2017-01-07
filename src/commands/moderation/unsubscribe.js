const logger = require('winston')
const { Command } = require('../../core')

class Unsubscribe extends Command {
  constructor (...args) {
    super(...args, {
      name: 'unsubscribe',
      aliases: ['unsub'],
      description: 'Unsubscribes a channel from an event',
      usage: [{
        name: 'event',
        displayName: '<events>',
        separator: ' | ',
        type: 'list',
        optional: false,
        last: true,
        unique: true
      }],
      options: { guildOnly: true, localeKey: 'settings', botPerms: ['embedLinks'], permissions: ['manageGuild'] }
    })
  }

  async handle ({ msg, args, client, settings }, responder) {
    const events = ['ban', 'kick', 'join', 'leave', 'nick', 'roles']
    const unknownEvent = args.event.find(e => !events.includes(e))
    if (unknownEvent) {
      return responder.error('{{subscribe.eventNotFound}}', {
        event: `**\`${unknownEvent}\`**`,
        events: events.map(e => `**\`${e}\`**`).join(', ')
      })
    }
    for (const event of args.event) {
      if (!settings.events) {
        settings.events = {}
      }
      if (!settings.events[event]) {
        settings.events[event] = []
      }
      settings.events[event].splice(settings.events[event].indexOf(event), 1)
    }
    try {
      await settings.save()
      return responder.success('{{subscribe.unsubSuccess}}', {
        channel: `**#${msg.channel.name}**`,
        events: args.event.map(e => `**\`${e}\`**`).join(', ')
      })
    } catch (err) {
      logger.error(`Error saving unsubscribed events for #${msg.channel.name} (${msg.channel.id}) in ${msg.guild.name} (${msg.guild.id})`)
      logger.error(err)
      return responder.error()
    }
  }
}

module.exports = Unsubscribe
