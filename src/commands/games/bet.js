const logger = require('winston')
const { Command } = require('../../core')

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
      }
    })
  }

  async handle ({ msg, settings, data, args, rawArgs }, responder) {
    const companions = this.bot.engine.modules.get('companions')
    if (!companions) return logger.error('Companions module not found')

    const [, idx] = await responder.selection(args.member.map(m => `${m.user.username}#${m.user.discriminator}`))
    if (typeof idx !== 'number') return
    const member = args.member[idx]
    const battle = companions.getBattle(msg.channel.id)
    if (!battle) return responder.error('{{errors.noBattle}}')
    if (battle.p1 === msg.author.id || battle.p2 === msg.author.id) {
      return responder.error('{{errors.isParticipant}}')
    }
    if (battle.p1 !== member.id && battle.p2 !== member.id) {
      return responder.error('{{errors.notParticipating}}')
    }

    const balance = (await data.User.fetch(msg.author.id)).credits
    let amount = args.amount > 1000 ? 1000 : args.amount
    if (balance < amount) {
      return responder.error('{{errors.cantBet}}', {
        amount: `**${amount}**`,
        balance: `**${balance}**`
      })
    }
    const pet = (await data.User.fetchJoin(member.id, { companion: true })).companion
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
