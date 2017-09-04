const moment = require('moment')
const nani = require('nani')
const { Command } = require('sylphy')

const seasons = {
  1: 'winter',
  2: 'spring',
  3: 'summer',
  4: 'fall'
}

class Anime extends Command {
  constructor (...args) {
    super(...args, {
      name: 'anime',
      aliases: ['animu'],
      description: 'Gets information on an anime',
      cooldown: 5,
      usage: [
        { name: 'query', displayName: '<query>', type: 'string', optional: false, last: true }
      ],
      options: { botPerms: ['embedLinks'] },
      group: 'anime'
    })

    nani.init(process.env.API_ANILIST_CLIENT, process.env.API_ANILIST_SECRET)
  }

  parseSeason (season) {
    return season < 350
    ? `{{seasons.${seasons[season % 10]}}} 20${Math.floor(season / 10)}`
    : `{{seasons.${seasons[season % 10]}}} 19${Math.floor(season / 10)}`
  }

  async handle ({ msg, args }, responder) {
    let res = await nani.get(`anime/search/${args.query}`)
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
        url: `http://www.anilist.co/anime/${data.id}`,
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
          name: responder.t('{{episodes}}'),
          value: data.total_episodes ? `${data.total_episodes} (${data.duration || '?'} min/ep)` : '?',
          inline: true
        },
        {
          name: responder.t('{{status}}'),
          value: data.airing_status.replace(/(\b\w)/gi, lc => lc.toUpperCase()),
          inline: true
        },
        {
          name: responder.t('{{score}}'),
          value: (data.average_score / 10).toFixed(2),
          inline: true
        },
        {
          name: responder.t('{{season}}'),
          value: data.season ? responder.t(this.parseSeason(data.season)) : '?',
          inline: true
        },
        {
          name: responder.t('{{genres}}'),
          value: data.genres.join(', ') || '?',
          inline: true
        },
        {
          name: responder.t('{{synopsis}}'),
          value: data.description
          ? data.description.replace(/\\n/g, '\n').replace(/<br>|\\r/g, '').substring(0, 1000) : responder.t('{{noDesc}}')
        }
      ],
      footer: {
        text: data.end_date
        ? responder.t('{{aired}}', {
          start: moment.utc(data.start_date).format('Do MMM YYYY'),
          end: moment.utc(data.end_date).format('Do MMM YYYY')
        })
        : responder.t('{{airing}}', { start: moment.utc(data.start_date).format('ddd Do MMM, YYYY') })
      }
    }).send()
  }
}

module.exports = Anime
