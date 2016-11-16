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
    return responder('', { embed: {
      title: 'About Me!',
      description,
      color: 14892182,
      url: 'https://pyraxo.moe/haru',
      author: {
        name: 'Designed by pyraxo',
        url: 'https://pyraxo.moe',
        icon_url: 'https://twitter.com/pyraxo/profile_image?size=original'
      },
      fields: [
        { name: 'Source code (iris)', value: 'https://git.io/iris', inline: true },
        { name: 'Invite me!', value: 'https://pyraxo.moe/haru', inline: true }
      ]
    }})
  }
}

module.exports = Info
