const { Command, utils } = require('sylphy')

class UpgradePet extends Command {
  constructor (...args) {
    super(...args, {
      name: 'train',
      description: 'A place to upgrade your pet\'s stats',
      aliases: ['training'],
      options: { localeKey: 'shop' },
      group: 'games'
    })
  }

  /*
  ██   ██  █████  ███    ██ ██████  ██      ███████
  ██   ██ ██   ██ ████   ██ ██   ██ ██      ██
  ███████ ███████ ██ ██  ██ ██   ██ ██      █████
  ██   ██ ██   ██ ██  ██ ██ ██   ██ ██      ██
  ██   ██ ██   ██ ██   ████ ██████  ███████ ███████
  */
  async handle (container, responder) {
    const { msg, plugins, settings, trigger } = container
    const User = plugins.get('db').data.User
    const companion = (await User.fetch(msg.author.id)).companion
    if (!companion) {
      responder.error('{{noPet}}', { command: `**\`${settings.prefix}companion buy\`**` })
      return
    }
    return responder.selection(['crit', 'heal', 'health'], {
      title: '{{upgradeDialog}}',
      mapFunc: ch => responder.t(`{{upgradeMenu.${ch}}}`)
    }).then(arg => arg.length ? this[arg[0]](container, responder) : false)
  }

  /*
   ██████ ██████  ██ ████████ ██  ██████  █████  ██
  ██      ██   ██ ██    ██    ██ ██      ██   ██ ██
  ██      ██████  ██    ██    ██ ██      ███████ ██
  ██      ██   ██ ██    ██    ██ ██      ██   ██ ██
   ██████ ██   ██ ██    ██    ██  ██████ ██   ██ ███████
  */
  async crit ({ msg, plugins, settings }, responder) {
    const selection = 'crit'
    const User = plugins.get('db').data.User
    const user = await User.fetch(msg.author.id)
    const companion = user.companion
    const amount = 1
    if (companion.lvltokens < amount) {
      responder.error('{{cannotUpgrade}}', {
        amount: `**${amount}**`,
        balance: `**${companion.lvltokens}**`
      })
      return
    }
    const code = ~~(Math.random() * 8999) + 1000
    const argCode = await responder.format('emoji:info').dialog([{
      prompt: '{{upgrade}}',
      input: { type: 'string', name: 'code' }
    }], {
      author: `**${msg.author.username}**`,
      selection: `${selection}`,
      amount: `**${amount}**`,
      code: `**\`${code}\`**`
    })
    if (parseInt(argCode.code, 10) !== code) {
      return responder.error('{{invalidCode}}')
    }
    companion.crit += 2
    companion.lvltokens -= amount
    try {
      await user.saveAll()
      await User.update(user.id, user)
    } catch (err) {
      this.logger.error(`Could not save after stat upgrade: ${err}`)
      return responder.error('{{error}}')
    }
    responder.format('emoji:success').send('{{upgradeResult}}', {
      author: `**${msg.author.username}**`,
      selection: `${selection}`,
      new: `${companion.crit / 100}`,
      balance: `**${companion.lvltokens}**`
    })
  }

  /*
  ██   ██ ███████  █████  ██
  ██   ██ ██      ██   ██ ██
  ███████ █████   ███████ ██
  ██   ██ ██      ██   ██ ██
  ██   ██ ███████ ██   ██ ███████
  */
  async heal ({ msg, plugins, settings }, responder) {
    const selection = 'heal'
    const User = plugins.get('db').data.User
    const user = await User.fetch(msg.author.id)
    const companion = user.companion
    const amount = 1
    if (companion.lvltokens < amount) {
      responder.error('{{cannotUpgrade}}', {
        amount: `**${amount}**`,
        balance: `**${companion.lvltokens}**`
      })
      return
    }
    const code = ~~(Math.random() * 8999) + 1000
    const argCode = await responder.format('emoji:info').dialog([{
      prompt: '{{upgrade}}',
      input: { type: 'string', name: 'code' }
    }], {
      author: `**${msg.author.username}**`,
      selection: `${selection}`,
      amount: `**${amount}**`,
      code: `**\`${code}\`**`
    })
    if (parseInt(argCode.code, 10) !== code) {
      return responder.error('{{invalidCode}}')
    }
    companion.heal += 2
    companion.lvltokens -= amount
    try {
      await user.saveAll()
      await User.update(user.id, user)
    } catch (err) {
      this.logger.error(`Could not save after stat upgrade: ${err}`)
      return responder.error('{{error}}')
    }
    responder.format('emoji:success').send('{{upgradeResult}}', {
      author: `**${msg.author.username}**`,
      selection: `${selection}`,
      new: `${companion.heal / 100}`,
      balance: `**${companion.lvltokens}**`
    })
  }

  /*
  ██   ██ ███████  █████  ██   ████████ ██   ██
  ██   ██ ██      ██   ██ ██      ██    ██   ██
  ███████ █████   ███████ ██      ██    ███████
  ██   ██ ██      ██   ██ ██      ██    ██   ██
  ██   ██ ███████ ██   ██ ███████ ██    ██   ██
  */
  async health ({ msg, plugins, settings }, responder) {
    const selection = 'health'
    const User = plugins.get('db').data.User
    const user = await User.fetch(msg.author.id)
    const companion = user.companion
    const amount = 4
    if (companion.lvltokens < amount) {
      responder.error('{{cannotUpgrade}}', {
        amount: `**${amount}**`,
        balance: `**${companion.lvltokens}**`
      })
      return
    }
    const code = ~~(Math.random() * 8999) + 1000
    const argCode = await responder.format('emoji:info').dialog([{
      prompt: '{{upgrade}}',
      input: { type: 'string', name: 'code' }
    }], {
      author: `**${msg.author.username}**`,
      selection: `${selection}`,
      amount: `**${amount}**`,
      code: `**\`${code}\`**`
    })
    if (parseInt(argCode.code, 10) !== code) {
      return responder.error('{{invalidCode}}')
    }
    companion.hp += 1
    companion.lvltokens -= amount
    try {
      await user.saveAll()
      await User.update(user.id, user)
    } catch (err) {
      this.logger.error(`Could not save after stat upgrade: ${err}`)
      return responder.error('{{error}}')
    }
    responder.format('emoji:success').send('{{upgradeResult}}', {
      author: `**${msg.author.username}**`,
      selection: `${selection}`,
      new: `${companion.hp}`,
      balance: `**${companion.lvltokens}**`
    })
  }

}
module.exports = [UpgradePet]
