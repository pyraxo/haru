module.exports = function reloadFile (msg, client) {
  const plugin = client.plugins.get(msg.d.type || 'commands')
  const id = parseInt(process.env['NODE_APP_INSTANCE'], 10) % parseInt(process.env['CLIENT_PROCESSES'], 10)
  let payload = {
    op: 'resp',
    dest: msg.origin,
    code: msg.code
  }
  if (!plugin) {
    payload.d = { resp: 'invalid plugin', id }
    process.send(payload)
    return
  }

  try {
    if (typeof plugin.reload === 'function') {
      plugin.reload()
    }
    payload.d = { resp: 'success', id }
  } catch (err) {
    payload.d = { resp: err.toString(), id }
  } finally {
    process.send(payload)
  }
}
