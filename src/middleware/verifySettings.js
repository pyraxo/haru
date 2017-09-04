module.exports = {
  priority: 5,
  process: async container => {
    const { client, msg } = container
    const isPrivate = container.isPrivate = !msg.channel.guild
    const db = client.plugins.get('db')
    if (!db) return

    try {
      if (isPrivate) {
        const channel = await client.getDMChannel(msg.author.id)
        container.settings = new db.models.Guild({ id: channel.id })
        return container
      }
      const settings = await db.data.Guild.fetch(msg.channel.guild.id)
      settings.deleted = false
      await settings.save()
      container.settings = settings
      return container
    } catch (err) {
      throw err
    }
  }
}
