global.Promise = require('bluebird')

const util = require('util')
const chalk = require('chalk')
const path = require('path')
const moment = require('moment')
const winston = require('winston')

require('longjohn')
require('winston-daily-rotate-file')
require('dotenv-safe').config({
  path: path.join(__dirname, '.env'),
  allowEmptyValues: true
})
require('moment-duration-format')

const processShards = parseInt(process.env.CLIENT_SHARDS_PER_PROCESS, 10)
const firstShardID = parseInt(process.env.BASE_SHARD_ID, 10) * processShards
const lastShardID = firstShardID + processShards - 1

const debugMode = process.env.CLIENT_DEBUG === 'true'
const fileOptions = {
  colorize: false,
  datePattern: '.yyyy-MM-dd',
  prepend: true,
  json: false,
  formatter: function ({ level, message = '', meta = {}, formatter, depth, colorize }) {
    const timestamp = moment().format('YYYY-MM-DD hh:mm:ss a')
    const obj = Object.keys(meta).length
    ? `\n\t${meta.stack ? meta.stack : util.inspect(meta, false, depth || null, colorize)}`
    : ''
    return `${timestamp} ${level.toUpperCase()} ${chalk.stripColor(message)} ${obj}`
  }
}

winston.configure({
  transports: [
    new (winston.transports.Console)({
      level: debugMode ? 'silly' : 'verbose',
      colorize: true,
      label: process.env.BASE_SHARD_ID
      ? processShards > 1
        ? `S ${firstShardID}-${lastShardID}`
        : `S ${process.env.SHARD_ID}`
      : 'MASTER',
      timestamp: () => `[${chalk.cyan(moment().format('HH:mm:ss'))}]`
    }),
    new (winston.transports.DailyRotateFile)(Object.assign(fileOptions, {
      name: 'info-file',
      filename: path.join(__dirname, 'logs/info.log'),
      level: 'info'
    })),
    new (winston.transports.DailyRotateFile)(Object.assign(fileOptions, {
      name: 'error-file',
      filename: path.join(__dirname, 'logs/error.log'),
      level: 'error'
    }))
  ]
})

process.on('unhandledRejection', (reason, promise) => {
  if (typeof reason === 'undefined') return
  winston.error(`Unhandled rejection: ${reason} - ${util.inspect(promise)}`)
})

if (debugMode) {
  winston.debug('Running in debug mode')
  require('./src')
} else {
  require('./build')
}
