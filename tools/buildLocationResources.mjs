import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const base='https://raw.githubusercontent.com/pret/pokeemerald/master/'
const [wild,constants]=await Promise.all(['src/data/wild_encounters.json','include/constants/species.h'].map(async path=>{const r=await fetch(base+path);if(!r.ok)throw new Error(path);return r.text()}))
const ids=Object.fromEntries([...constants.matchAll(/#define SPECIES_(\w+)\s+(\d+)/g)].map(m=>['SPECIES_'+m[1],Number(m[2])]))
const names={land_mons:'Grass / Cave',water_mons:'Surfing',rock_smash_mons:'Rock Smash',old_rod:'Old Rod',good_rod:'Good Rod',super_rod:'Super Rod'}
const group=JSON.parse(wild).wild_encounter_groups.find(g=>g.label==='gWildMonHeaders')
const fields=Object.fromEntries(group.fields.map(f=>[f.type,f]))
const title=map=>map.replace(/^MAP_/,'').replace(/_/g,' ').replace(/([A-Z])(\d)/g,'$1 $2').replace(/\b\w+/g,w=>w[0]+w.slice(1).toLowerCase()).replace(/ (\d+)f\b/gi,' $1F').replace(/ Ss /g,' S.S. ')
const locations=group.encounters.filter(enc=>!enc.map.includes('UNUSED')).map(enc=>{
 const methods=[]
 for(const [key,field] of Object.entries(fields)){
  const data=enc[key];if(!data)continue
  const groups=field.groups??{[key]:data.mons.map((_,i)=>i)}
  for(const [method,indices] of Object.entries(groups)){
   const combined=new Map()
   for(const i of indices){const mon=data.mons[i],species=ids[mon.species];assert(pokemonMeta[species],mon.species);const old=combined.get(species)??{species,min:mon.min_level,max:mon.max_level,rate:0};old.min=Math.min(old.min,mon.min_level);old.max=Math.max(old.max,mon.max_level);old.rate+=field.encounter_rates[i];combined.set(species,old)}
   const encounters=[...combined.values()];assert.equal(encounters.reduce((sum,m)=>sum+m.rate,0),100)
   methods.push({name:names[method],encounters})
  }
 }
 return {id:enc.map,name:title(enc.map),methods}
}).filter(location=>location.methods.length).filter((location,index,all)=>all.findIndex(other=>other.id===location.id)===index)
assert(locations.length>50)
await fs.writeFile('src/data/locationResources.js','// Generated from pret/pokeemerald. Run node tools/buildLocationResources.mjs\nexport const locationResources = '+JSON.stringify(locations,null,2)+'\n')
console.log(locations.length+' encounter areas generated; every method totals 100%.')
