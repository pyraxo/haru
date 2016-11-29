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
        name: 'pyraxo#6400',
        url: 'https://pyraxo.moe/haru',
        icon_url: 'https://twitter.com/pyraxo/profile_image?size=original'
      },
      fields: [
        { name: responder.t('{{author}}'), value: '[pyraxo#6400](https://pyraxo.moe)', inline: true },
        { name: responder.t('{{lib}}'), value: '[eris / nodeJS](https://github.com/abalabahaha/eris)', inline: true },
        { name: responder.t('{{ver}}'), value: '2.0.0', inline: true },
        { name: responder.t('{{src}}'), value: '[Bot Base](https://git.io/iris) - Developed for **haru** and [Tatsumaki](https://tatsumaki.xyz)' },
        { name: responder.t('{{inv}}'), value: 'https://pyraxo.moe/haru' }
      ]
    }})
  }
}

module.exports = Info
