module.exports = {
  priority: 10,
  process: container => {
    const { settings, msg, commander, _overwrite } = container
    const { prefix } = settings

    if (!_overwrite) {
      const rawArgs = msg.content.substring(prefix.length).split(' ')
      container.trigger = rawArgs[0].toLowerCase()
      container.isCommand = commander.has(container.trigger)
      container.rawArgs = rawArgs.slice(1).filter(v => !!v)
    } else {
      container.trigger = _overwrite.trigger
      container.isCommand = true
      container.rawArgs = _overwrite.rawArgs
    }

    return Promise.resolve(container)
  }
}
