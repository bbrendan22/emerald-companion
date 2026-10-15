import test from 'node:test'
import assert from 'node:assert/strict'
import {actualBattleStats} from '../src/utils/battleStats.js'
import {emeraldStat} from '../src/utils/ivCalculator.js'
import {speciesInfo} from '../src/data/emeraldData.js'
test('player stats use actual level and preserve recorded summary stats',()=>{
 const mon={species:160,level:96,nature:'Hardy',ivs:{speed:31},evs:{speed:252},maxHp:311,currentHp:12,attack:240,speed:220}
 const actual=actualBattleStats(mon)
 assert.equal(actual.level,96);assert.equal(actual.stats.hp,311);assert.equal(actual.stats.attack,240);assert.equal(actual.stats.speed,220)
 assert.equal(actual.stats.defense,emeraldStat(speciesInfo[160].baseStats.defense,'defense',0,0,96,'Hardy'))
})
test('manual Pokémon without recorded stats calculate at their own level',()=>{
 const result=actualBattleStats({species:160,level:96,nature:'Hardy',ivs:{speed:31},evs:{speed:252}})
 assert.equal(result.stats.speed,emeraldStat(78,'speed',31,252,96,'Hardy'))
 assert.notEqual(result.stats.speed,emeraldStat(78,'speed',31,252,100,'Hardy'))
})
