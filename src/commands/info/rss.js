const logger = require('winston')
const Feedparser = require('feedparser')
const request = require('superagent')
const { Command } = require('../../core')

const options = { guildOnly: true, permissions: ['manageGuild'], botPerms: ['embedLinks'] }

class RSS extends Command {
  constructor (...args) {
    super(...args, {
      name: 'rss',
      description: 'RSS feed management command',
      usage: [
        { name: 'action', displayName: 'add | remove | list | clear', type: 'string', optional: true }
      ],
      subcommands: {
        list: { options },
        add: { usage: [{ name: 'url', type: 'string', optional: true }], options },
        remove: { usage: [{ name: 'entry', type: 'string', optional: true }], options },
        clear: { options }
      },
      options
    })
  }

  validate (url) {
    return new Promise((resolve, reject) => {
      const fparse = new Feedparser()
      fparse.once('error', reject).once('meta', resolve)
      request.get(url).pipe(fparse)
    })
  }

  handle (container, responder) {
    return responder.selection(['add', 'remove', 'list', 'clear'], {
      title: '{{rssDialog}}',
      mapFunc: ch => responder.t(`{{action.${ch}}}`)
    }).then(arg => arg.length ? this[arg[0]](container, responder) : false)
  }

  async add ({ msg, args, client, settings, data, modules }, responder) {
    let meta
    try {
      if (args.url) {
        meta = await this.validate(args.url)
      } else {
        const arg = await responder.format('emoji:newspaper').dialog([{
          prompt: '{{urlDialog}}',
          input: { type: 'string', name: 'url' }
        }], {
          author: `**${msg.author.username}**`,
          exit: '**`cancel`**'
        })
        meta = await this.validate(arg.url)
      }
    } catch (err) {
      if (err) {
        logger.error(`Could not validate ${args.url} -`, err)
        return responder.error('{{error}}', { url: `**${args.url}**` })
      }
    }
    if (!meta) return

    const url = meta.xmlurl
    const arg = await responder.dialog([{
      prompt: '📰  |  {{includedTagsDialog}}',
      input: { type: 'list', name: 'includedTags', separator: ', ' }
    }, {
      prompt: '📰  |  {{excludedTagsDialog}}',
      input: { type: 'list', name: 'excludedTags', separator: ', ' }
    }], {
      author: `**${msg.author.username}**`,
      skip: '**`skip`**',
      exit: '**`cancel`**'
    })
    const includedTags = arg.includedTags.length === 1 && arg.includedTags[0] === 'skip' ? [] : arg.includedTags
    const excludedTags = arg.excludedTags.length === 1 && arg.excludedTags[0] === 'skip' ? [] : arg.excludedTags

    const rss = await data.RSS.fetch(url)
    rss.name = meta.title
    if (!rss.channels) rss.channels = []
    rss.channels = rss.channels.filter(r => r.channel !== msg.channel.id)
    rss.channels.push({ channel: msg.channel.id, includedTags, excludedTags })
    await rss.save()
    
    return responder.success('{{success}}', {
      url: `\n\n**${meta.title}** (<${url}>)`,
      channel: `**#${msg.channel.name}**`,
      included: `**${includedTags.length}**`,
      excluded: `**${excludedTags.length}**`
    }).then(() => {
      const RSS = modules.get('rss')
      if (!RSS) return false
      return RSS.scanFeed(rss)
    })
  }

  list ({ msg, db, trigger, settings, args }, responder) {
    return db.RSS.filter(feed => feed('channels')('channel').contains(msg.channel.id)).run().then(feeds => {
      if (!feeds.length) {
        return responder.format('emoji:newspaper').reply('{{notSubscribed}}', {
          channel: `**#${msg.channel.name}**`,
          command: `**\`${settings.prefix}${trigger}\`**`
        })
      }
      return responder.format('emoji:newspaper').embed({
        description: [
          `**${responder.t('{{subscribedFeeds}}', { channel: '#' + msg.channel.name })}**\n`,
          feeds.map((f, i) => `\`[${i+1}]\` [${f.name}](${f.id})`).join('\n')
        ].join('\n'),
        color: this.colours.blue
      }).reply('{{subscribedTo}}', { channel: `**#${msg.channel.name}**` })
    })
  }

  clear ({ msg, db }, responder) {
    return responder.format('emoji:info').dialog([{
      prompt: '{{confirmClear}}',
      input: { type: 'string', name: 'confirm' }
    }], { author: `**${msg.author.username}**`, confirm: '**`yes`**' }).then(arg => {
      if (arg.confirm !== 'yes') {
        return responder.success('{{notCleared}}')
      }
      return db.RSS.filter(feed => feed('channels')('channel').contains(msg.channel.id)).delete().then(res =>
        responder.success('{{cleared}}', { count: `**${res.deleted}**` })
      )
    })
  }

  async remove ({ msg, db, trigger, settings, args }, responder) {
    const feeds = await db.RSS.filter(feed => feed('channels')('channel').contains(msg.channel.id)).run()
    if (!feeds.length) {
      return responder.format('emoji:newspaper').reply('{{notSubscribed}}', {
        channel: `**#${msg.channel.name}**`,
        command: `**\`${settings.prefix}${trigger}\`**`
      })
    }
    const [feed] = await responder.selection(
      args.entry ? feeds.filter(f => f.name.includes(args.entry) || f.id.includes(args.entry)) : feeds,
      { footer: '{{rssDelFooter}}', mapFunc: feed => feed.id }
    )
    if (!feed) return responder.error('{{noFeedFound}}')
    feed.channels = feed.channels.filter(c => c.channel !== msg.channel.id)
    await feed.save()
    return responder.success('{{removedFeed}}', {
      feed: `**${feed.name}**\n\n**<${feed.id}>**`
    })
  }
}

module.exports = RSS
