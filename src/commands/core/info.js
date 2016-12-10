const { Command } = require('../../core')

class Info extends Command {
  constructor (...args) {
    super(...args, {
      name: 'info',
      aliases: ['about'],
      description: 'Information about me'
    })
  }

  handle ({ msg, settings, client }, responder) {
    return responder.format(['emoji:info', 'bold']).send('{{warn}}', { embed: {
      description: responder.t('{{info}}'),
      color: 14892182,
      url: 'https://pyraxo.moe/haru',
      author: {
        name: 'pyraxo#6400',
        url: 'https://patreon.com/pyraxo',
        icon_url: 'https://twitter.com/pyraxo/profile_image?size=original'
      },
      fields: [
        { name: responder.t('{{author}}'), value: '[pyraxo#6400](https://pyraxo.moe)', inline: true },
        { name: responder.t('{{lib}}'), value: '[eris / nodeJS](https://github.com/abalabahaha/eris)', inline: true },
        { name: responder.t('{{ver}}'), value: '2.0.0', inline: true },
        { name: responder.t('{{src}}'), value: '[iris](https://git.io/iris) - Bot base for **haru** and [Tatsumaki](https://tatsumaki.xyz)' },
        { name: responder.t('{{inv}}'), value: 'https://pyraxo.moe/haru', inline: true },
        { name: responder.t('{{ptr}}'), value: 'https://patreon.com/pyraxo', inline: true },
        {
          name: responder.t('{{support}}'),
          value: responder.t('{{join}}', { link: '**https://discord.gg/bBqpAKw**' })
        }
      ]
    }})
  }
}

module.exports = Info
