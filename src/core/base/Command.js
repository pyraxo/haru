const logger = require('winston')
const moment = require('moment')

const { Emojis: emoji } = require('../util')
const UsageManager = require('../managers/UsageManager')
const Base = require('./Base')

class Command extends Base {
  constructor (bot, options, ...args) {
    super(bot)
    if (this.constructor === Command) {
      throw new Error('Cannot instantiate abstract Command')
    }

    this.resolver = new UsageManager(bot)
    this._verify(options, ...args)

    this.responseMethods = {
      send: (msg, res) => res,
      reply: (msg, res) => `**${msg.author.username}**, ${res}`,
      success: (msg, res) => `${emoji.success}  |  **${msg.author.username}**, ${res}`,
      error: (msg, res) => `${emoji.fail}  |  **${msg.author.username}**, ` +
      res || 'an error occurred! Please try again later.'
    }

    this.formatMethods = {
      bold: (res) => `**${res}**`,
      italic: (res) => `*${res}*`,
      underline: (res) => `__${res}__`,
      strikethrough: (res) => `~~${res}~~`,
      inlineCode: (res) => `\`${res}\``,
      code: (res, type = '') => `\`\`\`${type}\n${res}\n\`\`\``,
      emoji: (res, type) => `${emoji[type] || emoji.success}  |  ${res}`
    }

    this.timers = new Map()
  }

  _verify ({
    name,
    aliases = [],
    description = 'No description',
    guildOnly = false,
    adminOnly = false,
    hidden = false,
    cooldown = 5,
    usage = [],
    enableLocales = true
  } = {}) {
    this.labels = typeof name === 'string'
    ? [name].concat(aliases)
    : (Array.isArray(aliases) && aliases.length > 0 ? aliases : [])

    if (this.labels.length === 0) {
      throw new Error(`${this.constructor.name} command is not named`)
    }
    this.description = String(description)
    this.guildOnly = guildOnly
    this.adminOnly = adminOnly
    this.cooldown = cooldown
    this.hidden = hidden

    this.usage = usage
    this.resolver.load(usage)
  }

  createResponder ({ msg, rawArgs, settings, client }) {
    let responder = (...args) => responder.send(...args)

    for (let method in this.responseMethods) {
      responder[method] = (response = '', options = {}) => {
        if (Array.isArray(response)) response = response.join('\n')
        response = this.responseMethods[method](msg, response)
        const formats = responder._formats
        if (formats) {
          for (let format of formats) {
            format = format.split(':')
            if (this.formatMethods[format[0]]) {
              response = this.formatMethods[format[0]](response, format[1])
            }
          }
        }
        if (responder._file) options.file = responder._file
        if (responder._embed) options.embed = responder._embed

        delete responder._formats
        delete responder._file
        delete responder._embed

        let prom = (options.DM ? this.client.getDMChannel(msg.author.id) : Promise.resolve(msg.channel))
        .then(channel => this.send(channel, response, options))

        prom.catch(err => logger.error(`${this.labels[0]} command failed to call ${method} - ${err}`))

        return prom
      }
    }

    responder.format = (formats) => {
      formats = (formats instanceof Array) ? formats : [formats]
      responder._formats = formats.reverse()
      return responder
    }

    responder.file = (file, name) => {
      responder._file = { file, name }
      return responder
    }

    responder.upload = (file, name, content = '') => {
      let fileObj = { file, name }
      if ((!file || !name) && responder._file) {
        file = responder._file
        delete responder._file
      }
      return msg.channel.createMessage(content, fileObj)
    }

    responder.embed = (embed) => {
      responder._embed = embed
      return responder
    }

    responder.dialog = async (dialogs = [], options = {}) => {
      const { tries = 10, time = 60, matches = 10, filter } = options
      options.cancel = options.cancel || 'cancel'
      const args = {}
      let cancelled = false
      for (const dialog of dialogs) {
        let prompt = dialog.prompt
        const input = new UsageManager(this.bot)
        input.load(dialog.input)

        if (Array.isArray(prompt) && prompt.length) prompt[0] = `**${prompt[0]}**`
        let p1 = await responder(prompt, options)
        const collector = this.bot.engine.bridge.collect({
          channel: msg.channel.id,
          author: msg.author.id,
          tries,
          time,
          matches,
          filter
        })

        const awaitMessage = async (msg) => {
          let ans
          try {
            ans = await collector.next()
            if (ans.content.toLowerCase() === options.cancel) return Promise.reject()
            try {
              return await input.resolve(ans, [ans.cleanContent])
            } catch (err) {
              let tags = err.tags || {}
              tags.cancel = `\`${options.cancel}\``
              let p2 = await responder.format('emoji:fail').send(`${err.message || err}\n\n{{%menus.EXIT}}`, { tags })
              return awaitMessage(p2)
            }
          } catch (o) {
            return Promise.reject(o)
          } finally {
            if (msg) msg.delete()
            if (ans) {
              if (ans.channel.permissionsOf(client.user.id).has('manageMessages')) {
                ans.delete()
              }
            }
          }
        }

        try {
          Object.assign(args, await awaitMessage())
          collector.stop()
        } catch (err) {
          if (err) {
            let tags = {}
            tags[err.reason] = err.arg
            responder.error(`{{%menus.ERRORED}} **{{%collector.${err.reason}}}**`, { err: `**${err.reason}**`, tags })
          } else {
            responder.success('{{%menus.EXITED}}')
          }
          collector.stop()
          cancelled = true
          break
        } finally {
          p1.delete()
        }
      }

      if (cancelled) return Promise.reject()
      return Promise.resolve(args)
    }

    return responder
  }

  _execute (container) {
    const responder = this.createResponder(container)

    if (!this._execCheck(container, responder)) return

    this.resolver.resolve(container.msg, container.rawArgs, {
      prefix: container.settings.prefix,
      command: container.trigger
    }).then((args = {}) => {
      container.args = args
      this.handle(container, responder).catch(err => {
        logger.error(`Rejection from ${this.labels[0]}`)
        logger.error(err)
      })
    }).catch(err => {
      return responder.error(err.message || err, err)
    })
  }

  _execCheck ({ msg, isPrivate, admins }, responder) {
    const awaitID = msg.channel.id + msg.author.id

    if (this.cooldown > 0) {
      if (!this.timers.has(awaitID)) {
        this.timers.set(awaitID, +moment())
      } else {
        const diff = moment().diff(moment(this.timers.get(awaitID)), 'seconds')
        if (diff < this.cooldown) {
          responder.reply('{{%COOLDOWN}}', {
            delay: 0,
            deleteDelay: 5000,
            tags: {
              time: `**${this.cooldown - diff}**`
            }
          })
          return false
        } else {
          this.timers.delete(awaitID)
          this.timers.set(awaitID, +moment())
        }
      }
    }
    if (this.adminOnly && !admins.includes(msg.author.id)) return false
    if (this.guildOnly && isPrivate) return false
    return true
  }

  async handle () { return true }

  logError (err) {
    logger.error(`Error running ${this.labels[0]} command: ${err}`)
  }
}

module.exports = Command
