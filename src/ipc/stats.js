module.exports = function stats (msg, client) {
  const guildArr = [...client.guilds.values()]
  try {
    process.send({
      op: 'resp',
      d: {
        us: client.users.map(u => u.id),
        gs: client.guilds.map(g => g.id),
        tc: guildArr.reduce((p, c) => {
          p += c.channels.filter(ch => ch.type === 0).length
          return p
        }, 0),
        vc: guildArr.reduce((p, c) => {
          p += c.channels.filter(ch => ch.type === 2).length
          return p
        }, 0)
      },
      dest: msg.origin,
      code: msg.code
    })
  } catch (err) {
    process.send({ op: 'resp', d: err.toString(), dest: msg.origin, code: msg.code })
  }
}
