module.exports = function reloadFile (msg, client) {
  const plugin = client.plugins.get(msg.d.type || 'commands')
  if (!plugin) {
    process.send({ op: 'resp', d: 'invalid plugin' })
  }

  try {
    if (typeof plugin.reload === 'function') {
      plugin.reload()
    }
    process.send({ op: 'resp', d: 'success' })
  } catch (err) {
    process.send({ op: 'resp', d: err.toString() })
  }
}
