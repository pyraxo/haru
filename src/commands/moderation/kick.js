const { Command } = require('sylphy')

const phrases = [
  'ur kikke',
  'haru u r cute',
  'where are my pineapples',
  'owo whats this?'
]

class Kick extends Command {
  constructor (...args) {
    super(...args, {
      name: 'kick',
      description: 'Kicks a user',
      usage: [
        { name: 'member', type: 'member', optional: false },
        { name: 'reason', displayName: '[reason]', last: true, type: 'string', optional: true }
      ],
      options: { guildOnly: true, localeKey: 'guilds', modOnly: true },
      group: 'moderation'
    })
  }

  async handle ({ msg, args, settings, client }, responder) {
    const member = (await responder.selection(args.member, { mapFunc: m => `${m.user.username}#${m.user.discriminator}` }))[0]
    if (!member) return
    if (member.id === msg.author.id) {
      return responder.error('{{kick.self}}')
    }

    const code = phrases[~~(Math.random() * phrases.length)]
    const reply = (await responder.format('emoji:exclamation').dialog([{
      prompt: '{{kick.dialog}}',
      input: { type: 'string', name: 'reply' }
    }], {
      user: `**${msg.author.username}**`,
      member: `**${member.user.username}#${member.user.discriminator}**`,
      quote: `**\`${code}\`**`,
      exit: '**`cancel`**',
      tries: 1
    })).reply
    if (reply.toLowerCase() !== code) {
      return responder.error('{{kick.exit}}')
    }
    try {
      const channel = await client.getDMChannel(member.id)
      await this.send(channel, [
        `👢  |  You have been kicked from **\`${msg.channel.guild.name}\`**\n`,
        `**Reason**: ${args.reason}`
      ].join('\n'))
      await msg.channel.guild.kickMember(member.id, args.reason)
      client.emit('haruMemberKicked', msg.channel.guild, member.user, args.reason)
      return responder.format('emoji:boot').reply('{{kick.msg}}', {
        member: `**${member.user.username}#${member.user.discriminator}**`,
        deleteDelay: 5000
      })
    } catch (err) {
      this.logger.error(err)
      return responder.error('{{kick.exitError}}')
    }
  }
}

module.exports = Kick
