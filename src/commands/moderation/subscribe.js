const logger = require('winston')
const { Command } = require('../../core')

class Subscribe extends Command {
  constructor (...args) {
    super(...args, {
      name: 'subscribe',
      aliases: ['sub'],
      description: 'Subscribes a channel to an event',
      usage: [{
        name: 'event',
        displayName: 'list | <event 1>, [event 2]...',
        separator: ', ',
        type: 'list',
        optional: false,
        last: true,
        unique: true
      }],
      options: { guildOnly: true, localeKey: 'settings', botPerms: ['embedLinks'], permissions: ['manageGuild'] }
    })
  }

  async handle ({ msg, args, client, settings }, responder) {
    if (args.event.length === 1 && args.event[0] === 'list') {
      if (!settings.events) {
        settings.events = {}
      }
      let subscribed = []
      for (const event in settings.events) {
        if (settings.events[event].includes(msg.channel.id)) {
          subscribed.push(event)
        }
      }
      if (!subscribed.length) {
        return responder.error('{{subscribe.notSubscribed}}', {
          channel: `**#${msg.channel.name}**`
        })
      }
      return responder.format('emoji:info').reply('{{subscribe.list}}', {
        channel: `**#${msg.channel.name}**`,
        events: subscribed.map(e => `**\`${e}\`**`).join(', ')
      })
    }
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
      settings.events[event].push(msg.channel.id)
    }
    try {
      await settings.save()
      return responder.success('{{subscribe.subSuccess}}', {
        channel: `**#${msg.channel.name}**`,
        events: args.event.map(e => `**\`${e}\`**`).join(', ')
      })
    } catch (err) {
      logger.error(`Error saving subscribed events for #${msg.channel.name} (${msg.channel.id}) in ${msg.channel.guild.name} (${msg.channel.guild.id})`)
      logger.error(err)
      return responder.error()
    }
  }
}

module.exports = Subscribe
