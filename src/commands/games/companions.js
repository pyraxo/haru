const logger = require('winston')
const { Command, utils, padEnd } = require('sylphy')

class Companions extends Command {
  constructor (...args) {
    super(...args, {
      name: 'companion',
      description: 'Animal companion system',
      usage: [{ name: 'action', displayName: 'buy | rename | peek | feed', type: 'string', optional: true }],
      aliases: ['pet'],
      cooldown: 5,
      subcommands: {
        buy: 'buy',
        peek: {
          usage: [{ name: 'user', type: 'member', optional: false }],
          options: { guildOnly: true }
        },
        rename: 'rename',
        feed: {
          usage: [{ name: 'amount', type: 'int', optional: true }]
        }
      },
      options: { botPerms: ['embedLinks'] },
      group: 'games'
    })
  }

  async handle ({ msg, plugins, settings, trigger }, responder) {
    const User = plugins.get('db').data.User
    const companion = (await User.fetchJoin(msg.author.id, { companion: true })).companion
    if (!companion) {
      responder.error('{{noPet}}', { command: `**\`${settings.prefix}${trigger} buy\`**` })
      return
    }
    const stats = companion.stats || {}
    responder.embed({
      color: utils.getColour('blue'),
      author: { name: responder.t('{{definitions.info}}'), icon_url: msg.author.avatarURL },
      description: `**\`LVL ${Math.floor(Math.cbrt(companion.xp)) || 0}\`** :${companion.type}:  ${companion.name}`,
      fields: [
        { name: responder.t('{{definitions.wins}}'), value: stats.wins || 0, inline: true },
        { name: responder.t('{{definitions.losses}}'), value: stats.losses || 0, inline: true },
        { name: responder.t('{{definitions.mood}}'), value: companion.mood || 10, inline: true},
        { name: responder.t('{{definitions.hunger}}'), value: companion.hunger || 10, inline: true}
      ]
    }).send()
  }

  async feed ({ msg, plugins, args }, responder) {
    const User = plugins.get('db').data.User
    const user = await User.fetch(msg.author.id)
    const companion = (await User.fetchJoin(msg.author.id, { companion: true })).companion
    if (!companion) {
      responder.error('{{noPet}}', { command: `**\`${settings.prefix}${trigger} buy\`**` })
      return
    }
    const amount = args.amount || 1
    if ((companion.hunger + amount) > 10) {
      responder.error('{{tooHungry}}', {amount: `**${amount}**`})
      return
    }
    if (user.petfood < amount) {
      responder.error('{{notEnoughFood}}', {
        amount: `**${amount}**`,
        inv: `**${user.petfood}**`,
        animal: `:${companion.type}:`
      })
      return
    }
    const code = ~~(Math.random() * 8999) + 1000
    const arg = await responder.format('emoji:info').dialog([{
      prompt: '{{food}}',
      input: { type: 'string', name: 'code' }
    }], {
      author: `**${msg.author.username}**`,
      animal: `:${companion.type}:`,
      amount: `**${amount}**`,
      code: `**\`${code}\`**`
    })
    if (parseInt(arg.code, 10) !== code) {
      return responder.error('{{invalidCode}}')
    }
    if ((companion.mood + amount) > 10) {
      companion.mood = 10
    } else {
      companion.mood += amount
    }
    companion.hunger += amount
    try {
      await user.saveAll()
      await User.update(user.id, user)
    } catch (err) {
      this.logger.error(`Could not save after companion feeding: ${err}`)
      return responder.error('{{error}}')
    }
    responder.format('emoji:success').send('{{petFed}}', {
      author: `**${msg.author.username}**`,
      animal: `:${companion.type}:`,
      amount: `**${amount}**`
    })
  }

  async peek ({ args, plugins }, responder) {
    const User = plugins.get('db').data.User
    const [member] = await responder.selection(args.user, { mapFunc: m => `${m.user.username}#${m.user.discriminator}` })
    if (!member) return
    const companion = (await User.fetchJoin(member.user.id, { companion: true })).companion
    if (!companion) {
      responder.error('{{errors.opponentNoCompanion}}')
      return
    }
    const stats = companion.stats || {}
    responder.embed({
      color: utils.getColour('blue'),
      author: { name: responder.t('{{definitions.info}}'), icon_url: member.user.avatarURL },
      description: `**\`LVL ${Math.floor(Math.cbrt(companion.xp)) || 0}\`** :${companion.type}:  ${companion.name}`,
      fields: [
        { name: responder.t('{{definitions.wins}}'), value: stats.wins || 0, inline: true },
        { name: responder.t('{{definitions.losses}}'), value: stats.losses || 0, inline: true },
        { name: responder.t('{{definitions.mood}}'), value: companion.mood || 10, inline: true},
        { name: responder.t('{{definitions.hunger}}'), value: companion.hunger || 10, inline: true}
      ]
    }).send()
  }

  async rename ({ msg, settings, plugins, modules }, responder) {
    const User = plugins.get('db').data.User
    const companions = modules.get('companions')
    if (!companions) return this.logger.error('Companions module not found')
    const user = await User.fetchJoin(msg.author.id, { companion: true })
    if (!user.companion) {
      responder.error('{{noPet}}', { command: `**\`${settings.prefix}companion buy\`**` })
      return
    }
    const arg = await responder.format('emoji:pencil2').dialog([{
      prompt: '{{renameDialog}}',
      input: { type: 'string', name: 'newName', max: 100 }
    }], {
      pet: `:${user.companion.type}: "**${user.companion.name}**"`,
      user: `**${msg.author.username}**`
    })

    user.companion.name = arg.newName
    try {
      await user.saveAll({ companion: true })
      User.update(user.id, user)
    } catch (err) {
      this.logger.error(`Could not save after companion rename: ${err}`)
      return responder.error('{{error}}')
    }
    responder.success('{{renameSuccess}}', {
      pet: `:${user.companion.type}:`,
      newName: `"**${arg.newName}**"`
    })
  }

  async buy ({ msg, settings, plugins, modules }, responder) {
    const db = plugins.get('db')
    const companions = modules.get('companions')
    if (!companions) return this.logger.error('Companions module not found')
    const user = await db.data.User.fetchJoin(msg.author.id, { companion: true })
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

    const pets = Object.keys(companions.pets[0])
    const reactions = modules.get('reactions')
    if (!reactions) return
    const input = this.resolver

    const message = await responder.format('emoji:info').send([
      '**{{intro}}**',
      '```markdown',
      pets.map((c, i) => `${padEnd(`[${i + 1}]:`, 4)} :${c}:`).join('\n'),
      '> {{%menus.INPUT}}',
      '```'
    ], { user: msg.author.username, cancel: 'cancel' })
    const collector = plugins.get('middleware').collect({
      channel: msg.channel.id,
      author: msg.author.id,
      time: 30
    })
    const awaitMessage = async (msg) => {
      try {
        var ans = await collector.next()
        if (ans.content.toLowerCase() === 'cancel') return Promise.resolve()
        try {
          return await input.resolve(ans, [ans.cleanContent], {}, {
            type: 'int', name: 'reply', min: 1, max: pets.length
          })
        } catch (err) {
          const re = await responder.format('emoji:error').send(
            `${err.err || err.message || err || '{{%menus.ERROR}}'}\n\n{{%menus.EXIT}}`,
            Object.assign(err, { cancel: '`cancel`' })
          )
          return awaitMessage(re)
        }
      } catch (err) {
        return Promise.reject(err)
      } finally {
        this.deleteMessages(msg, ans)
      }
    }

    try {
      var choice = await Promise.race([
        awaitMessage(message),
        reactions.addMenu(message, msg.author.id, pets)
      ])
    } catch (err) {
      if (typeof err !== 'undefined') {
        if (!err.reason) return responder.error()
        return responder.error(`{{%menus.ERRORED}} **{{%collector.${err.reason}}}**`, {
          [err.reason]: err.arg, err: `**${err.reason}**`
        })
      } else {
        return responder.success('{{%menus.EXITED}}')
      }
    } finally {
      collector.stop()
      reactions.menus.delete(message.id)
    }

    if (!choice) return responder.success('{{%menus.EXITED}}')
    choice = choice.reply ? pets[choice.reply - 1] : choice

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
      return responder.error('{{invalidCode}}')
    }
    user.credits -= companions.prices[0]
    const companion = new db.models.Companion({
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
    } catch (err) {
      this.logger.error(`Could not save after companion purchase`, err)
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

class PetFeed extends Companions {
  constructor (...args) {
    super(...args, {
      name: 'feedpet',
      description: 'Feeds your personal companion',
      options: { localeKey: 'companion' },
      aliases: [],
      usage: [{ name: 'amount', type: 'int', optional: true }],
      subcommand: 'feed'
    })
  }
}

module.exports = [ Companions, PetBuy, PetFeed ]
