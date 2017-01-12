const logger = require('winston')
const request = require('superagent')
const Feedparser = require('feedparser')
const moment = require('moment')
const toMarkdown = require('to-markdown')

const { Module, Collection } = require('../../core')

class RSS extends Module {
  constructor (...args) {
    super(...args, {
      name: 'rss'
    })
  }

  init () {
    this.portal = this.bot.engine.modules.get('portal')
    this.db = this.bot.engine.db.models
    this._timer = setInterval(this.scanRSS.bind(this), 15 * 60 * 1000)
  }

  unload () {
    clearInterval(this._timer)
    delete this._timer
  }

  scanRSS () {
    this.db.RSS.run().then(results =>
      Promise.map(results.filter((r, i) =>
        i % parseInt(process.env.CLIENT_PROCESSES, 10) === parseInt(process.env.BASE_SHARD_ID, 10)
      ), this.scanFeed.bind(this)).then(res => logger.info(`Parsed ${res.length} feeds`, err => logger.error)),
      logger.error
    )
  }

  scanFeed (feed) {
    const portal = this.portal
    if (!portal) return
    return new Promise((resolve, reject) => {
      if (!feed.channels || !feed.channels.length) return resolve()
      const fparse = new Feedparser()

      fparse
      .once('error', err => {
        logger.error(`Error while parsing ${feed.id} -`, err)
        return resolve()
      })
      .once('readable', function readable () {
        const article = this.read()
        if (!article) {
          logger.error(`No data found for ${feed.id}`)
          return resolve()
        }

        let pubdate = 0
        let lastUpdated = feed.lastUpdated
        
        if (article.pubdate && article.pubdate !== 'Invalid Data') {
          pubdate = moment(article.pubdate).unix()
        } else if (article.meta.pubdate) {
          pubdate = moment(article.meta.pubdate).unix()
        }

        if (feed.lastUpdated > 0 && pubdate > 0 && pubdate <= lastUpdated) {
          return resolve()
        }

        const categories = article.categories.map(c => c.toLowerCase())

        let channels = 0
        feed.channels.forEach(entry => {
          const included = entry.includedTags || []
          const excluded = entry.excludedTags || []
          for (const tag of categories) {
            if ((included.length && !included.includes(tag)) || (excluded.length && excluded.includes(tags))) {
              return
            }
          }
          channels++
          let desc = article.summary || article.description
          // desc = desc && desc.length > 300 ? desc.substr(0, 300) + '...' : desc

          portal.tunnel(entry.channel, '', { embed: {
            author: {
              name: `${article.author || article.meta.title}`,
              icon_url: article.meta.favicon
            },
            description: [
              `📰  |  **${article.title}**\n`,
              desc ? toMarkdown(desc) : '',
              `\n**View the article [here](${article.link}).**\n\0`,
            ].join('\n'),
            image: { url: article.image.url },
            fields: [{
              name: 'Tags',
              value: categories.length > 0 ? categories.join(', ') : 'None'
            }],
            footer: { text: moment(article.pubdate).format('ddd Do MMM, YYYY [at] hh:mm:ss a') }
          }})
        })

        feed.lastUpdated = pubdate
        return feed.save().then(
          () => logger.info(`Parsed ${feed.id} for ${channels} channels`),
          logger.error
        ).finally(() => resolve())
      })

      request.get(feed.id)
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
      .set('Accept', 'text/html,application/rss+xml,application/rdf+xml;q=0.8,application/atom+xml;q=0.6,application/xhtml+xml,application/xml')
      .set('Accept-Encoding', 'gzip')
      .set('Keep-Alive', 'false')
      .pipe(fparse)
    })
  }
}

module.exports = RSS
