const util = require('util')

module.exports = function evaluate (msg, client) {
  const content = msg.d ? msg.d.content || true : true
  const id = parseInt(process.env['NODE_APP_INSTANCE'], 10) % parseInt(process.env['CLIENT_PROCESSES'], 10)
  let resp
  try {
    resp = eval(String(content)) // eslint-disable-line
  } catch (err) {
    resp = `${err.message}\n\n${err.stack}`
  }
  if (Array.isArray(resp) || typeof resp === 'object') {
    resp = util.inspect(resp)
  }

  process.send({ op: 'resp', d: { resp, id }, code: msg.code, dest: msg.origin })
}
