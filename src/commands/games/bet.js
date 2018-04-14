const { Command } = require('sylphy')

class Bet extends Command {
  constructor (...args) {
    super(...args, {
      name: 'bet',
      description: 'Places bets during battles',
      cooldown: 5,
      usage: [
        { name: 'amount', type: 'int', optional: false },
        { name: 'member', type: 'member', optional: false }
      ],
      options: {
        localeKey: 'companion',
        guildOnly: true
      },
      group: 'games'
    })
  }

  async handle ({ msg, settings, plugins, args, rawArgs, modules }, responder) {
    const companions = modules.get('companions')
    const User = plugins.get('db').data.User
    if (!companions) {
      return this.logger.error('Companions module not found')
    }

    const [member] = await responder.selection(args.member, { mapFunc: m => `${m.user.username}#${m.user.discriminator}` })
    if (!member) return
    const battle = companions.getBattle(msg.channel.id)
    if (!battle) return responder.error('{{errors.noBattle}}')
    if (battle.p1 === msg.author.id || battle.p2 === msg.author.id) {
      return responder.error('{{errors.isParticipant}}')
    }
    if (battle.p1 !== member.id && battle.p2 !== member.id) {
      return responder.error('{{errors.notParticipating}}')
    }

    const balance = (await User.fetch(msg.author.id)).credits
    let amount = args.amount > 1000 ? 1000 : args.amount
    if (balance < amount) {
      return responder.error('{{errors.cantBet}}', {
        amount: `**${amount}**`,
        balance: `**${balance}**`
      })
    }
    const pet = (await User.fetch(member.id)).companion
    if (amount < 1) return responder.error('{{errors.plsBetProperly}}')
    try {
      await companions.placeBet(msg.channel.id, member.id, msg.author.id, amount)
      responder.format('emoji:info').reply('{{bet}}', {
        amount: `**${amount}**`,
        user: `**${member.username}**`,
        pet: `:${pet.type}:  **${pet.name}**!`
      })
    } catch (err) {
      return responder.error(`{{errors.${err}}}`)
    }
  }
}

module.exports = Bet
