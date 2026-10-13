import test from 'node:test'
import assert from 'node:assert/strict'
import { ivNatures,natureStatEffect } from '../src/utils/ivCalculator.js'
import { emeraldTypes,typeMultiplier } from '../src/utils/typeMatchups.js'
import { pickupBands } from '../src/data/pickupResources.js'
import { itemNames } from '../src/data/emeraldData.js'
test('nature chart contains five neutral natures and twenty distinct stat pairs',()=>{
 const keys=['attack','defense','spAttack','spDefense','speed'];let neutral=0;const pairs=new Set()
 for(const nature of ivNatures){const raised=keys.filter(key=>natureStatEffect(nature,key)===1);const lowered=keys.filter(key=>natureStatEffect(nature,key)===-1);if(!raised.length){neutral++;assert.equal(lowered.length,0)}else{assert.equal(raised.length,1);assert.equal(lowered.length,1);pairs.add(`${raised[0]}:${lowered[0]}`)}}
 assert.equal(neutral,5);assert.equal(pairs.size,20)
})
test('Gen III chart preserves immunities and Steel resistances',()=>{
 assert.equal(emeraldTypes.length,17)
 for(const attack of emeraldTypes)for(const defense of emeraldTypes)assert.ok([0,0.5,1,2].includes(typeMultiplier(attack,[defense])))
 for(const [attack,defense] of [['NORMAL','GHOST'],['FIGHTING','GHOST'],['GHOST','NORMAL'],['ELECTRIC','GROUND'],['GROUND','FLYING'],['PSYCHIC','DARK'],['POISON','STEEL']])assert.equal(typeMultiplier(attack,[defense]),0)
 assert.equal(typeMultiplier('GHOST',['STEEL']),0.5);assert.equal(typeMultiplier('DARK',['STEEL']),0.5)
 assert.equal(typeMultiplier('FIRE',['GRASS']),2);assert.equal(typeMultiplier('GRASS',['FIRE']),0.5)
})
test('Pickup ranges cover levels 1–100 with valid items and 100% conditional rates',()=>{
 assert.equal(pickupBands.length,10)
 for(const [index,band] of pickupBands.entries()){
  assert.equal(band.min,index*10+1);assert.equal(band.max,(index+1)*10)
  assert.equal(band.items.reduce((sum,item)=>sum+item.chance,0),100)
  for(const item of band.items)assert.ok(itemNames[item.item])
 }
 assert.equal(pickupBands[9].items.find(item=>item.code==='TM26').chance,1)
})

test('all handheld Pickup and Pyramid tables have complete rates and unique items', async()=>{
 const {pickupGames}=await import('../src/data/pickupResources.js')
 const {pyramidPickup}=await import('../src/data/pyramidPickup.js')
 assert.deepEqual(Object.keys(pickupGames),['Emerald','Ruby / Sapphire','FireRed / LeafGreen'])
 assert.equal(pyramidPickup.length,20)
 for(const bands of [...Object.values(pickupGames),pyramidPickup])for(const band of bands){
  assert.equal(band.items.reduce((sum,entry)=>sum+entry.chance,0),100)
  assert.equal(new Set(band.items.map(entry=>entry.item)).size,band.items.length)
  for(const entry of band.items)assert.ok(itemNames[entry.item])
 }
 assert.equal(pickupGames['Ruby / Sapphire'][0].items.find(entry=>entry.item===68).chance,10)
 assert.equal(pickupGames['FireRed / LeafGreen'][0].items.find(entry=>entry.code==='TM10').chance,5)
 assert.equal(pyramidPickup[6].items.find(entry=>entry.item===141).chance,20)
})
