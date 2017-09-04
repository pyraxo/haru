const chalk = require('chalk')

const { Permitter } = require('sylphy')

module.exports = {
  priority: 100,
  process: container => {
    const { msg, client, isPrivate, isCommand, commands, trigger, settings, admins, _overwrite } = container
    if (!_overwrite) {
      const cache = client.plugins.get('cache')
      if (!cache) return

      if (!isCommand) return Promise.resolve()
      const cmd = commands.get(trigger)
      if (!(cmd.options.modOnly || cmd.options.adminOnly || admins.includes(msg.author.id))) {
        const isAllowed = Permitter.verifyMessage(cmd.permissionNode, msg, settings.permissions)
        if (!isAllowed) return Promise.resolve()
      }

      cache.client.multi()
      .hincrby('usage', commands.get(trigger).triggers[0], 1)
      .hincrby('usage', 'ALL', 1)
      .exec()
    }

    client.logger.info(
      `${chalk.bold.magenta(
        !isPrivate
        ? msg.channel.guild.name
        : '(in PMs)'
      )} > ${chalk.bold.green(msg.author.username)}: ` +
      `${chalk.bold.blue(msg.cleanContent.replace(/\n/g, ' '))}`
    )

    return Promise.resolve(container)
  }
}
