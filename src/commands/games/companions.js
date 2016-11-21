const { MultiCommand } = require('../../core')

class Companions extends MultiCommand {
  constructor (...args) {
    super(...args, {
      name: 'companion',
      description: 'Animal companion system',
      aliases: ['pet'],
      cooldown: 5
    })

    this.registerSubcommands({
      buy: 'buy',
      battle: 'battle'
    }, 'default')

    this.pets = {
      tier_1: ['dog', 'cat', 'mouse', 'hamster', 'rabbit', 'chicken'],
      tier_2: ['fox', 'owl', 'wolf', 'koala', 'cow', 'pig'],
      tier_3: ['bear', 'tiger', 'lion', 'gorilla', 'boar']
    }

    this.prices = {
      tier_1: 10,
      tier_2: 5000,
      tier_3: 10000
    }
  }

  async default ({ msg, data, settings, trigger }, responder) {
    const companion = (await data.User.fetchJoin(msg.author.id, { companion: true })).companion
    if (!companion) {
      responder.error('{{noPet}}', { tags: { command: `**\`${settings.prefix}${trigger} buy\`**` } })
      return
    }
    const stats = companion.stats || {}
    responder.embed({
      color: this.colours.blue.int,
      author: { name: `Companion Info`, icon_url: msg.author.avatarURL },
      description: `**\`LVL 0\`** :${companion.type}:  ${companion.name}`,
      fields: [
        { name: 'Wins', value: stats.wins || 0, inline: true },
        { name: 'Losses', value: stats.losses || 0, inline: true }
      ]
    }).send()
  }

  async buy ({ msg, settings, data, db }, responder) {
    const user = await data.User.fetchJoin(msg.author.id, { companion: true })
    if (user.companion) {
      responder.error('{{ownedPet}}')
      return
    }
    if (user.credits < this.prices.tier_1) {
      responder.error('{{cannotAfford}}', { tags: {
        amount: `**${this.prices.tier_1}**`,
        balance: `**${user.credits}**`
      }})
      return
    }
    const reactions = this.bot.engine.modules.get('reactions')
    if (!reactions) return
    const message = await responder.format('emoji:info').send('**{{intro}}**', { tags: { user: msg.author.username } })
    const choice = await reactions.addMenu(message, msg.author.id, this.pets.tier_1)

    const code = ~~(Math.random() * 8999) + 1000
    const arg = await responder.format('emoji:info').dialog([{
      prompt: '{{dialog}}',
      input: { type: 'string', name: 'code' }
    }], { tags: {
      author: `**${msg.author.username}**`,
      animal: `:${choice}:`,
      amount: `**${this.prices.tier_1}**`,
      code: `**\`${code}\`**`
    }})
    if (parseInt(arg.code, 10) !== code) {
      responder.error('{{invalidCode}}')
      return
    }
    user.credits -= this.prices.tier_1
    const companion = new db.Companion({ id: msg.author.id, name: `${msg.author.username}'s Companion`, type: choice })
    user.companion = companion

    try {
      await companion.save()
      await user.saveAll({ companion: true })
    } catch (err) {
      return responder.error('{{error}}')
    }
    responder.format('emoji:success').send('{{result}}', { tags: {
      author: `**${msg.author.username}**`,
      animal: `:${choice}:`,
      balance: `:credits: **${user.credits}**`,
      command: `**\`${settings.prefix}companion rename\`**`
    }})
  }

  async battle ({ msg }, responder) {

  }
}

class PetBuy extends Companions {
  constructor (...args) {
    super(...args, {
      name: 'buypet',
      description: 'Purchases your personal companion'
    })

    this.registerSubcommand('buy', 'companion')
  }
}

class PetBattles extends Companions {
  constructor (...args) {
    super(...args, {
      name: 'battle',
      description: 'Fight other users\' companions'
    })

    this.registerSubcommand('battle', 'companion')
  }
}

module.exports = [ Companions, PetBuy, PetBattles ]
