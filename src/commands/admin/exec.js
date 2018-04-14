const { exec } = require('child_process')
const { Command } = require('sylphy')

class Exec extends Command {
  constructor (...args) {
    super(...args, {
      name: 'exec',
      description: 'Executes a shell command',
      options: { adminOnly: true },
      group: 'admin'
    })
  }

  exec (command) {
    return new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err) return reject(err)
        return resolve(stdout || stderr)
      })
    })
  }

  async handle ({ msg, rawArgs, settings }, responder) {
    const cmd = rawArgs.join(' ')
    let result
    try {
      result = await this.exec(cmd)
    } catch (err) {
      result = err
    }
    responder.format('code:js').send(result || 'No result')
  }
}

module.exports = Exec
