module.exports = {
  priority: 5,
  process: async container => {
    const { client, msg, data, db } = container
    const isPrivate = container.isPrivate = !msg.guild
    try {
      if (isPrivate) {
        const channel = await client.getDMChannel(msg.author.id)
        container.settings = new db.Guild({ id: channel.id })
        return container
      }
      const settings = await data.Guild.fetch(msg.guild.id)
      settings.deleted = false
      await settings.save()
      container.settings = settings
      return container
    } catch (err) {
      throw err
    }
  }
}
