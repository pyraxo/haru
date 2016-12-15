module.exports = async function stats (msg, bot) {
  const guildArr = [...bot.guilds.values()]
  try {
    process.send({
      op: 'resp',
      d: {
        u: bot.users.size,
        g: bot.guilds.size,
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
