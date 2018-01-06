const { Command, utils } = require('sylphy')

class UpgradePet extends Command {
  constructor (...args) {
    super(...args, {
      name: 'shop',
      description: 'A place to upgrade your pet',
      options: { localeKey: 'shop' },
      group: 'games'
    })
  }

  handle (container, responder) {
    const { msg, settings } = container
    return responder.selection(['atk', 'crit', 'heal'], {
      title: '{{upgradeDialog}}',
      mapFunc: ch => responder.t(`{{upgradeMenu.${ch}}}`)
    }).then(arg => arg.length ? this[arg[0]](container, responder) : false)
  }

  async atk ({ msg, plugins, settings }, responder) {
    const selection = atk
    const User = plugins.get('db').data.User
    const user = await User.fetch(msg.author.id)
    const companion = user.companion
    const amount = 10
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
    companion.atk += 1
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
      new: `${companion.atk}`,
      balance: `**${companion.lvltokens}**`
    })
  }

}
module.exports = [Shop]
