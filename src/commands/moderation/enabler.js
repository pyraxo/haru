const { Command, Permitter } = require('sylphy')

class Enabler extends Command {
  constructor (...args) {
    super(...args, {
      name: 'enable',
      description: 'Enable a command for a channel, user or role',
      usage: [
        { name: 'context', types: ['member', 'channel', 'role'], optional: true, voice: false },
        { name: 'command', displayName: 'command', type: 'command', optional: true }
      ],
      options: { guildOnly: true, localeKey: 'settings', modOnly: true },
      group: 'moderation'
    })
  }

  getType (o) {
    if (o.type > -1) return 'channels'
    else if (o.user) return 'members'
    else return 'roles'
  }

  async handle ({ msg, args, data, settings, trigger }, responder) {
    const enable = trigger === 'enable'

    const cmd = args.command ? args.command.cmd.permissionNode : '*'
    const ctx = args.context
    ? Array.isArray(args.context)
    ? (await responder.selection(args.context, { mapFunc: o => {
      switch (this.getType(o)) {
        case 'channels': return '#' + o.name
        case 'members': return `${o.user.username}#${o.user.discriminator}`
        case 'roles': return o.name === '@everyone' ? 'everyone' : '@' + o.name
      }
    },
      cancel: 'cancel'
    }))[0]
    : args.context
    : msg.channel

    if (!ctx) return
    const type = this.getType(ctx)
    const everyone = type === 'roles' && ctx.name === '@everyone'

    ctx.id = everyone ? '*' : ctx.id
    const node = `${type === 'channels' ? ctx.id : '*'}.${type !== 'channels' ? ctx.id : '*'}.${cmd}`

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
            case 'roles': return `**${everyone ? '' : '@'}${ctx.name}**`
          }
        })(type)
      })
    } catch (err) {
      this.logger.error(`Could not ${trigger} ${cmd} for ${msg.channel.guild.name} (${msg.channel.guild.id}) -`, err)
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
        { name: 'context', types: ['member', 'channel', 'role'], optional: true, voice: false },
        { name: 'command', type: 'command', optional: true }
      ],
      options: { guildOnly: true, localeKey: 'settings', modOnly: true }
    })
  }
}

class Resetter extends Command {
  constructor (...args) {
    super(...args, {
      name: 'reset',
      description: 'Resets all permissions in the server',
      options: { guildOnly: true, localeKey: 'settings', modOnly: true }
    })
  }

  handle ({ msg, settings }, responder) {
    settings.permissions = {}
    return settings.save().then(() => responder.success('{{reset.success}}'), () => responder.error())
  }
}

module.exports = [ Enabler, Disabler, Resetter ]
