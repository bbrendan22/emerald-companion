import test from 'node:test'
import assert from 'node:assert/strict'
import { emeraldStat, natureStatEffect, ivNatures } from '../src/utils/ivCalculator.js'
import { deoxysForms } from '../src/data/deoxysForms.js'
import { minimumStatEV } from '../src/utils/evPlanner.js'

test('known level 50 Swampert stats include EV and nature rounding',()=>{
 assert.equal(emeraldStat(100,'hp',31,252,50,'Adamant'),207)
 assert.equal(emeraldStat(110,'attack',31,252,50,'Adamant'),178)
 assert.equal(emeraldStat(85,'spAttack',31,0,50,'Adamant'),94)
 assert.equal(emeraldStat(60,'speed',31,4,50,'Adamant'),81)
 assert.equal(emeraldStat(60,'speed',31,3,50,'Adamant'),80)
})
test('all four Deoxys forms produce their distinct level 100 stats',()=>{
 for(const [form,expected] of [['normal',[336,136,336]],['attack',[396,76,336]],['defense',[176,356,216]],['speed',[226,216,396]]]) {
  const base=deoxysForms[form].baseStats
  assert.deepEqual(['attack','defense','speed'].map(key=>emeraldStat(base[key],key,31,0,100,'Hardy')),expected)
 }
})
test('nature indicators match all 25 nature modifiers, excluding HP',()=>{
 const order=['attack','defense','speed','spAttack','spDefense']
 for(const [index,nature] of ivNatures.entries()) {
  for(const key of [...order,'hp']) {
   const expected=key==='hp' || Math.floor(index/5)===index%5 ? 0 : order[Math.floor(index/5)]===key ? 1 : order[index%5]===key ? -1 : 0
   assert.equal(natureStatEffect(nature,key),expected)
   if(key!=='hp')assert.equal(emeraldStat(100,key,0,0,50,nature),expected===1?115:expected===-1?94:105)
  }
 }
 assert.equal(natureStatEffect('', 'speed'),0)
})
test('target finder remains correct across forms and IV/nature combinations',()=>{
 for(const form of Object.values(deoxysForms)) for(const level of [50,100]) for(const iv of [0,31]) for(const nature of ['Hardy','Jolly','Brave']) {
  const base=form.baseStats.speed
  const target=emeraldStat(base,'speed',iv,180,level,nature)
  const ev=minimumStatEV({base,key:'speed',iv,level,nature,otherEVs:0,target})
  assert.ok(emeraldStat(base,'speed',iv,ev,level,nature)>=target)
  if(ev>0)assert.ok(emeraldStat(base,'speed',iv,ev-1,level,nature)<target)
 }
})
