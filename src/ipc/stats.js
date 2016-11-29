module.exports = async function stats (msg, bot) {
  const client = bot.engine.client

  const guildArr = [...client.guilds.values()]
  try {
    process.send({
      op: 'resp',
      d: {
        u: client.users.size,
        g: client.guilds.size,
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
