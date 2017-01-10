const logger = require('winston')
const chalk = require('chalk')

module.exports = {
  priority: 6,
  process: async container => {
    const { settings, msg, modules, client, isPrivate } = container
    const { prefix } = settings
    const defPrefix = process.env.CLIENT_PREFIX

    if (msg.content.startsWith(prefix) || msg.content.startsWith(defPrefix)) return container

    const splitMsg = msg.content.split(' ')
    if (!splitMsg[0].match(new RegExp('<@!*' + client.user.id + '>'))) return

    if (splitMsg[1] === 'help' || splitMsg[1] === 'prefix') {
      container._overwrite = { trigger: splitMsg[1], rawArgs: splitMsg.slice(2) }
      return container
    }

    const cleverbot = modules.get('cleverbot')
    if (!cleverbot) return
    await cleverbot.respond(msg.cleanContent.split(' ').slice(1).join(' '), msg.channel)

    logger.info(`${chalk.bold.magenta(
      !isPrivate
      ? msg.guild.name
      : '(in PMs)'
    )} > ${chalk.bold.green(msg.author.username)}: ` +
    `${chalk.bold.yellow(msg.cleanContent.replace(/\n/g, ' '))}`)
    return
  }
}
