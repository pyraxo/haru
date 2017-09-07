module.exports = function reloadFile (msg, client) {
  const plugin = client.plugins.get(msg.d.type || 'commands')
  if (!plugin) {
    process.send({ op: 'resp', d: 'invalid plugin', dest: msg.origin, code: msg.code })
  }

  try {
    if (typeof plugin.reload === 'function') {
      plugin.reload()
    }
    process.send({ op: 'resp', d: 'success', dest: msg.origin, code: msg.code })
  } catch (err) {
    process.send({ op: 'resp', d: err.toString(), dest: msg.origin, code: msg.code })
  }
}
