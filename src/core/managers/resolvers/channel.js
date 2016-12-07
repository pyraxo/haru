module.exports = {
  type: 'channel',
  resolve: (content, arg, msg) => {
    const guild = msg.guild
    content = String(content).toLowerCase()
    let channel = content.match(/^<#?(\d{17,18})>$/)
    if (!channel) {
      let channels = guild.members.filter(m => {
        const name = m.name.toLowerCase()
        return name === content || name.includes(content)
      })
      if (channels.length) {
        return Promise.resolve(channels)
      } else {
        return Promise.reject('channel.NOT_FOUND')
      }
    } else {
      let channel = guild.channels.get(channel[1])
      if (!channel) return Promise.reject('channel.NOT_FOUND')
      return Promise.resolve([channel])
    }
  }
}
