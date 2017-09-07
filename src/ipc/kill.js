module.exports = function kill (msg, client) {
  process.send({ op: 'resp', d: 'success', dest: msg.origin, code: msg.code })
  setTimeout(() => process.exit(1), 3000)
}
