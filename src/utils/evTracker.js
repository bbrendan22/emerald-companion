import {evYields} from '../data/evResources.js'
import {locationResources} from '../data/locationResources.js'
export const evStats=[['hp','HP'],['attack','Atk'],['defense','Def'],['spAttack','SpA'],['spDefense','SpD'],['speed','Spe']]
export const emptyEVs=()=>Object.fromEntries(evStats.map(([key])=>[key,0]))
export const totalEVs=evs=>evStats.reduce((sum,[key])=>sum+Number(evs[key]||0),0)
export function gainBattleEVs(evs,species,brace=false,pokerus=false){
 const next={...evs};let total=totalEVs(next)
 // Preserve game stat order when a mixed yield reaches the overall cap.
 for(const key of ['hp','attack','defense','speed','spAttack','spDefense']){
  const gained=Math.max(0,Math.min((evYields[species]?.[key]??0)*(brace?2:1)*(pokerus?2:1),255-Number(next[key]||0),510-total))
  next[key]=Number(next[key]||0)+gained;total+=gained
 }
 return next
}
const spotChoices={hp:[['Rusturf Tunnel','Grass / Cave'],['Petalburg City','Surfing']],attack:[['Mt Pyre 1F','Grass / Cave'],['Route 121','Grass / Cave']],defense:[['Magma Hideout 1F','Grass / Cave'],['Route 111','Rock Smash']],spAttack:[['Route 113','Grass / Cave']],spDefense:[['Abandoned Ship Rooms B 1F','Surfing'],['Route 114','Grass / Cave']],speed:[['Altering Cave','Grass / Cave'],['Artisan Cave B 1F','Grass / Cave']]}
export function trainingSpots(stat){return (spotChoices[stat]??[]).flatMap(([name,method])=>{
 const place=locationResources.find(place=>place.name===name);const encounters=place?.methods.find(entry=>entry.name===method)?.encounters??[]
 const targets=encounters.filter(entry=>evYields[entry.species]?.[stat]>0 && totalEVs(evYields[entry.species])===evYields[entry.species][stat])
 return targets.length ? [{name,method:method==='Grass / Cave' ? name.includes('Route')?'Grass':'Walking' : method,targets}] : []
})}
