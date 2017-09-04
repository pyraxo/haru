const fs = require('fs')
const chalk = require('chalk')
const path = require('path')
const moment = require('moment')
const { Crystal } = require('sylphy')

require('longjohn')
require('dotenv-safe').config({
  path: path.join(__dirname, '.env'),
  allowEmptyValues: true
})

!fs.existsSync('./logs') && fs.mkdirSync('./logs')

if (process.env['NODE_APP_INSTANCE']) {
  require('./src')
} else {
  const cluster = new Crystal(path.join('src', 'index.js'), parseInt(process.env.CLIENT_PROCESSES, 10))
  const timestamp = () => `[${chalk.grey(moment().format('HH:mm:ss'))}]`

  cluster.on('error', console.log)

  cluster.on('clusterCreate', id =>
    console.log(`${timestamp()} [MASTER]: CLUSTER ${chalk.cyan.bold(id)} ONLINE`)
  )

  cluster.createClusters().then(
    () => console.log(`${timestamp()} [MASTER]: ` + chalk.magenta('We\'re live, ladies and gentlemen.')),
    err => console.error(err)
  )
}

process.on('unhandledRejection', r => {
  console.log('Unhandled rejection:', r.stack)
})
