const logger = require('winston')
const { Command } = require('../../core')

class Companions extends Command {
  constructor (...args) {
    super(...args, {
      name: 'companion',
      description: 'Animal companion system',
      usage: [{ name: 'action', displayName: 'buy | rename', type: 'string', optional: true }],
      aliases: ['pet'],
      cooldown: 5,
      subcommands: {
        buy: 'buy',
        rename: 'rename'
      },
      options: { perms: ['embedLinks'] }
    })
  }

  async handle ({ msg, data, settings, trigger }, responder) {
    const companion = (await data.User.fetchJoin(msg.author.id, { companion: true })).companion
    if (!companion) {
      responder.error('{{noPet}}', { command: `**\`${settings.prefix}${trigger} buy\`**` })
      return
    }
    const stats = companion.stats || {}
    responder.embed({
      color: this.colours.blue,
      author: { name: responder.t('{{definitions.info}}'), icon_url: msg.author.avatarURL },
      description: `**\`LVL ${Math.floor(Math.cbrt(companion.xp)) || 0}\`** :${companion.type}:  ${companion.name}`,
      fields: [
        { name: responder.t('{{definitions.wins}}'), value: stats.wins || 0, inline: true },
        { name: responder.t('{{definitions.losses}}'), value: stats.losses || 0, inline: true }
      ]
    }).send()
  }

  async rename ({ msg, settings, data, db }, responder) {
    const companions = this.bot.engine.modules.get('companions')
    if (!companions) return logger.error('Companions module not found')
    const user = await data.User.fetchJoin(msg.author.id, { companion: true })
    if (!user.companion) {
      responder.error('{{noPet}}', { command: `**\`${settings.prefix}companion buy\`**` })
      return
    }
    const arg = await responder.format('emoji:pencil2').dialog([{
      prompt: '{{renameDialog}}',
      input: { type: 'string', name: 'newName', maxLength: 20 }
    }], {
      pet: `:${user.companion.type}: "**${user.companion.name}**"`,
      user: `**${msg.author.username}**`
    })

    user.companion.name = arg.newName
    try {
      await user.saveAll({ companion: true })
      data.User.update(user.id, user)
    } catch (err) {
      logger.error(`Could not save after companion rename: ${err}`)
      return responder.error('{{error}}')
    }
    responder.success('{{renameSuccess}}', {
      pet: `:${user.companion.type}:`,
      newName: `"**${arg.newName}**"`
    })
  }

  async buy ({ msg, settings, data, db }, responder) {
    const companions = this.bot.engine.modules.get('companions')
    if (!companions) return logger.error('Companions module not found')
    const user = await data.User.fetchJoin(msg.author.id, { companion: true })
    if (user.companion) {
      responder.error('{{ownedPet}}')
      return
    }
    if (user.credits < companions.prices[0]) {
      responder.error('{{cannotAfford}}', {
        amount: `**${companions.prices[0]}**`,
        balance: `**${user.credits}**`
      })
      return
    }
    const reactions = this.bot.engine.modules.get('reactions')
    if (!reactions) return
    const message = await responder.format('emoji:info').send('**{{intro}}**', { user: msg.author.username })
    const choice = await reactions.addMenu(message, msg.author.id, Object.keys(companions.pets[0]))

    const code = ~~(Math.random() * 8999) + 1000
    const arg = await responder.format('emoji:info').dialog([{
      prompt: '{{dialog}}',
      input: { type: 'string', name: 'code' }
    }], {
      author: `**${msg.author.username}**`,
      animal: `:${choice}:`,
      amount: `**${companions.prices[0]}**`,
      code: `**\`${code}\`**`
    })
    if (parseInt(arg.code, 10) !== code) {
      responder.error('{{invalidCode}}')
      return
    }
    user.credits -= companions.prices[0]
    const companion = new db.Companion({
      id: msg.author.id,
      name: responder.t('{{definitions.info2}}', {
        author: msg.author.username
      }),
      type: choice
    })
    user.companion = companion

    try {
      await companion.save()
      await user.saveAll({ companion: true })
      await data.User.update(user.id, user)
    } catch (err) {
      logger.error(`Could not save after companion purchase: ${err}`)
      return responder.error('{{error}}')
    }
    responder.format('emoji:success').send('{{result}}', {
      author: `**${msg.author.username}**`,
      animal: `:${choice}:`,
      balance: `:credits: **${user.credits}**`,
      command: `**\`${settings.prefix}companion rename\`**`
    })
  }
}

class PetBuy extends Companions {
  constructor (...args) {
    super(...args, {
      name: 'buypet',
      description: 'Purchases your personal companion',
      options: { localeKey: 'companion' },
      aliases: [],
      usage: [],
      subcommand: 'buy'
    })
  }
}

module.exports = [ Companions, PetBuy ]
