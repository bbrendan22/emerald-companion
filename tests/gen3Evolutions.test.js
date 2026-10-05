import test from 'node:test'
import assert from 'node:assert/strict'
import { gen3EvolutionMethods } from '../src/utils/evolutions.js'
test('Eevee friendship branches stay compact',()=>{
  assert.deepEqual(gen3EvolutionMethods({method:'FRIENDSHIP_DAY'}),[{games:null,method:'Level up · High friendship · Day'}])
  assert.deepEqual(gen3EvolutionMethods({method:'FRIENDSHIP_NIGHT'}),[{games:null,method:'Level up · High friendship · Night'}])
})
test('Beauty and Shedinja evolution descriptions stay compact',()=>{
  const rules=gen3EvolutionMethods({method:'BEAUTY',param:170})
  assert.equal(rules[0].method,'Level up · Beauty 170+')
  assert.equal(rules.length,1)
  assert.equal(gen3EvolutionMethods({method:'LEVEL_SHEDINJA',param:20})[0].method,'Nincada evolves at Level 20+ · Empty party slot')
  assert.deepEqual(gen3EvolutionMethods({method:'LEVEL',param:16}),[{games:null,method:'Level 16'}])
})
