const chalk = require('chalk')
const logger = require('winston')

module.exports = {
  priority: 100,
  process: async container => {
    const { msg, isPrivate, isCommand, cache, commander, trigger } = container
    if (!isCommand) return
    logger.info(`${chalk.bold.magenta(
      !isPrivate
      ? msg.guild.name
      : '(in PMs)'
    )} > ${chalk.bold.green(msg.author.username)}: ` +
    `${chalk.bold.blue(msg.cleanContent.replace(/\n/g, ' '))}`)

    cache.client.multi()
    .incr(`cmdUsage:${commander.get(trigger).cmd.labels[0]}`)
    .incr('cmdUsage')
    .exec()

    return container
  }
}
