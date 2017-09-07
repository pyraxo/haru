module.exports = function query (msg, client) {
  const queries = msg.d.queries
  try {
    const resp = queries.map(q => q.input.map(i => client[q.prop].find(p => p[q.query] === i) || null))
    process.send({ op: 'resp', d: resp, dest: msg.origin, code: msg.code })
  } catch (err) {
    process.send({ op: 'resp', d: err.toString(), dest: msg.origin, code: msg.code })
  }
}
