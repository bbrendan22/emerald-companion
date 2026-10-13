import test from 'node:test'
import assert from 'node:assert/strict'
import { minimumStatEV } from '../src/utils/evPlanner.js'
import { emeraldStat } from '../src/utils/ivCalculator.js'

test('planner finds minimum EV investment, accounting for level and nature',()=>{
 const build={base:60,key:'speed',iv:31,level:50,nature:'Jolly',otherEVs:252,target:100}
 const ev=minimumStatEV(build)
 assert.ok(ev>0)
 assert.ok(emeraldStat(60,'speed',31,ev,50,'Jolly')>=100)
 assert.ok(emeraldStat(60,'speed',31,ev-1,50,'Jolly')<100)
 assert.equal(minimumStatEV({...build,target:999}),null)
})
test('planner respects remaining EVs and zero investment targets',()=>{
 const build={base:60,key:'speed',iv:31,level:50,nature:'Hardy',otherEVs:510,target:80}
 assert.equal(minimumStatEV(build),0)
 assert.equal(minimumStatEV({...build,target:100}),null)
 assert.equal(minimumStatEV({...build,target:1.5}),null)
})
test('Shedinja HP never exceeds one',()=>{
 assert.equal(minimumStatEV({base:1,key:'hp',iv:31,level:100,nature:'Hardy',otherEVs:0,target:2,shedinja:true}),null)
})
