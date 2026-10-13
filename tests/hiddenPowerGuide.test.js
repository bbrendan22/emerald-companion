import test from 'node:test'
import assert from 'node:assert/strict'
import { hiddenPowerTypes, highestHiddenPowerIVs, hiddenPowerStatOrder, hiddenPowerTestTargets, nextHiddenPowerTest, testEffectiveness } from '../src/utils/hiddenPowerGuide.js'
import { calculateHiddenPower } from '../src/utils/hiddenPower.js'
test('highest-IV spreads give the selected type at power 70 and maximize IV total',()=>{
 for(const type of hiddenPowerTypes) {
  const best=highestHiddenPowerIVs(type)
  assert.deepEqual(calculateHiddenPower(best),{type,power:70})
  for(let mask=0;mask<64;mask++) {
   const spread=Object.fromEntries(hiddenPowerStatOrder.map((key,i)=>[key,30+((mask>>i)&1)]))
   if(calculateHiddenPower(spread).type===type)assert.ok(Object.values(best).reduce((a,b)=>a+b,0)>=Object.values(spread).reduce((a,b)=>a+b,0))
  }
 }
})
test('manual effectiveness flow identifies every possible Hidden Power type',()=>{
 for(const actual of hiddenPowerTypes) {
  let candidates=[...hiddenPowerTypes]
  let target=hiddenPowerTestTargets[0]
  let steps=0
  while(candidates.length>1 && steps<10) {
   const result=testEffectiveness(actual,target)
   candidates=candidates.filter(type=>testEffectiveness(type,target)===result)
   target=nextHiddenPowerTest(candidates)
   steps++
  }
  assert.deepEqual(candidates,[actual])
 }
})
test('Hidden Power type and power bits are independent with correct Gen III endpoints',()=>{
 const spread=value=>Object.fromEntries(hiddenPowerStatOrder.map(key=>[key,value]))
 assert.deepEqual(calculateHiddenPower(spread(0)),{type:'Fighting',power:30})
 assert.deepEqual(calculateHiddenPower(spread(1)),{type:'Dark',power:30})
 assert.deepEqual(calculateHiddenPower(spread(2)),{type:'Fighting',power:70})
 assert.deepEqual(calculateHiddenPower(spread(31)),{type:'Dark',power:70})
 assert.deepEqual(calculateHiddenPower({...spread(31),spAttack:30}),{type:'Electric',power:70})
 for(let bits=0;bits<4096;bits++) {
  const low=Object.fromEntries(hiddenPowerStatOrder.map((key,i)=>[key,(bits>>(i*2))&3]))
  const high=Object.fromEntries(hiddenPowerStatOrder.map(key=>[key,low[key]+28]))
  assert.deepEqual(calculateHiddenPower(low),calculateHiddenPower(high))
 }
 assert.equal(calculateHiddenPower({...spread(31),hp:''}),null)
 assert.equal(calculateHiddenPower({...spread(31),hp:32}),null)
})
