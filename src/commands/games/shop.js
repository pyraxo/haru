const logger = require('winston')
const { Command } = require('../../core')

class Shop extends Command {
  constructor (...args) {
    super(...args, {
      name: 'shop',
      description: 'A small shop to buy things with credits',
      options: { localeKey: 'shop' }
    })
  }

  handle (container, responder) {
    const { msg, data, settings } = container
    return responder.selection(['food', 'checkInv'], {
      title: '{{buyDialog}}',
      mapFunc: ch => responder.t(`{{menu.${ch}}}`)
    }).then(arg => arg.length ? this[arg[0]](container, responder) : false)
  }

  async food ({ msg, data, settings }, responder) {
    const user = await data.User.fetch(msg.author.id)
    const arg = await responder.format('emoji:info').dialog([{
      prompt: '{{howMuch}}',
      input: { type: 'int', name: 'howMuch' }
    }], {
      author: `**${msg.author.username}**`,
      selection: `food`
    })
    const amount = arg.howMuch
    const price = (100 * amount)
    if (user.credits < price) {
      responder.error('{{cannotAfford}}', {
        amount: `**${price}**`,
        balance: `**${user.credits}**`
      })
      return
    }
    const code = ~~(Math.random() * 8999) + 1000
    const argCode = await responder.format('emoji:info').dialog([{
      prompt: '{{purchase}}',
      input: { type: 'string', name: 'code' }
    }], {
      author: `**${msg.author.username}**`,
      selection: `food`,
      amount: `**${amount}**`,
      code: `**\`${code}\`**`
    })
    if (parseInt(argCode.code, 10) !== code) {
      return responder.error('{{invalidCode}}')
    }
    user.petfood += amount
    user.credits -= price
    try {
      await user.saveAll()
      await data.User.update(user.id, user)
    } catch (err) {
      logger.error(`Could not save after food purchase: ${err}`)
      return responder.error('{{error}}')
    }
    responder.format('emoji:success').send('{{result}}', {
      author: `**${msg.author.username}**`,
      amount: `**${amount}**`,
      selection: `food`,
      balance: `:credits: **${user.credits}**`
    })
  }

  async checkInv ({ msg, data, settings }, responder){
    const user = await data.User.fetch(msg.author.id)
    responder.embed({
      color: this.colours.blue,
      author: { name: responder.t('{{info}}'), icon_url: msg.author.avatarURL },
      description: `:credit_card: ${user.credits}`,
      fields: [
        { name: responder.t('{{amounts.petFood}}'), value: user.petfood || 0, inline: true }
      ]
    }).send()
  }

}
module.exports = [Shop]
