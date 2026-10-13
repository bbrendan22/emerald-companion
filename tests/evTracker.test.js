import test from 'node:test'
import assert from 'node:assert/strict'
import {emptyEVs,gainBattleEVs,totalEVs,trainingSpots,evStats} from '../src/utils/evTracker.js'
import {pokemonMeta} from '../src/data/pokemonMeta.js'
const id=name=>Object.keys(pokemonMeta).find(id=>pokemonMeta[id].name===name)
test('battle yields apply each modifier and all mixed stats',()=>{
 assert.equal(gainBattleEVs(emptyEVs(),id('Whismur')).hp,1)
 assert.equal(gainBattleEVs(emptyEVs(),id('Whismur'),true).hp,2)
 assert.equal(gainBattleEVs(emptyEVs(),id('Whismur'),false,true).hp,2)
 assert.equal(gainBattleEVs(emptyEVs(),id('Whismur'),true,true).hp,4)
 const mixed=gainBattleEVs(emptyEVs(),id('Bulbasaur'),true,true)
 assert.equal(mixed.spAttack,4)
})
test('per-stat and total caps are respected in game stat order',()=>{
 const evs={...emptyEVs(),hp:254,attack:255}
 const next=gainBattleEVs(evs,id('Whismur'),true,true)
 assert.equal(next.hp,255);assert.equal(totalEVs(next),510)
 assert.deepEqual(gainBattleEVs(next,id('Whismur'),true,true),next)
 assert.equal(evs.hp,254)
 const almost={...emptyEVs(),hp:255,attack:254}
 const mixed=gainBattleEVs(almost,id('Ivysaur'),true,true)
 assert.equal(mixed.spAttack,1);assert.equal(mixed.spDefense,0)
})
test('each stat has real Emerald encounters with positive rates',()=>{
 for(const [stat] of evStats){const spots=trainingSpots(stat);assert.ok(spots.length,stat);for(const spot of spots)for(const target of spot.targets){assert.ok(target.rate>0);assert.ok(pokemonMeta[target.species])}}
})
