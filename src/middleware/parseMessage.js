module.exports = {
  priority: 10,
  process: container => {
    const { settings, msg, commands, _overwrite } = container
    const { prefix } = settings
<<<<<<< HEAD
    const defPrefix = `<@${client.user.id}>`

    if (!_overwrite) {
      var newfix = msg.content
      if (msg.content.startsWith(prefix)) {
        newfix = prefix
      } else if (msg.content.split(' ')[0].match(new RegExp(defPrefix))) {
        newfix = defPrefix + ' '
      }
      const rawArgs = msg.content.substring(newfix.length).split(' ')
=======

    if (!_overwrite) {
      const rawArgs = msg.content.substring(prefix.length).split(' ')
>>>>>>> 609b83dc3bb91d5dc754f84a122710ed06a7a8ae
      container.trigger = rawArgs[0].toLowerCase()
      container.isCommand = commands.has(container.trigger)
      container.rawArgs = rawArgs.slice(1).filter(v => !!v)
    } else {
      container.trigger = _overwrite.trigger
      container.isCommand = true
      container.rawArgs = _overwrite.rawArgs
    }

    return Promise.resolve(container)
  }
}
