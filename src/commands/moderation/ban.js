const logger = require('winston')
const { Command } = require('../../core')

const phrases = [
  'ur banne',
  'haru u r beautiful',
  'i find durians visually appealing'
]

class Ban extends Command {
  constructor (...args) {
    super(...args, {
      name: 'ban',
      description: 'Bans a user',
      usage: [
        { name: 'member', type: 'member', optional: false },
        { name: 'reason', displayName: '[reason]', last: true, type: 'string', optional: true }
      ],
      options: { guildOnly: true, localeKey: 'guilds', permissions: ['manageGuild'] }
    })
  }

  async handle ({ msg, args, data, settings, client }, responder) {
    const member = (await responder.selection(args.member, { mapFunc: m => `${m.user.username}#${m.user.discriminator}` }))[0]
    if (!member) return
    if (member.id === msg.author.id) {
      return responder.error('{{ban.self}}')
    }

    const code = phrases[~~(Math.random() * phrases.length)]
    const reply = (await responder.format('emoji:exclamation').dialog([{
      prompt: '{{ban.dialog}}',
      input: { type: 'string', name: 'reply' }
    }], {
      user: `**${msg.author.username}**`,
      member: `**${member.user.username}#${member.user.discriminator}**`,
      quote: `**\`${code}\`**`,
      exit: '**`cancel`**',
      tries: 1
    })).reply
    if (reply.toLowerCase() !== code) {
      return responder.error('{{ban.exit}}')
    }
    try {
      await msg.channel.guild.banMember(member.id)
      client.emit('haruMemberBanned', msg.channel.guild, member.user, args.reason)
      return responder.format('emoji:hammer').reply('{{ban.msg}}', {
        member: `**${member.user.username}#${member.user.discriminator}**`,
        deleteDelay: 5000
      })
    } catch (err) {
      logger.error(err)
      return responder.error('{{ban.exitError}}')
    }
  }
}

module.exports = Ban
