const { Module } = require('../../core')

class PetBattles extends Module {
  constructor (...args) {
    super(...args, {
      name: 'companions.battles',
      events: {}
    })
  }
}

module.exports = PetBattles
