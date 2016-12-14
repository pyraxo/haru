module.exports = {
  type: 'command',
  resolve: (content, { group }, msg, { engine }) => {
    const command = engine.commands.get(content)
    return !command ||
    ((command.options || {}).adminOnly && !process.env.ADMIN_IDS.split(', ').includes(msg.author.id))
    ? Promise.reject('command.NOT_FOUND')
    : Promise.resolve(command)
  }
}
