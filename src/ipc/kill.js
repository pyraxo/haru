module.exports = function kill (msg, client) {
  const id = parseInt(process.env['NODE_APP_INSTANCE'], 10) % parseInt(process.env['CLIENT_PROCESSES'], 10)  
  process.send({ op: 'resp', d: { resp: 'success', id }, dest: msg.origin, code: msg.code })
  setTimeout(() => process.exit(1), 3000)
}
