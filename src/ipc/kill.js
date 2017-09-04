module.exports = function kill (msg, client) {
  process.send({ op: 'resp', d: 'success' })
  setTimeout(() => process.exit(1), 3000)
}
