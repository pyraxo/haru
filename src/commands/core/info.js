const { Command } = require('../../core')

class Info extends Command {
  constructor (...args) {
    super(...args, {
      name: 'info',
      description: 'Information about me'
    })
  }

  async handle ({ msg, settings }, responder) {
    const description = this.i18n.get('info.info', settings.lang)
    return responder.format(['emoji:info', 'bold']).send('Please ensure you have embeds enabled!', { embed: {
      description,
      color: 14892182,
      url: 'https://pyraxo.moe/haru',
      author: {
        name: 'haru',
        url: 'https://pyraxo.moe/haru',
        icon_url: this.client.user.avatarURL
      },
      fields: [
        { name: 'Author', value: '[pyraxo#6400](https://pyraxo.moe)', inline: true },
        { name: 'Library', value: '[eris / nodeJS](https://github.com/abalabahaha/eris)', inline: true },
        { name: 'Version', value: '2.0.0', inline: true },
        { name: 'Source code', value: '[Bot Base](https://git.io/iris) - Developed for **haru** and [Tatsumaki](https://tatsumaki.xyz)' },
        { name: 'Invite me!', value: 'https://pyraxo.moe/haru' }
      ]
    }})
  }
}

module.exports = Info
