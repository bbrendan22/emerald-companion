import {speciesInfo} from '../data/emeraldData.js'
import {pokemonMeta} from '../data/pokemonMeta.js'
import {deoxysForms} from '../data/deoxysForms.js'
import {levelFromExperience} from './collectionDetails.js'
import {emeraldStat} from './ivCalculator.js'
const keys=['hp','attack','defense','spAttack','spDefense','speed']
export function actualBattleStats(mon){
 if(!mon)return null
 const profile=speciesInfo[mon.species];const meta=pokemonMeta[mon.species]
 if(!profile||!meta)return null
 const level=Number(mon.level??levelFromExperience(mon.experience,profile.growthRate))
 const base=meta.dex===386?deoxysForms[mon.deoxysForm??'speed']?.baseStats??profile.baseStats:profile.baseStats
 const stats=Object.fromEntries(keys.map(key=>{const stored=key==='hp'?mon.maxHp:mon[key];return [key,stored??emeraldStat(base[key],key,Number(mon.ivs?.[key]??0),Number(mon.evs?.[key]??0),level,mon.nature||'Hardy',meta.dex===292)]}))
 return {level,stats}
}
