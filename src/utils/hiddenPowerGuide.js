import { calculateHiddenPower } from './hiddenPower.js'
import { typeMultiplier } from './typeMatchups.js'
export const hiddenPowerTypes=['Fighting','Flying','Poison','Ground','Rock','Bug','Ghost','Steel','Fire','Water','Grass','Electric','Psychic','Ice','Dragon','Dark']
export const hiddenPowerStatOrder=['hp','attack','defense','spAttack','spDefense','speed']
export function highestHiddenPowerIVs(type) {
 const spreads=[]
 for(let mask=0;mask<64;mask++) {
  const ivs=Object.fromEntries(hiddenPowerStatOrder.map((key,index)=>[key,30+((mask>>index)&1)]))
  const result=calculateHiddenPower(ivs)
  if(result.type===type && result.power===70)spreads.push(ivs)
 }
 return spreads.sort((a,b)=>Object.values(b).reduce((s,v)=>s+v,0)-Object.values(a).reduce((s,v)=>s+v,0) || hiddenPowerStatOrder.reduce((comparison,key)=>comparison || b[key]-a[key],0))[0]
}
// Targets have no Gen III ability that alters these type-effectiveness messages.
export const hiddenPowerTestTargets=[
 {name:'Abra',type:'PSYCHIC',dex:63},{name:'Rattata',type:'NORMAL',dex:19},
 {name:'Machop',type:'FIGHTING',dex:66},{name:'Charmander',type:'FIRE',dex:4},
 {name:'Squirtle',type:'WATER',dex:7},{name:'Treecko',type:'GRASS',dex:252},
 {name:'Pikachu',type:'ELECTRIC',dex:25},{name:'Sandshrew',type:'GROUND',dex:27},
 {name:'Ekans',type:'POISON',dex:23},{name:'Caterpie',type:'BUG',dex:10},
 {name:'Shuppet',type:'GHOST',dex:353},{name:'Snorunt',type:'ICE',dex:361},
 {name:'Bagon',type:'DRAGON',dex:371},{name:'Sudowoodo',type:'ROCK',dex:185},
 {name:'Mawile',type:'STEEL',dex:303},{name:'Poochyena',type:'DARK',dex:261},
]
export function testEffectiveness(type,target){return typeMultiplier(type.toUpperCase(),[target.type])}
export function nextHiddenPowerTest(candidates) {
 return hiddenPowerTestTargets.map(target=>({target,score:Math.max(...[0,0.5,1,2].map(value=>candidates.filter(type=>testEffectiveness(type,target)===value).length))})).sort((a,b)=>a.score-b.score)[0].target
}
