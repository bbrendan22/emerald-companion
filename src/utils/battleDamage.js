import {speciesDetails} from '../data/speciesDetails.js'
import {pokemonMeta} from '../data/pokemonMeta.js'
import {stageStat,battleWeather,weatherMove} from './battleConditions.js'
import {calculateHiddenPower} from './hiddenPower.js'
import {typeMultiplier} from './typeMatchups.js'
import {battleMoveEffectiveness} from './battleMoveEffectiveness.js'
const physical=new Set(['NORMAL','FIGHTING','FLYING','POISON','GROUND','ROCK','BUG','GHOST','STEEL'])
const boosters={'Silk Scarf':'NORMAL','Black Belt':'FIGHTING','Sharp Beak':'FLYING','Poison Barb':'POISON','Soft Sand':'GROUND','Hard Stone':'ROCK','SilverPowder':'BUG','Spell Tag':'GHOST','Metal Coat':'STEEL','Charcoal':'FIRE','Mystic Water':'WATER','Miracle Seed':'GRASS','Magnet':'ELECTRIC','TwistedSpoon':'PSYCHIC','NeverMeltIce':'ICE','Dragon Fang':'DRAGON','BlackGlasses':'DARK','Sea Incense':'WATER'}
const abilities=mon=>String(mon.ability??'Unknown').split(/\s*\/\s*/)
const normalize=value=>String(value??'').toLowerCase().replace(/[^a-z]/g,'')
const weights=new Map(Object.entries(pokemonMeta).map(([id,meta])=>[meta.dex,speciesDetails[id]?.weight]))
export function lowKickPower(weight){
 if(!Number.isFinite(weight)||weight<0)return null
 const hectograms=Math.round(weight*10)
 return [[100,20],[250,40],[500,60],[1000,80],[2000,100]].find(([threshold])=>hectograms<threshold)?.[1]??120
}
export function hasFocusBand(mon){return normalize(mon.item)==='focusband'}
export function hitDamageOutcomes(rolls,hp,focusBand=false){
 const outcomes=new Map()
 for(const damage of rolls){
  const add=(value,chance)=>outcomes.set(value,(outcomes.get(value)??0)+chance/rolls.length)
  if(focusBand&&damage>=hp){add(hp-1,.1);add(damage,.9)}else add(damage,1)
 }
 return [...outcomes].map(([damage,chance])=>({damage,chance}))
}
export function multiHitKoChance(rolls,hits,hp,focusBand=false){
 let alive=new Map([[0,1]]),ko=0
 for(let hit=0;hit<hits;hit++){
  const next=new Map()
  for(const [sum,chance] of alive)for(const damage of rolls){
   // In Emerald, once Focus Band activates it protects the remaining hits too.
   const unprotected=chance/rolls.length*(focusBand?.9:1)
   if(sum+damage>=hp)ko+=unprotected
   else next.set(sum+damage,(next.get(sum+damage)??0)+unprotected)
  }
  alive=next
 }
 return ko*100
}
const fixedEffects=new Set(['LEVEL_DAMAGE','DRAGON_RAGE','SONICBOOM','SUPER_FANG','ENDEAVOR'])
function fixedBattleDamage(move,attacker,defender){
 if(move.effect==='ENDEAVOR'&&battleCurrentHp(defender)<=battleCurrentHp(attacker))return {message:'Endeavor fails when the target’s HP is not higher than the user’s.',exactMessage:true}
 const damage={LEVEL_DAMAGE:attacker.level,DRAGON_RAGE:40,SONICBOOM:20,SUPER_FANG:Math.max(1,Math.floor(battleCurrentHp(defender)/2)),ENDEAVOR:battleCurrentHp(defender)-battleCurrentHp(attacker)}[move.effect]
 const scenarios=abilities(attacker).flatMap(attackAbility=>abilities(defender).map(defendAbility=>{
  const immunity=battleMoveEffectiveness({...move,power:80,effect:'HIT'},{...defender,ability:defendAbility},attacker.ivs,attacker).multiplier===0
  const value=immunity?0:damage
  const damageOutcomes=hitDamageOutcomes([value],battleCurrentHp(defender),hasFocusBand(defender))
  return {damageOutcomes,attackAbility,defendAbility,min:value,max:value,minPercent:value/defender.stats.hp*100,maxPercent:value/defender.stats.hp*100,koChance:damageOutcomes.reduce((sum,o)=>sum+(o.damage>=battleCurrentHp(defender)?o.chance:0),0)*100}
 }))
 return {type:move.type,power:'—',category:'Fixed',scenarios}
}
export function battleCurrentHp(mon){return Math.max(0,Math.min(mon.stats.hp,Math.trunc(Number(mon.currentHp??mon.stats.hp))))}
export function friendshipMovePower(move,friendship){
 const known=friendship!==''&&friendship!=null&&Number.isInteger(Number(friendship))&&Number(friendship)>=0&&Number(friendship)<=255
 const value=known?Number(friendship):move.effect==='FRUSTRATION'?0:255
 return Math.max(1,Math.floor((move.effect==='FRUSTRATION'?255-value:value)*10/25))
}
export function hpMovePower(move,attacker){
 const current=battleCurrentHp(attacker),maximum=attacker.stats.hp
 if(['RETURN','FRUSTRATION'].includes(move.effect))return friendshipMovePower(move,attacker.friendship)
 if(move.effect==='ERUPTION')return Math.max(1,Math.floor(150*current/maximum))
 if(move.effect==='FLAIL'){const scale=Math.floor(48*current/maximum);return [[1,200],[4,150],[9,100],[16,80],[32,40],[48,20]].find(([threshold])=>scale<=threshold)[1]}
 return move.power
}
export const emeraldHitProbabilities=[{hits:2,probability:3/8},{hits:3,probability:3/8},{hits:4,probability:1/8},{hits:5,probability:1/8}]
export function multiHitDistribution(rolls,hits){
 let totals=new Map([[0,1]])
 for(let i=0;i<hits;i++){
  const next=new Map()
  for(const [sum,chance] of totals)for(const roll of rolls)next.set(sum+roll,(next.get(sum+roll)??0)+chance/rolls.length)
  totals=next
 }
 return totals
}
function multiHitDamage(move,attacker,defender){
 const single=calculateBattleDamage({...move,effect:'HIT'},attacker,defender)
 if(single.message)return single
 const hitCounts=move.effect==='MULTI_HIT'?emeraldHitProbabilities:[{hits:2,probability:1}]
 return {...single,multiHit:true,scenarios:single.scenarios.map(scenario=>{
  const hitRanges=hitCounts.map(({hits,probability})=>{
   const distribution=multiHitDistribution(scenario.rolls,hits)
   const min=Math.min(...distribution.keys()),max=Math.max(...distribution.keys())
   const koChance=multiHitKoChance(scenario.rolls,hits,battleCurrentHp(defender),hasFocusBand(defender))
   return {hits,probability,min,max,minPercent:min/defender.stats.hp*100,maxPercent:max/defender.stats.hp*100,koChance}
  })
  return {...scenario,min:hitRanges[0].min,max:hitRanges.at(-1).max,hitRanges,koChance:hitRanges.reduce((sum,row)=>sum+row.probability*row.koChance,0)}
 })}
}
// Random-power moves keep each branch separate so healing never counts as damage.
export const magnitudeOutcomes=[10,30,50,70,90,110,150].map((power,i)=>({power,label:`M${i+4} · Pwr ${power}`,probability:[.05,.1,.2,.3,.2,.1,.05][i]}))
export const presentOutcomes=[{power:40,probability:102/256},{power:80,probability:76/256},{power:120,probability:26/256}]
function randomPowerDamage(move,attacker,defender){
 const choices=move.effect==='MAGNITUDE'?magnitudeOutcomes:presentOutcomes
 const results=choices.map(choice=>calculateBattleDamage({...move,effect:'HIT',power:choice.power},attacker,defender))
 return {...results[0],power:'Varies',scenarios:results[0].scenarios.map((scenario,index)=>{
  const outcomeRanges=choices.map((choice,i)=>({...results[i].scenarios[index],...choice,label:choice.label??`Pwr ${choice.power}`}))
  const damageOutcomes=outcomeRanges.flatMap(row=>row.damageOutcomes.map(o=>({...o,chance:o.chance*row.probability})))
  if(move.effect==='PRESENT'){
   const healed=Math.min(defender.stats.hp-battleCurrentHp(defender),Math.max(1,Math.floor(defender.stats.hp/4)))
   outcomeRanges.push({label:'Heal',probability:52/256,healed})
   damageOutcomes.push({damage:0,chance:52/256})
  }
  return {...scenario,rolls:undefined,outcomeRanges,damageOutcomes,min:Math.min(...outcomeRanges.filter(r=>r.healed==null).map(r=>r.min)),max:Math.max(...outcomeRanges.filter(r=>r.healed==null).map(r=>r.max)),koChance:damageOutcomes.reduce((sum,o)=>sum+(o.damage>=battleCurrentHp(defender)?o.chance:0),0)*100}
 })}
}
function psywaveDamage(move,attacker,defender){
 const base=fixedBattleDamage({...move,effect:'LEVEL_DAMAGE'},attacker,defender)
 return {...base,scenarios:base.scenarios.map(scenario=>{
  const rolls=Array.from({length:11},(_,i)=>scenario.max===0?0:Math.floor(attacker.level*(50+i*10)/100))
  const damageOutcomes=hitDamageOutcomes(rolls,battleCurrentHp(defender),hasFocusBand(defender))
  const min=Math.min(...rolls),max=Math.max(...rolls)
  return {...scenario,rolls,damageOutcomes,min,max,minPercent:min/defender.stats.hp*100,maxPercent:max/defender.stats.hp*100,koChance:damageOutcomes.reduce((sum,o)=>sum+(o.damage>=battleCurrentHp(defender)?o.chance:0),0)*100}
 })}
}
function tripleKickDamage(move,attacker,defender){
 const kicks=[10,20,30].map(power=>calculateBattleDamage({...move,effect:'HIT',power},attacker,defender))
 return {...kicks[0],power:'10/20/30',multiHit:true,conditionalHits:true,scenarios:kicks[0].scenarios.map((scenario,index)=>{
  let accuracy=move.accuracy??90
  if(scenario.attackAbility==='Compound Eyes')accuracy=Math.floor(accuracy*130/100)
  const weather=battleWeather(attacker.weather??'none',scenario.attackAbility,scenario.defendAbility)
  if(scenario.defendAbility==='Sand Veil'&&weather==='sand')accuracy=Math.floor(accuracy*80/100)
  if(scenario.attackAbility==='Hustle')accuracy=Math.floor(accuracy*80/100)
  if(normalize(defender.item)==='brightpowder')accuracy=Math.floor(accuracy*90/100)
  if(normalize(defender.item)==='laxincense')accuracy=Math.floor(accuracy*95/100)
  const p=Math.min(1,accuracy/100)
  const hitRanges=[1,2,3].map(hits=>{
   let totals=new Map([[0,1]]),alive=new Map([[0,1]]),koChance=0
   for(let hit=0;hit<hits;hit++){
    const rolls=kicks[hit].scenarios[index].rolls,next=new Map(),nextAlive=new Map()
    for(const [sum,chance] of totals)for(const roll of rolls)next.set(sum+roll,(next.get(sum+roll)??0)+chance/rolls.length)
    for(const [sum,chance] of alive)for(const roll of rolls){
     const probability=chance/rolls.length*(hasFocusBand(defender)?.9:1)
     if(sum+roll>=battleCurrentHp(defender))koChance+=probability*100
     else nextAlive.set(sum+roll,(nextAlive.get(sum+roll)??0)+probability)
    }
    totals=next;alive=nextAlive
   }
   const min=Math.min(...totals.keys()),max=Math.max(...totals.keys())
   return {hits,probability:hits===3?p*p:p**(hits-1)*(1-p),min,max,minPercent:min/defender.stats.hp*100,maxPercent:max/defender.stats.hp*100,koChance}
  })
  return {...scenario,hitRanges,koChance:hitRanges.reduce((sum,row)=>sum+row.probability*row.koChance,0)}
 })}
}
export function calculateBattleDamage(move,attacker,defender){
 if(!move||!attacker||!defender)return {message:'Select both Pokémon to calculate damage.'}
 if(battleCurrentHp(attacker)===0||battleCurrentHp(defender)===0)return {message:'A fainted Pokémon cannot take part in this calculation.'}
 if(move.power===0)return {message:'This is a status move; it does not deal direct damage.'}
 if(['MULTI_HIT','DOUBLE_HIT','TWINEEDLE'].includes(move.effect))return multiHitDamage(move,attacker,defender)
 if(fixedEffects.has(move.effect))return fixedBattleDamage(move,attacker,defender)
 if(move.effect==='PSYWAVE')return psywaveDamage(move,attacker,defender)
 if(['MAGNITUDE','PRESENT'].includes(move.effect))return randomPowerDamage(move,attacker,defender)
 if(move.effect==='TRIPLE_KICK')return tripleKickDamage(move,attacker,defender)
 const hp=move.effect==='HIDDEN_POWER'?calculateHiddenPower(attacker.ivs??{}):null
 const baseType=hp?.type.toUpperCase()??move.type
 const basePower=move.effect==='LOW_KICK'?lowKickPower(defender.weight??weights.get(defender.dex)):hp?.power??hpMovePower(move,attacker)
 if(basePower==null)return {message:'The target’s weight is needed to calculate Low Kick.',exactMessage:true}
 if(move.name==='Struggle'||(basePower<=1&&!['ERUPTION','FLAIL','RETURN','FRUSTRATION'].includes(move.effect))||['FUTURE_SIGHT','BEAT_UP','TRIPLE_KICK','ROLLOUT','FURY_CUTTER','SPIT_UP'].includes(move.effect))return {message:move.effect==='HIDDEN_POWER'?'Complete IVs are needed to calculate Hidden Power.':'This move needs special damage handling; a standard damage range is not available yet.'}
 const scenarios=[]
 for(const attackAbility of abilities(attacker))for(const defendAbility of abilities(defender)){
  const weather=battleWeather(attacker.weather??'none',attackAbility,defendAbility)
  const adjusted=weatherMove({...move,type:baseType,power:basePower},weather)
  const {type,power}=adjusted
  const isPhysical=physical.has(type)
  const critical=Boolean(attacker.critical)&&!['Shell Armor','Battle Armor'].includes(defendAbility)
  const critBlocked=Boolean(attacker.critical)&&!critical

  const effectiveness=battleMoveEffectiveness({...move,type,power,effect:move.effect==='HIDDEN_POWER'?'HIT':move.effect},{...defender,ability:defendAbility},attacker.ivs)
  let attack=attacker.stats[isPhysical?'attack':'spAttack']
  let defense=defender.stats[isPhysical?'defense':'spDefense']
  if(isPhysical&&['Huge Power','Pure Power'].includes(attackAbility))attack*=2
  const boost=Object.entries(boosters).find(([item])=>normalize(item)===normalize(attacker.item))
  if(boost?.[1]===type)attack=Math.floor(attack*(normalize(attacker.item)==='seaincense'?105:110)/100)
  if(isPhysical&&normalize(attacker.item)==='choiceband')attack=Math.floor(attack*1.5)
  if(!isPhysical&&attacker.dex===366&&normalize(attacker.item)==='deepseatooth')attack*=2
  if(!isPhysical&&attacker.dex===25&&normalize(attacker.item)==='lightball')attack*=2
  if(isPhysical&&[104,105].includes(attacker.dex)&&normalize(attacker.item)==='thickclub')attack*=2
  if(!isPhysical&&defender.dex===366&&normalize(defender.item)==='deepseascale')defense*=2
  if(isPhysical&&defender.dex===132&&normalize(defender.item)==='metalpowder')defense*=2
  if(!isPhysical&&defendAbility==='Thick Fat'&&['FIRE','ICE'].includes(type))attack=Math.floor(attack/2)
  if(isPhysical&&attackAbility==='Hustle')attack=Math.floor(attack*1.5)
  if(isPhysical&&attackAbility==='Guts'&&attacker.status&&attacker.status!=='none')attack=Math.floor(attack*1.5)
  if(isPhysical&&defendAbility==='Marvel Scale'&&defender.status&&defender.status!=='none')defense=Math.floor(defense*1.5)
  if(isPhysical&&move.effect==='EXPLOSION')defense=Math.floor(defense/2)
  const lowHpAbility={Overgrow:'GRASS',Blaze:'FIRE',Torrent:'WATER',Swarm:'BUG'}[attackAbility]
  let effectivePower=lowHpAbility===type&&battleCurrentHp(attacker)<=Math.floor(attacker.stats.hp/3)?Math.floor(power*1.5):power

  const attackStage=attacker.stages?.[isPhysical?'attack':'spAttack']??0
  const defenseStage=defender.stages?.[isPhysical?'defense':'spDefense']??0
  attack=stageStat(attack,critical?Math.max(0,attackStage):attackStage)
  defense=stageStat(defense,critical?Math.min(0,defenseStage):defenseStage)
  let damage=Math.floor(Math.floor(attack*effectivePower*(Math.floor(2*attacker.level/5)+2)/Math.max(1,defense))/50)
  if(isPhysical&&attacker.status==='burn'&&attackAbility!=='Guts')damage=Math.floor(damage/2)
  if(!critical&&move.name!=='Brick Break'&&(isPhysical&&defender.screens?.reflect||!isPhysical&&defender.screens?.lightScreen))damage=Math.floor(damage/2)
  if(isPhysical)damage=Math.max(1,damage)
  if(!isPhysical){
   if(type==='FIRE'&&weather==='rain'||type==='WATER'&&weather==='sun')damage=Math.floor(damage/2)
   if(type==='WATER'&&weather==='rain'||type==='FIRE'&&weather==='sun')damage=Math.floor(damage*1.5)
   if(move.name==='SolarBeam'&&['rain','sand','hail'].includes(weather))damage=Math.floor(damage/2)
  }
  damage+=2
  if(critical)damage*=2
  if(move.effect==='FACADE'&&['burn','paralysis','poison','toxic'].includes(attacker.status)||move.effect==='SMELLINGSALT'&&defender.status==='paralysis')damage*=2
  if(attacker.types.includes(type))damage=Math.floor(damage*1.5)
  for(const targetType of [...new Set(defender.types)]){
   const multiplier=typeMultiplier(type,[targetType])
   damage=Math.floor(damage*multiplier)
   if(multiplier!==0&&damage===0)damage=1
  }
  const rolls=Array.from({length:16},(_,index)=>effectiveness.multiplier===0?0:Math.max(1,Math.floor(damage*(85+index)/100))).map(value=>move.effect==='FALSE_SWIPE'?Math.min(value,battleCurrentHp(defender)-1):value)
  const damageOutcomes=hitDamageOutcomes(rolls,battleCurrentHp(defender),hasFocusBand(defender))
  const min=Math.min(...rolls),max=Math.max(...rolls)
  scenarios.push({critical,critBlocked,damageOutcomes,rolls,type,power,attackAbility,defendAbility,min,max,minPercent:min/defender.stats.hp*100,maxPercent:max/defender.stats.hp*100,koChance:damageOutcomes.reduce((sum,o)=>sum+(o.damage>=battleCurrentHp(defender)?o.chance:0),0)*100})
 }
 return {type:scenarios[0].type,power:new Set(scenarios.map(s=>s.power)).size===1?scenarios[0].power:'Varies',category:physical.has(scenarios[0].type)?'Physical':'Special',scenarios}
}
