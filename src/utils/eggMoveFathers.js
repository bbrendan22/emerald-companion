import { eggMoves, levelMoves, breedingEvolutions } from '../data/eggMoveResources.js'
import { tutorResources } from '../data/tutorResources.js'
import { machineResources } from '../data/itemResources.js'
import { pokemonMeta } from '../data/pokemonMeta.js'
import { partnerGenders, speciesGenders } from './breeding.js'
const ids=Object.keys(pokemonMeta).filter(id=>levelMoves[id])
export function descendants(id){const found=new Set([String(id)]);for(const current of found)for(const next of breedingEvolutions[current]??[])found.add(String(next));return [...found]}
const ancestors=Object.fromEntries(ids.map(id=>[id,ids.filter(parent=>descendants(parent).includes(id))]))
const speciesId=dex=>ids.find(id=>pokemonMeta[id].dex===dex)
export function eggRequirements(id){
 const dex=pokemonMeta[id].dex
 return {incense:dex===298?'Sea Incense':dex===360?'Lax Incense':null,randomOffspring:[29,32,313,314].includes(dex)}
}
export function eggMoveMothers(id){
 const dex=pokemonMeta[id].dex
 const family=dex===32?speciesId(29):dex===313?speciesId(314):id
 return descendants(family).filter(mother=>speciesGenders(mother).includes('Female')&&ids.some(father=>partnerGenders(mother,'Female',father).includes('Male')))
}
export function findEggMoveFathers(target,move){
 const known=new Map()
 for(const id of ids){
  if(!speciesGenders(id).includes('Male'))continue
  for(const ancestor of ancestors[id]){
   const level=levelMoves[ancestor]?.find(m=>m.move===move)
   const machine=machineResources.find(m=>m.moveId===move&&m.species.includes(Number(ancestor)))
   const tutor=tutorResources.find(t=>t.moveId===move&&t.species.includes(Number(ancestor)))
   const sketch=pokemonMeta[ancestor]?.dex===235
   const method=level?`Level ${level.level}`:machine?machine.code:tutor?'Move tutor':sketch?'Sketch':null
   if(method){known.set(id,{method,learner:ancestor,steps:[]});break}
  }
 }
 const direct=new Set(known.keys())
 // Each pass adds only paths backed by an already established donor.
 let added=true
 while(added){added=false;for(const id of ids){
  if(known.has(id)||!speciesGenders(id).includes('Male'))continue
  const hatch=ancestors[id].find(a=>eggMoves[a]?.includes(move));if(!hatch)continue
  for(const mother of eggMoveMothers(hatch)){
   const donor=[...known.keys()].find(d=>partnerGenders(mother,'Female',d).includes('Male'));if(!donor)continue
   const route=known.get(donor);known.set(id,{...route,steps:[...route.steps,{father:donor,mother,hatch,evolveTo:id,...eggRequirements(hatch)}]});added=true;break
  }
 }}
 const mothers=eggMoveMothers(target)
 return ids.filter(id=>known.has(id)&&mothers.some(m=>partnerGenders(m,'Female',id).includes('Male'))).map(id=>({id,...known.get(id),direct:direct.has(id),mothers:mothers.filter(m=>partnerGenders(m,'Female',id).includes('Male'))})).sort((a,b)=>Number(b.direct)-Number(a.direct)||a.steps.length-b.steps.length||pokemonMeta[a.id].dex-pokemonMeta[b.id].dex)
}
