const { Module } = require('../../core')

class Battles extends Module {
  constructor (...args) {
    super(...args, {
      name: 'companions.battles',
      events: {}
    })
  }
}

module.exports = Battles
