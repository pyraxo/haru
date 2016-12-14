module.exports = async function query (msg, bot) {
  const queries = msg.d.queries
  try {
    const resp = queries.map(q => q.input.map(i => bot[q.prop].find(p => p[q.query] === i) || null))
    process.send({
      op: 'resp',
      d: resp
    })
  } catch (err) {
    process.send({ op: 'resp', d: err.toString() })
  }
}
