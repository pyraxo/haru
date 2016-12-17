const logger = require('winston')
const request = require('superagent')
const { Command } = require('../../core')

class Urban extends Command {
  constructor (...args) {
    super(...args, {
      name: 'urban',
      description: 'Searches UrbanDictionary for meanings',
      usage: [{ name: 'query', type: 'string', optional: false, last: true }],
      options: { localeKey: 'misc' }
    })
  }

  async handle ({ msg, args }, responder) {
    try {
      const res = await request.get(`http://api.urbandictionary.com/v0/define?term=${args.query.split(' ').join('+')}`)
      if (!res.body.list.length) {
        return responder.error('{{urban.noResults}}', { query: `'**${args.query}**'` })
      }

      const result = res.body.list[~~(Math.random() * res.body.list.length)]
      return responder.embed({
        color: this.colours.blue,
        title: `📋  ${result.word}  --  ${result.author}`,
        description: result.definition,
        thumbnail: { url: 'http://error.urbandictionary.com/logo.png' },
        fields: [
          { name: 'Examples', value: result.example, inline: false },
          { name: 'Ratings', value: `👍 ${result.thumbs_up}  |  👎 ${result.thumbs_down}`, inline: false },
          { name: 'Link', value: `**${result.permalink}**`, inline: false }
        ]
      }).format(['emoji:info', 'bold']).send('{{%ENABLE_EMBEDS}}')
    } catch (err) {
      logger.error('Querying Urban gave an error')
      logger.error(err)
      return responder.error()
    }
  }
}

module.exports = Urban
