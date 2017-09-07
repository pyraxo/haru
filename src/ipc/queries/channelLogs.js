module.exports = async function channelLogs (msg, bot) {
  const queries = msg.d.queries
  try {
    const resp = []
    for (const q of queries) {
      resp.push(await bot.getMessages(q.channel, q.limit, q.before, q.after, q.around) || null)
    }
    return process.send({
      op: 'resp',
      d: resp,
      dest: msg.origin,
      code: msg.code
    })
  } catch (err) {
    return process.send({ op: 'resp', d: err.toString(), dest: msg.origin, code: msg.code })
  }
}
