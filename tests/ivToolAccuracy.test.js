import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateIVRanges, emeraldStat, ivStats } from '../src/utils/ivCalculator.js'
import { deoxysForms } from '../src/data/deoxysForms.js'
const evs=Object.fromEntries(ivStats.map(([key])=>[key,0]))
test('level 100 readings recover every known IV exactly',()=>{
 for(const form of Object.values(deoxysForms)) {
  const stats=Object.fromEntries(ivStats.map(([key])=>[key,emeraldStat(form.baseStats[key],key,17,0,100,'Hardy')]))
  const result=calculateIVRanges(form.baseStats,'Hardy',[{level:100,stats,evs}])
  for(const [key] of ivStats)assert.deepEqual(result.ranges[key],[17])
 }
})
test('lower level uncertainty, blanks, and impossible stats remain distinct',()=>{
 const base=deoxysForms.normal.baseStats
 const stats=Object.fromEntries(ivStats.map(([key])=>[key,'']))
 stats.attack=emeraldStat(base.attack,'attack',17,0,5,'Hardy')
 const result=calculateIVRanges(base,'Hardy',[{level:5,stats,evs}])
 assert.ok(result.ranges.attack.includes(17))
 assert.ok(result.ranges.attack.length>1)
 assert.equal(result.ranges.hp,null)
 stats.attack=999
 assert.deepEqual(calculateIVRanges(base,'Hardy',[{level:5,stats,evs}]).ranges.attack,[])
})
test('Shedinja HP leaves all 32 IVs possible and EV budget is enforced',()=>{
 const stats=Object.fromEntries(ivStats.map(([key])=>[key,'']))
 stats.hp=1
 assert.equal(calculateIVRanges(deoxysForms.normal.baseStats,'Hardy',[{level:50,stats,evs}],true).ranges.hp.length,32)
 assert.ok(calculateIVRanges(deoxysForms.normal.baseStats,'Hardy',[{level:50,stats,evs:{...evs,hp:255,attack:255,speed:1}}]).error)
})
