const { Command } = require('sylphy')

class Battle extends Command {
  constructor (...args) {
    super(...args, {
      name: 'battle',
      description: 'Fight other users\' companions',
      cooldown: 5,
      usage: [
        { name: 'action', displayName: '@user | accept | reject', types: ['member', 'string'] }
      ],
      options: { localeKey: 'companion', guildOnly: true },
      group: 'games'
    })

    this.respondTime = 60
    this.entryFee = 500
  }

  async handle (container, responder) {
    const { msg, plugins, settings, args, rawArgs, modules } = container
    const User = plugins.get('db').data.models.User
    const companions = modules.get('companions')
    if (!companions) {
      return this.logger.error('Companions module not found')
    }
    const userProfile = await User.fetchJoin(msg.author.id, { companion: true })
    if (!userProfile.companion) {
      return responder.error('{{noPet}}', { command: `**\`${settings.prefix}companion buy\`**` })
    }

    if (['accept', 'reject', 'cancel'].includes(rawArgs[0])) {
      return this[rawArgs[0]](container, responder, companions)
    }

    if (args.action[0].status === 'offline') {
      return responder.error('{{errors.notOnline}}')
    }

    const opp = args.action[0].user
    if (!opp) {
      return responder.error('{{errors.noUser}}')
    }

    if (opp.id === msg.author.id) return responder.error('{{errors.self}}')

    if (userProfile.credits < this.entryFee) {
      return responder.error('{{errors.cantPlay}}', {
        amount: `**${this.entryFee}**`,
        balance: `**${userProfile.credits}**`
      })
    }
    const oppProfile = await User.fetch(opp.id)
    if (!oppProfile.companion) return responder.error('{{errors.opponentNoCompanion}}')
    if (oppProfile.credits < this.entryFee) return responder.error('{{errors.cantChallenge}}')

    try {
      await companions.initBattle(msg.author, opp, msg.channel, settings, responder, this.respondTime, this.entryFee)
      return responder.format('emoji:atk').reply('{{challenge}}', {
        mention: opp.mention,
        time: `**${this.respondTime}**`,
        accept: `**\`${settings.prefix}battle accept\`**`,
        reject: `**\`${settings.prefix}battle reject\`**`
      })
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(`Error creating battle - ${err}`)
        return responder.error('{{%ERROR}}')
      }
      return responder.error(`{{errors.${err}}}`)
    }
  }

  async accept ({ msg, client, settings, data }, responder, companions) {
    const battle = companions.getBattle(msg.channel)
    if (!battle || battle.p2 !== msg.author.id) return responder.error('{{errors.noIncoming}}')
    if (battle.state !== 1) return responder.error('{{errors.userInBattle}}')
    try {
      const p1 = await data.User.fetch(battle.p1)
      const p2 = await data.User.fetch(battle.p2)

      p1.credits -= this.entryFee
      p2.credits -= this.entryFee

      await p1.save()
      await p2.save()
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(`Error deducting entry fee - ${err}`)
        return responder.error('{{%ERROR}}')
      }
      return responder.error(`{{errors.${err}}}`)
    }

    companions.updateBattle(msg.channel, 2)
    return responder.format('emoji:success').send('{{acceptChallenge}}', {
      p1: client.users.get(battle.p1).mention,
      p2: msg.author.mention,
      time: `**${this.respondTime}**`,
      command: `**\`${settings.prefix}bet <amount> <user>\`**`
    })
  }

  reject ({ msg, client }, responder, companions) {
    const battle = companions.getBattle(msg.channel)
    if (!battle || battle.p2 !== msg.author.id) return responder.error('{{errors.noIncoming}}')
    if (battle.state !== 1) return responder.error('{{errors.userInBattle}}')
    companions.updateBattle(msg.channel, 0)
    return responder.format('emoji:rooster').send('{{rejectChallenge}}', {
      p1: client.users.get(battle.p1).mention,
      p2: msg.author.mention
    })
  }

  cancel ({ msg, client }, responder, companions) {
    const battle = companions.getBattle(msg.channel)
    if (!battle || battle.p1 !== msg.author.id) return responder.error('{{errors.noOutgoing}}')
    if (battle.state !== 1) return responder.error('{{errors.userInBattle}}')
    companions.updateBattle(msg.channel, 0)
    return responder.format('emoji:rooster').send('{{cancelChallenge}}', {
      p2: client.users.get(battle.p2).mention,
      p1: msg.author.mention
    })
  }
}

module.exports = [ Battle ]
