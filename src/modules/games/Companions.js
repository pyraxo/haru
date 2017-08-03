const fs = require('fs')
const path = require('path')
const logger = require('winston')

const { Module, Collection } = require('../../core')

class Companions extends Module {
  constructor (...args) {
    super(...args, {
      name: 'companions',
      localeKey: 'companion'
    })

    this.db = this.bot.engine.db.data

    /*
      Outcomes:
      0 --> MISS
      1 --> HIT
      2 --> HEAL
    */
    this.outcomes = Array(100).fill(0, 0, 34).fill(1, 34, 89).fill(2, 89)
  }

  init () {
    this.battles = new Collection()
    fs.readFile(path.join(this.bot.paths.resources, 'config', 'companions.json'), (err, res) => {
      if (err) {
        logger.error('Could not read companions configuration')
        logger.error(err)
        return
      }

      this._data = JSON.parse(fs.readFileSync(path.join(this.bot.paths.resources, 'config', 'companions.json')))
      this._check = setInterval(() => this.checkBattles(), 2000)
    })
  }

  unload () {
    clearTimeout(this._check)
    delete this._check
    delete this.battles
    delete this._data
  }

  get pets () {
    return this._data.companions
  }

  get prices () {
    return this._data.prices
  }

  /*
    Battle states:
    0 --> NULL
    1 --> WAITING
    2 --> BETTING
    3 --> BATTLE READY
    4 --> BATTLE ONGOING
    5 --> BATTLE END
  */

  initBattle (p1, p2, channel, settings, responder, time = 60, fee = 1000) {
    if (this.battles.has(channel.id)) return Promise.reject('ongoingBattle')
    if (this.battles.find(b => b.p1 === p1.id || b.p2 === p1.id)) {
      return Promise.reject('userInBattle')
    } else if (this.battles.find(b => b.p1 === p2.id || b.p2 === p2.id)) {
      return Promise.reject('opponentInBattle')
    }
    const battle = {
      p1: p1.id,
      p2: p2.id,
      channel: channel.id,
      responder: responder,
      settings: settings,
      state: 1,
      bets: { p1: {}, p2: {} },
      timer: setTimeout(() => {
        this.send(channel.id, ':rooster:  |  {{timedOut}}', {
          p1: this.bot.users.get(p1.id).mention,
          p2: this.bot.users.get(p2.id).mention,
          time: `**${time}**`
        })
        this.battles.delete(channel.id)
      }, time * 1000),
      time,
      fee,
      _stats: {},
      _actions: [],
      _msg: null,
      _turn: -1
    }
    this.battles.set(channel.id, battle)
    return Promise.resolve(battle)
  }

  updateBattle (obj, num) {
    let battle = this.getBattle(obj)
    if (!battle) return
    clearTimeout(battle.timer)
    switch (num) {
      case 0: {
        this.battles.delete(battle.channel)
        return
      }
      case 2: {
        battle.timer = setTimeout(() => this.updateBattle(battle.channel, 3), battle.time * 1000)
        break
      }
      case 3: {
        this.startBattle(battle.channel)
        break
      }
    }
    battle.state = num
    this.battles.set(battle.channel, battle)
  }

  getBattle (obj) {
    const id = obj.id || obj
    return this.battles.get(id) || this.battles.find(b => b.p1 === id || b.p2 === id)
  }

  checkState (obj) {
    const id = obj.id || obj
    return this.battles.get(id).state || this.battles.find(b => b.p1 === id || b.p2 === id).state || 0
  }

  placeBet (obj, userid, id, amt) {
    let battle = this.getBattle(obj)
    if (!battle) return Promise.reject('noBattle')
    if (battle.state < 2) return Promise.reject('notBetting')
    if (battle.state > 2) return Promise.reject('afterBetting')
    if (typeof battle.bets[id] !== 'undefined') return Promise.reject('betMulti')
    battle.bets[userid === battle.p1 ? 'p1' : 'p2'][id] = amt
    this.battles.set(battle.channel, battle)
    return Promise.resolve(amt)
  }

  async startBattle (id) {
    let battle = this.getBattle(id)
    if (!battle) return
    const p1 = (await this.db.User.fetchJoin(battle.p1, { companion: true })).companion
    const p2 = (await this.db.User.fetchJoin(battle.p2, { companion: true })).companion
    battle._stats = {
      p1: {
        name: p1.name,
        owner: this.bot.users.get(battle.p1).mention,
        maxHp: p1.hp || 10,
        hp: p1.hp || 10,
        crit: p1.crit || 1,
        atk: p1.atk || 1,
        heal: p1.heal || 1,
        type: p1.type
      },
      p2: {
        name: p2.name,
        owner: this.bot.users.get(battle.p2).mention,
        maxHp: p2.hp || 10,
        hp: p2.hp || 10,
        crit: p2.crit || 1,
        atk: p2.atk || 1,
        heal: p2.heal || 1,
        type: p2.type
      }
    }
    battle.state = 4
    await Promise.delay(50)
    this.battles.set(battle.channel, battle)
  }

  checkBattles () {
    this.battles.forEach(battle => {
      if (battle.state !== 4) return
      let stats = battle._stats
      if (!stats.p1 || !stats.p2) return
      if (stats.p1.hp <= 0) return this.endBattle(battle, false)
      if (stats.p2.hp <= 0) return this.endBattle(battle, true)

      const responder = battle.responder
      const settings = battle.settings
      const turn = battle._turn < 0 ? ~~(Math.random() * 2) : battle._turn % 2 + 1
      const attacker = 'p' + turn
      const receiver = 'p' + (turn % 2 + 1)

      const res = this.outcomes[~~(Math.random() * 100)]
      if (!stats[attacker] || !stats[receiver]) return
      if (battle._turn < 0) battle._actions.push(':info:  **Match begins!**')
      battle._turn = turn

      const crit = stats[attacker].crit
      const critmultiplier = Array(100).fill(2, 0, crit).fill(1, crit)[~~(Math.random() * 100)]
      const heal = stats[attacker].heal
      const healmultiplier = Array(100).fill(2, 0, heal).fill(1, heal)[~~(Math.random() * 100)]
      const damagenum = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
      const actionnum = Math.floor(Math.random() * (4 - 1 + 1)) + 1;
      switch (res) {
        case 0: {
          battle._actions.push(`:dash: **${responder.t(`{{script.DODGE_${actionnum}}}`, {p1: stats[receiver].name, p2: stats[attacker].name}) }**`)
          break
        }
        case 1: {
          const dmg = (stats[attacker].atk * critmultiplier)
          battle._actions.push(`${critmultiplier > 1 ? ':anger:' : ':punch:'}  **${responder.t(`{{script.HIT_${damagenum}}}`, {p1: stats[attacker].name, p2: stats[receiver].name, dmg: dmg}) }**`)
          battle._stats[receiver].hp -= dmg
          break
        }
        case 2: {
          const heal = (1 * healmultiplier)
          battle._actions.push(`:sparkles:  **${responder.t(`{{script.HEAL_${actionnum}}}`, {p1: stats[attacker].name, heal: heal}) }**`)
          battle._stats[attacker].hp += heal
          break
        }
      }
      if (battle._actions.length > 5) battle._actions = battle._actions.slice(battle._actions.length - 5)
      const toSend = [
        `:one:  **${stats.p1.name}** - ${stats.p1.owner}`,
        this.generateGUI(stats.p1),
        '',
        `:two:  **${stats.p2.name}** - ${stats.p2.owner}`,
        this.generateGUI(stats.p2),
        '\n',
        battle._actions.join('\n')
      ].join('\n')
      if (!battle._msg) {
        return this.send(battle.channel, toSend).then(msg => {
          battle._msg = msg
          this.battles.set(battle.channel, battle)
        })
      } else {
        return battle._msg.edit(toSend)
      }
    })
  }

  generateGUI (pet) {
    if (!pet) return []

    let hearts = Array(Math.round(pet.maxHp / 2)).fill(':black_heart:')
    if (pet.hp === 1) hearts[0] = ':broken_heart:'
    else {
      for (let i = 0, j = Math.floor(pet.hp / 2); i < j; i++) {
        hearts[i] = ':heart:'
        if (pet.hp % 2 === 1 && j - i === 1) hearts[i + 1] = ':broken_heart:'
      }
    }
    return [':' + pet.type + ':'].concat(hearts).join(' ')
  }

  async endBattle (battle, player = true) {
    const winner = player ? 'p1' : 'p2'
    const loser = player ? 'p2' : 'p1'
    this.updateBattle(battle.channel, 5)

    const winUser = await this.db.User.fetchJoin(battle[winner], { companion: true })
    winUser.credits += battle.fee * 2
    winUser.companion.xp = (winUser.companion.xp || 0) + ~~(Math.random() * 5) + 2
    winUser.companion.stats.wins += 1

    const loseUser = await this.db.User.fetch(battle[loser], { companion: true })
    loseUser.companion.xp = (loseUser.companion.xp || 0) + ~~(Math.random() * 3) + 1
    loseUser.companion.stats.losses += 1
    await loseUser.saveAll({ companion: true })

    await this.send(battle.channel, [
      `:moneybag:  ${battle._stats[winner].owner} has won the pet battle and **${battle.fee}** credits, ` +
      `sponsored by the loser ${battle._stats[loser].owner}!`,
      ':hourglass:  Please hold while this match\'s bets are being processed.'
    ].join('\n'))

    let winners = []
    for (const id in battle.bets[winner]) {
      const bet = battle.bets[winner][id]
      winners.push([id, bet])
      const user = await this.db.User.fetch(id)
      user.credits += bet
      await user.save()
    }

    let losers = []
    for (const id in battle.bets[loser]) {
      const bet = battle.bets[loser][id]
      losers.push([id, bet])
      const user = await this.db.User.fetch(id)
      user.credits -= bet
      await user.save()
      winUser.credits += Math.ceil(bet / 2)
    }
    await winUser.saveAll({ companion: true })

    if (winners.length || losers.length) {
      await this.send(battle.channel, [
        winners.length
        ? ':moneybag:  **Winning Bets**:\n' +
        winners.map(b => this.bot.users.get(b[0]).username + ` -- **${b[1]} credits**`).join('\n')
        : '',
        losers.length
        ? '\n:money_with_wings:  **Losing Bets**:\n' +
        losers.map(b => this.bot.users.get(b[0]).username + ` -- **${b[1]} credits**`).join('\n')
        : ''
      ].join('\n'))
    }

    return this.updateBattle(battle.channel, 0)
  }
}

module.exports = Companions
