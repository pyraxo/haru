module.exports = function reloadFile (msg, client) {
  const plugin = client.plugins.get(msg.d.type || 'commands')
  const id = parseInt(process.env['NODE_APP_INSTANCE'], 10) % parseInt(process.env['CLIENT_PROCESSES'], 10)
  let payload = {
    op: 'resp',
    dest: msg.origin,
    code: msg.code,
    id: id
  }
  if (!plugin) {
    payload.d = { resp: 'invalid plugin' }
    process.send(payload)
    return
  }

  try {
    if (typeof plugin.reload === 'function') {
      plugin.reload()
    }
    payload.d = { resp: 'success' }
  } catch (err) {
    payload.d = { resp: err.toString() }
  } finally {
    process.send(payload)
  }
}
