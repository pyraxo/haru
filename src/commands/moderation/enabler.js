const logger = require('winston')
const { Command, Permitter } = require('../../core')

class Enabler extends Command {
  constructor (...args) {
    super(...args, {
      name: 'enable',
      description: 'Enable a command for a channel, user or role',
      usage: [
        { name: 'command', displayName: 'command', type: 'command', optional: false },
        { name: 'context', types: ['member', 'channel', 'role'], optional: true, voice: false },
        { name: 'isGuild', displayName: '--server', type: 'string', optional: true, choices: ['--server'] }
      ],
      options: { guildOnly: true, localeKey: 'settings', modOnly: true }
    })
  }

  getType (o) {
    if (o.type > -1) return 'channels'
    else if (o.user) return 'members'
    else return 'roles'
  }

  async handle ({ msg, args, data, settings, trigger }, responder) {
    const enable = trigger === 'enable' || trigger === 'allow'
    const isGuild = args.isGuild || trigger === 'ignore' || trigger === 'allow'

    const cmd = args.command ? args.command.cmd.permissionNode : '*'
    const ctx = args.context
    ? Array.isArray(args.context)
    ? (await responder.selection(args.context, { mapFunc: o => {
      switch (this.getType(o)) {
        case 'channels': return '#' + o.name
        case 'members': return `${o.user.username}#${o.user.discriminator}`
        case 'roles': return '@' + o.name
      } },
      cancel: 'cancel'
    }))[0]
    : args.context
    : msg.channel
    if (!ctx) return
    const type = this.getType(ctx)

    const node = (isGuild ? '*.' : '') +
    (type === 'channels' ? (ctx.id + '.') : '') +
    (type !== 'channels' ? (ctx.id + '.') : '') + cmd

    try {
      settings.permissions = Permitter[enable ? 'allow' : 'deny'](node, settings.permissions, ctx.id, type)
      await settings.save()
      const result = Permitter.check(node, settings.permissions)
      return responder.success('{{enabler.success}}', {
        action: responder.t(`{{enabler.actions.${
          result === true ? 'enable'
          : result === false ? 'disable'
          : 'revert'
        }}}`),
        command: `**'${cmd}'**`,
        context: (type => {
          switch (type) {
            case 'channels': return `**#${ctx.name}**`
            case 'members': return `**${ctx.user.username}**#${ctx.user.discriminator}`
            case 'roles': return `**@${ctx.name}**`
          }
        })(type)
      })
    } catch (err) {
      logger.error(`Could not ${trigger} ${cmd} for ${msg.guild.name} (${msg.guild.id}) - ${err}`)
      return responder.error()
    }
  }
}

class Disabler extends Enabler {
  constructor (...args) {
    super(...args, {
      name: 'disable',
      description: 'Disable a command for a channel, user or role',
      usage: [
        { name: 'command', type: 'command', optional: false },
        { name: 'context', types: ['member', 'channel', 'role'], optional: true, voice: false },
        { name: 'isGuild', displayName: '--server', type: 'string', optional: true, choices: ['--server'] }
      ],
      options: { guildOnly: true, localeKey: 'settings', modOnly: true }
    })
  }
}

class Allow extends Enabler {
  constructor (...args) {
    super(...args, {
      name: 'allow',
      description: 'Allows channels, users or roles to use commands again',
      usage: [
        { name: 'context', types: ['member', 'channel', 'role'], optional: true, voice: false },
        { name: 'command', type: 'command', optional: true }
      ],
      options: { guildOnly: true, localeKey: 'settings', modOnly: true }
    })
  }
}

class Ignore extends Enabler {
  constructor (...args) {
    super(...args, {
      name: 'ignore',
      description: 'Prevents channels, users or roles from using commands',
      usage: [
        { name: 'context', types: ['member', 'channel', 'role'], optional: true, voice: false },
        { name: 'command', type: 'command', optional: true }
      ],
      options: { guildOnly: true, localeKey: 'settings', modOnly: true }
    })
  }
}

module.exports = [ Enabler, Disabler, Ignore, Allow ]
