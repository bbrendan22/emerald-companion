import {calculateHiddenPower} from './hiddenPower.js'
import {typeMultiplier} from './typeMatchups.js'
const explanations={
 HIDDEN_POWER:'Hidden Power’s type depends on its IVs. Complete IVs are needed.',
 OHKO:'A one-hit knockout move; success depends on level and accuracy.',
 SONICBOOM:'Deals 20 HP of damage, unless the target is immune.',
 DRAGON_RAGE:'Deals 40 HP of damage, unless the target is immune.',
 LEVEL_DAMAGE:'Damage equals the user’s level, unless the target is immune.',
 COUNTER:'Returns twice the physical damage received this turn.',
 MIRROR_COAT:'Returns twice the special damage received this turn.',
 BIDE:'Returns twice the damage stored over two turns.',
 PSYWAVE:'Damage varies with the user’s level and a random roll.',
 SUPER_FANG:'Removes half the target’s remaining HP, unless immune.',
 ENDEAVOR:'Lowers the target’s HP to the user’s remaining HP, unless immune.',
 LOW_KICK:'Power depends on the target’s weight.',
 FLAIL:'Power increases as the user’s remaining HP falls.',
 RETURN:'Power increases with friendship.',
 FRUSTRATION:'Power increases as friendship falls.',
 PRESENT:'Randomly deals damage or heals the target.',
 MAGNITUDE:'Power is chosen randomly each use.',
 FUTURE_SIGHT:'Delayed damage uses special Generation III rules and ignores type effectiveness.',
 BEAT_UP:'Damage depends on eligible party members and uses special Generation III rules.',
}
export function battleMoveEffectiveness(move,other,ivs){
 if(!move)return {label:'—',type:null}
 const hidden=move.effect==='HIDDEN_POWER'?calculateHiddenPower(ivs??{}):null
 const type=hidden?.type.toUpperCase()??move.type
 if(move.power===0)return {label:'—',type}
 const special=!hidden&&(move.power===1||['FUTURE_SIGHT','BEAT_UP'].includes(move.effect))
 if(special)return {label:'*',type,explanation:explanations[move.effect]??'This move uses special damage rules.'}
 const multiplier=other&&type?typeMultiplier(type,other.types):null
 return {label:multiplier===null?'—':`${multiplier}×`,type,multiplier}
}
