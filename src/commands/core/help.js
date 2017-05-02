const { padEnd } = require('../../core/util')
const { Command } = require('../../core')

class HelpMenu extends Command {
  constructor (...args) {
    super(...args, {
      name: 'help',
      description: 'Displays info on commands',
      aliases: ['h'],
      cooldown: 1,
      usage: [
        { name: 'command', type: 'command', optional: true }
      ]
    })
  }

  async handle ({ msg, commander, settings, args }, responder) {
    const prefix = settings.prefix
    if (args.command) {
      const command = args.command.cmd
      const name = command.labels[0]
      let desc = this.i18n.get(`descriptions.${name}`, settings.lang) ||
      this.i18n.get(`${command.localeKey}.description`, settings.lang) ||
      command.description || '{{noDesc}}'

      let reply = [
        `**\`${prefix}${name}\`**  __\`${desc}\`__\n`,
        `**{{definitions.usage}}**: ${prefix}${command.labels[0]} ${Object.keys(command.resolver.usage).map(usage => {
          usage = command.resolver.usage[usage]
          return usage.last ? usage.displayName : usage.optional ? `[${usage.displayName}]` : `<${usage.displayName}>`
        }).join(' ')}`
      ]
      if (command.labels.length > 1) {
        reply.push(`\n**{{definitions.aliases}}**: \`${command.labels.slice(1).join(' ')}\``)
      }
      if (command._help) {
        for (const key in command._help) {
          let val = command._help[key]
          val = val instanceof Array ? val.join(', ') : val
          reply.push(`\n**${this.i18n.get(`${command.localeKey}.${key}`, settings.lang) || key}**: ${command._help[key]}`)
        }
      }
      reply.push('\n{{footer_group}}')
      responder.send(reply.join('\n'))
      return
    }

    let maxPad = 10
    const commands = commander.unique().reduce((obj, c) => {
      if (c.cmd.labels[0] !== c.label || c.cmd.options.hidden || c.cmd.options.adminOnly) return obj
      const module = c.group
      const name = c.cmd.labels[0]

      let desc = this.i18n.get(`descriptions.${name}`, settings.lang) ||
      this.i18n.get(`${c.cmd.localeKey}.description`, settings.lang) ||
      c.cmd.description || '{{noDesc}}'

      if (name.length > maxPad) maxPad = name.length
      if (!Array.isArray(obj[module])) obj[module] = []
      obj[module].push([name, desc])
      return obj
    }, {})

    let toSend = []
    for (const mod in commands) {
      if (!commands[mod].length) continue
      toSend.push([
        `# ${mod}:`,
        commands[mod].map(c => `  ${padEnd(c[0], maxPad)} // ${c[1]}`).join('\n')
      ].join('\n'))
      if (toSend.length >= 5) {
        await responder.send(['**```glsl'].concat(toSend, '```**'), { DM: true })
        toSend = []
      }
    }
    if (toSend.length) await responder.send(['**```glsl'].concat(toSend, '```**'), { DM: true })

    return responder.send([
      `{{header_1}} ${prefix === process.env.CLIENT_PREFIX ? '' : '{{header_1_alt}}'}`,
      '{{header_2}}',
      '{{header_3}}',
      '{{footer}}'
    ], {
      DM: true,
      prefix: `\`${prefix}\``,
      defaultPrefix: `\`${process.env.CLIENT_PREFIX}\``,
      server: `**${msg.channel.guild ? msg.channel.guild.name : responder.t('{{pms}}')}**`,
      helpCommand: `\`${prefix}help <command>\``,
      exampleCommand: `\`${prefix}help credits\``,
      link: '**<https://discord.gg/vYMRRZF>**'
    })
    .then(m => {
      if (msg.channel.guild) {
        responder.format('emoji:inbox').reply('{{checkPMs}}')
      }
    })
  }
}

module.exports = HelpMenu
