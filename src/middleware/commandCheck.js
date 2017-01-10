const chalk = require('chalk')
const logger = require('winston')

const { Permitter } = require('../core')

module.exports = {
  priority: 100,
  process: container => {
    const { msg, isPrivate, isCommand, cache, commander, trigger, settings, admins, _overwrite } = container
    if (!_overwrite) {
      if (!isCommand) return Promise.resolve()
      const cmd = commander.get(trigger).cmd
      if (!(cmd.options.modOnly || cmd.options.adminOnly || admins.includes(msg.author.id))) {
        const isAllowed = Permitter.verifyMessage(cmd.permissionNode, msg, settings.permissions)
        if (!isAllowed) return Promise.resolve()
      }

      cache.client.multi()
      .hincrby('usage', commander.get(trigger).cmd.labels[0], 1)
      .hincrby('usage', 'ALL', 1)
      .exec()
    }

    logger.info(
      `${chalk.bold.magenta(
        !isPrivate
        ? msg.guild.name
        : '(in PMs)'
      )} > ${chalk.bold.green(msg.author.username)}: ` +
      `${chalk.bold.blue(msg.cleanContent.replace(/\n/g, ' '))}`
    )

    return Promise.resolve(container)
  }
}
