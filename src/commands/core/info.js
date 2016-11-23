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
    return responder.format(['emoji:info', 'bold']).send('{{warn}}', { embed: {
      description,
      color: 14892182,
      url: 'https://pyraxo.moe/haru',
      author: {
        name: 'haru',
        url: 'https://pyraxo.moe/haru',
        icon_url: this.client.user.avatarURL
      },
      fields: [
        { name: this.t('{{author}}', settings.lang), value: '[pyraxo#6400](https://pyraxo.moe)', inline: true },
        { name: this.t('{{lib}}', settings.lang), value: '[eris / nodeJS](https://github.com/abalabahaha/eris)', inline: true },
        { name: this.t('{{ver}}', settings.lang), value: '2.0.0', inline: true },
        { name: this.t('{{src}}', settings.lang), value: '[Bot Base](https://git.io/iris) - Developed for **haru** and [Tatsumaki](https://tatsumaki.xyz)' },
        { name: this.t('{{inv}}', settings.lang), value: 'https://pyraxo.moe/haru' }
      ]
    }})
  }
}

module.exports = Info
