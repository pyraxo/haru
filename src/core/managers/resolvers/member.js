module.exports = {
  type: 'member',
  resolve: (content, arg, msg) => {
    const guild = msg.guild
    if (typeof content === 'undefined') {
      return Promise.reject({ message: '{{%resolver.NO_QUERY}}' })
    }
    content = String(content).toLowerCase()
    let user = content.match(/^<@!?(\d{17,18})>$/) || content.match(/^(\d{17,18})$/)
    if (!user) {
      let members = guild.members.filter(m => (
        m.user.username === content || m.nick === content ||
        `${m.user.username}#${m.user.discriminator}` === content ||
        `${m.nick}#${m.user.discriminator}` === content
      ))
      if (members.length) {
        return Promise.resolve(members)
      } else {
        return Promise.reject({ message: '{{%resolver.NO_ARG}}' })
      }
    } else {
      let member = guild.members.get(user[1])
      if (!member) return Promise.reject({ message: '{{%resolver.NO_ARG}}' })
      return Promise.resolve([member])
    }
  }
}
