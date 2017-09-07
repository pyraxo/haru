const request = require('superagent')
const { Command, utils } = require('sylphy')

class Booru extends Command {
  constructor (...args) {
    super(...args, {
      name: 'booru',
      description: 'Searches an image board',
      cooldown: 5,
      usage: [
        { name: 'imageboard', type: 'string', choices: ['gelbooru', 'danbooru', 'yandere'] },
        { name: 'tags', type: 'string', optional: true }
      ],
      subcommands: {
        gelbooru: 'gelbooru',
        danbooru: 'danbooru',
        yandere: 'yandere'
      },
      options: { botPerms: ['embedLinks'], adminOnly: true },
      group: 'anime'
    })
  }

  sendImage (responder, stats) {
    let { uploader, score, tags = [], url, height, width, icon, rating, id } = stats
    tags = tags.join(' ').replace(/_/g, '\\_').split(' ')
    return responder.format('emoji:search').embed({
      author: { name: uploader, icon_url: icon },
      fields: [
        { name: responder.t('{{score}}'), value: score, inline: true },
        { name: responder.t('{{rating}}'), value: responder.t(`{{${rating}}}`), inline: true },
        {
          name: responder.t('{{tags}}'),
          value: tags.length > 5 ? tags.slice(0, 5).join(' ') + ` *(and ${tags.length - 5} more)*` : tags.join(' ')
        }
      ],
      image: { url, height, width },
      color: (r => {
        switch (r) {
          case 's': return utils.getColour('green')
          case 'q': return utils.getColour('orange')
          case 'e': return utils.getColour('red')
        }
      })(rating)
    }).send(`**ID ${id}**`)
  }

  async danbooru ({ msg, rawArgs, client }, responder) {
    if (msg.channel.nsfw === false) return responder.error('{{wrongChannel}}')
    if (rawArgs.length > 2) return responder.error('{{maxTwo}}')
    const query = rawArgs.join('+') + (rawArgs.length === 1 ? '+order:random' : '')
    let res
    try {
      res = await request.get(`http://danbooru.donmai.us/posts.json/?limit=100&page=1&tags=${query}`)
    } catch (err) {
      this.logger.error('Error encountered while querying danbooru')
      this.loggererror(err)
      return responder.clean().error('{{%ERROR}}')
    }
    const r = res.body[~~(Math.random() * 100)] || res.body[0]
    if (r && r.file_url) {
      const tags = r.tag_string.split(' ')
      return this.sendImage(responder, {
        uploader: r.tag_string_artist,
        score: r.score,
        rating: r.rating,
        tags: tags,
        icon: 'http://danbooru.donmai.us/favicon.ico',
        url: `http://danbooru.donmai.us${r.file_url}`,
        height: r.image_height,
        width: r.image_width,
        id: r.id,
        board: 'danbooru'
      })
    } else {
      return responder.error('{{noPictures}}', { query: `'**${rawArgs.join(' ')}**'` })
    }
  }

  async gelbooru (container, responder, { pid = ~~(Math.random() * 500), pass = 0 } = {}) {
    const { msg, rawArgs } = container
    if (msg.channel.nsfw === false) return responder.error('{{wrongChannel}}')
    const query = rawArgs.join('+')
    try {
      let res = await request.get(`http://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${query}${pid ? `&pid=${pid}` : ''}`)
      try {
        res = JSON.parse(res.text)
      } catch (err) {
        return responder.error('{{noPictures}}', { query: `'**${rawArgs.join(' ')}**'` })
      }
      if (pid === 1 && res.length === 0) return responder.error('{{noPictures}}', { query: `'**${rawArgs.join(' ')}**'` })
      if (pass >= 10) return responder.error()
      if (res.length === 0 && pass >= 2) {
        return this.gelbooru(container, responder, { pid: 0, pass: ++pass })
      }
      if (res.length >= 50 || (res.length < 50 && res.length > 0 && pass)) {
        const r = res[~~(Math.random() * res.length)]
        const tags = r.tags.split(' ')
        return this.sendImage(responder, {
          uploader: r.owner,
          score: r.score,
          rating: r.rating,
          tags,
          icon: 'http://gelbooru.com/favicon.png',
          url: 'https:' + r.file_url,
          height: r.height,
          width: r.width,
          id: r.id,
          board: 'gelbooru'
        })
      } else {
        return this.gelbooru(container, responder, { pass: ++pass })
      }
    } catch (err) {
      this.logger.error('Error encountered while querying gelbooru')
      this.logger.error(err)
      return responder.clean().error('{{%ERROR}}')
    }
  }

  async yandere ({ msg, rawArgs, args }, responder) {
    if (msg.channel.nsfw === false) return responder.error('{{wrongChannel}}')
    const query = rawArgs.join('+')
    let res
    try {
      res = await request.get(`https://yande.re/post/index.json/?limit=1&page=1&tags=order:random${query ? `+${query}` : ''}`)
    } catch (err) {
      this.logger.error('Error encountered while querying danbooru')
      this.logger.error(err)
      return responder.clean().error('{{%ERROR}}')
    }
    const r = res.body[~~(Math.random() * 100)] || res.body[0]
    if (r && r.file_url) {
      const tags = r.tags.split(' ')
      return this.sendImage(responder, {
        uploader: r.author,
        score: r.score,
        rating: r.rating,
        tags: tags,
        icon: 'http://yande.re/favicon.ico',
        url: r.file_url,
        height: r.height,
        width: r.width,
        id: r.id,
        board: 'yandere'
      })
    } else {
      return responder.error('{{noPictures}}', { query: `'**${rawArgs.join(' ')}**'` })
    }
  }
}

class Gelbooru extends Booru {
  constructor (...args) {
    super(...args, {
      name: 'gelbooru',
      description: 'Searches the Gelbooru imageboard',
      usage: [{ name: 'tags', type: 'string', optional: true }],
      aliases: [],
      options: { localeKey: 'booru', botPerms: ['embedLinks'], adminOnly: true },
      subcommand: 'gelbooru'
    })
  }
}

class Danbooru extends Booru {
  constructor (...args) {
    super(...args, {
      name: 'danbooru',
      description: 'Searches the Danbooru imageboard',
      aliases: [],
      usage: [{ name: 'tags', type: 'string', optional: true }],
      options: { localeKey: 'booru', botPerms: ['embedLinks'], adminOnly: true },
      subcommand: 'danbooru'
    })
  }
}

class Yandere extends Booru {
  constructor (...args) {
    super(...args, {
      name: 'yandere',
      description: 'Searches the Yandere imageboard',
      aliases: [],
      usage: [{ name: 'tags', type: 'string', optional: true }],
      options: { localeKey: 'booru', botPerms: ['embedLinks'], adminOnly: true },
      subcommand: 'yandere'
    })
  }
}

module.exports = [ Booru, Gelbooru, Danbooru, Yandere ]
