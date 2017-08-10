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
    return responder.selection(['food', 'null'], {
      title: '{{buyDialog}}',
      mapFunc: ch => responder.t(`{{menu.${ch}}}`)
    }).then(arg => arg.length ? this[arg[0]](container, responder) : false)
  }

  async food ({ msg, data, settings }, responder) {
    const user = await data.User.fetch(msg.author.id)
    const price = 100
    if (user.credits < price) {
      responder.error('{{cannotAfford}}', {
        amount: `**${price}**`,
        balance: `**${user.credits}**`
      })
      return
    }
    const code = ~~(Math.random() * 8999) + 1000
    const arg = await responder.format('emoji:info').dialog([{
      prompt: '{{purchase}}',
      input: { type: 'string', name: 'code' }
    }], {
      author: `**${msg.author.username}**`,
      selection: `food`,
      //amount: `**${amount}**`,
      code: `**\`${code}\`**`
    })
    if (parseInt(arg.code, 10) !== code) {
      return responder.error('{{invalidCode}}')
    }
    console.log(user.inventory)
    user.inventory.push('food')
    console.log(user.inventory)
    responder.success(`Yay`)
  }

}
module.exports = [Shop]
