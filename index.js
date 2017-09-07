const fs = require('fs')
const path = require('path')
const pm2 = require('pm2')

global.Promise = require('bluebird')

require('longjohn')
require('dotenv-safe').config({
  path: path.join(__dirname, '.env'),
  allowEmptyValues: true
})

!fs.existsSync('./logs') && fs.mkdirSync('./logs')

const procCount = parseInt(process.env['CLIENT_PROCESSES'], 10)

process.on('unhandledRejection', (r, p) => {
  console.error('Unhandled rejection:', p, 'reason:', r.message)
})

pm2.launchBus((err, bus) => {
  if (err) console.error(err)

  bus.on('process:msg', packet => {
    const data = packet.raw
    const payload = { op: data.op, d: data.d, origin: packet.process.pm_id, code: data.code }
    if (data.dest === -1) {
      for (let i = 0; i < procCount; i++) {
        pm2.sendDataToProcessId(i, {
          type: 'process:msg',
          data: payload,
          topic: 'broadcast'
        }, err => err && console.error(err))
      }
    } else {
      pm2.sendDataToProcessId(data.dest, {
        type: 'process:msg',
        data: payload,
        topic: 'relay'
      }, err => err && console.error(err))
    }
  })
})
