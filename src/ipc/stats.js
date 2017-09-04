module.exports = function stats (msg, client) {
  const guildArr = [...client.guilds.values()]
  try {
    process.send({
      op: 'resp',
      d: {
        us: client.users.map(u => u.id).join(';'),
        gs: client.guilds.map(g => g.id).join(';'),
        tc: guildArr.reduce((p, c) => {
          p += c.channels.filter(ch => ch.type === 0).length
          return p
        }, 0),
        vc: guildArr.reduce((p, c) => {
          p += c.channels.filter(ch => ch.type === 2).length
          return p
        }, 0)
      }
    })
  } catch (err) {
    process.send({ op: 'resp', d: err.toString() })
  }
}
