import {calculateBattleDamage,battleCurrentHp,hasFocusBand} from './battleDamage.js'
import {battleMoveEffectiveness} from './battleMoveEffectiveness.js'
const physical=new Set(['NORMAL','FIGHTING','FLYING','POISON','GROUND','ROCK','BUG','GHOST','STEEL'])
export function retaliationPreview(move,user,target){
 if(!user||!target)return {message:'Select both Pokémon.'}
 if(battleCurrentHp(user)===0||battleCurrentHp(target)===0)return {message:'A fainted Pokémon cannot retaliate or be targeted.'}
 const wantPhysical=move.effect==='COUNTER'
 const rows=(target.moves??[]).filter(incoming=>incoming?.power>0).map(incoming=>{
  if(['COUNTER','MIRROR_COAT'].includes(incoming.effect))return null
  const result=calculateBattleDamage(incoming,target,user)
  const eligible=(result.scenarios??[]).filter(scenario=>(incoming.effect==='HIDDEN_POWER'||physical.has(scenario.type??result.type))===wantPhysical)
  if(result.message){
   if(incoming.effect==='HIDDEN_POWER'||physical.has(incoming.type)!==wantPhysical)return null
   return {name:incoming.name,message:'Retaliation preview unavailable for this move.'}
  }
  if(!eligible.length)return null
  if(incoming.effect==='EXPLOSION')return {name:incoming.name,message:'Opponent faints before retaliation.'}
  if(result.multiHit||incoming.effect==='TRIPLE_KICK')return {name:incoming.name,message:'Multi-hit retaliation preview unavailable.'}
  const scenarios=eligible.map(scenario=>{
   const rolls=scenario.rolls??[scenario.min]
   const outcomes=scenario.damageOutcomes??rolls.map(damage=>({damage,chance:1/rolls.length}))
   const survived=outcomes.filter(o=>o.damage>0&&o.damage<battleCurrentHp(user))
   if(rolls.every(value=>value===0))return {message:'No incoming damage; no retaliation.'}
   if(!survived.length)return {message:'User faints before retaliating.'}
   const blocked=battleMoveEffectiveness({...move,power:80,effect:'HIT'},{...target,ability:scenario.attackAbility},user.ivs,user).multiplier===0
   const returned=survived.map(o=>({...o,damage:blocked?0:o.damage*2}))
   return {opponentAbility:scenario.attackAbility,userAbility:scenario.defendAbility,minPercent:Math.min(...returned.map(o=>o.damage))/target.stats.hp*100,maxPercent:Math.max(...returned.map(o=>o.damage))/target.stats.hp*100,koChance:returned.reduce((sum,o)=>sum+(o.damage>=battleCurrentHp(target)?o.chance:0),0)*100*(hasFocusBand(target)?.9:1),survivalChance:survived.reduce((sum,o)=>sum+o.chance,0)*100,blocked}
  })
  return {name:incoming.name,scenarios}
 }).filter(Boolean)
 return {rows}
}
