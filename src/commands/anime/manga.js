const logger = require('winston')
const request = require('superagent')
const moment = require('moment')
const nani = require('nani')
const { Command } = require('../../core')

class Manga extends Command {
  constructor (...args) {
    super(...args, {
      name: 'manga',
      aliases: ['mango'],
      description: 'Gets information on a manga',
      cooldown: 5,
      usage: [
        { name: 'query', displayName: '<query>', type: 'string', optional: false, last: true }
      ],
      options: { botPerms: ['embedLinks'], localeKey: 'anime' }
    })

    nani.init(process.env.API_ANILIST_CLIENT, process.env.API_ANILIST_SECRET)
  }

  async handle ({ msg, args }, responder) {
    let res = await nani.get(`manga/search/${args.query}`)
    if (!Array.isArray(res)) {
      if (res.error.messages[0] === 'No Results.') {
        return responder.error('{{noResults}}')
      }
      return responder.error()
    }
    let [data] = await responder.selection(res, { mapFunc: d => d.title_romaji })
    if (!data) return

    return responder.embed({
      color: this.colours.blue,
      author: {
        name: (data.title_english || data.title_romaji) + ' • ' + data.title_japanese,
        url: `http://www.anilist.co/manga/${data.id}`,
        icon_url: data.image_url_med
      },
      image: { url: data.image_url_banner || undefined },
      fields: [
        {
          name: responder.t('{{type}}'),
          value: data.type,
          inline: true
        },
        {
          name: responder.t('{{volumes}}'),
          value: data.total_volumes,
          inline: true
        },
        {
					name: responder.t('{{status}}'),
					value: data.publishing_status.replace(/(\b\w)/gi, lc => lc.toUpperCase()),
					inline: true
				},
        {
					name: responder.t('{{score}}'),
					value: (data.average_score / 10).toFixed(2),
					inline: true
				},
        {
					name: responder.t('{{chapters}}'),
					value: data.total_chapters,
					inline: true
				},
        {
					name: responder.t('{{genres}}'),
					value: data.genres.join(', ') || '?',
					inline: true
				},
        {
          name: responder.t('{{synopsis}}'),
          value: data.description ? data.description.replace(/\\n/g, '\n').replace(/<br>|\\r/g, '').substring(0, 1000) : '{{noDesc}}'
        }
      ],
      footer: {
        text: data.end_date
        ? responder.t('{{published}}', {
          start: moment.utc(data.start_date).format('Do MMM YYYY'),
          end: moment.utc(data.end_date).format('Do MMM YYYY')
        })
        : responder.t('{{publishing}}', { start: moment.utc(data.start_date).format('ddd Do MMM, YYYY') })
      }
    }).send()
  }
}

module.exports = Manga