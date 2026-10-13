import { emeraldStat } from './ivCalculator.js'
export function minimumStatEV({base,key,iv,level,nature,otherEVs,target,shedinja=false}) {
  if(!Number.isInteger(target) || target<1) return null
  for(let ev=0;ev<=Math.min(255,510-otherEVs);ev++) {
    if(emeraldStat(base,key,iv,ev,level,nature,shedinja)>=target) return ev
  }
  return null
}
