import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const root=process.argv[2]??'/private/tmp/pokefirered-master'
const wild=JSON.parse(await fs.readFile(`${root}/src/data/wild_encounters.json`,'utf8'))
const constants=await fs.readFile(`${root}/include/constants/species.h`,'utf8')
const ids=Object.fromEntries([...constants.matchAll(/#define SPECIES_(\w+)\s+(\d+)/g)].map(m=>['SPECIES_'+m[1],Number(m[2])]))
const group=wild.wild_encounter_groups.find(g=>g.for_maps)
const names={land_mons:'Grass / Cave',water_mons:'Surfing',rock_smash_mons:'Rock Smash',old_rod:'Old Rod',good_rod:'Good Rod',super_rod:'Super Rod'}
const title=map=>map.replace(/^MAP_/,'').replace(/_/g,' ').replace(/([A-Z])(\d)/g,'$1 $2').replace(/\b\w+/g,w=>w[0]+w.slice(1).toLowerCase()).replace(/ (\d+)f\b/gi,' $1F').replace(/B (\d+)F/gi,'B$1F')
const unownSource=await fs.readFile(`${root}/src/wild_encounter.c`,'utf8')
const unownTable=unownSource.match(/sUnownLetterSlots\[\]\[LAND_WILD_COUNT\] = \{([\s\S]*?)\n\};/)[1].replace(/\/\/[^\n]*/g,'')
const letters=[...unownTable.matchAll(/\{([^}]+)\}/g)].map(m=>m[1].match(/\d+/g).map(Number))
const chambers=['MONEAN','LIPTOO','WEEPTH','DILFORD','SCUFIB','RIXY','VIAPOIS']
const output={FireRed:[],LeafGreen:[]}
for(const enc of group.encounters){
 const game=enc.base_label.endsWith('_FireRed')?'FireRed':enc.base_label.endsWith('_LeafGreen')?'LeafGreen':null
 assert(game,enc.base_label)
 const methods=[]
 for(const field of group.fields){
  const data=enc[field.type];if(!data)continue
  for(const [method,indices] of Object.entries(field.groups??{[field.type]:data.mons.map((_,i)=>i)})){
   const combined=new Map()
   for(const i of indices){const mon=data.mons[i],species=ids[mon.species];assert(pokemonMeta[species],mon.species);const chamber=chambers.findIndex(name=>enc.map.endsWith(`${name}_CHAMBER`));const letter=species===ids.SPECIES_UNOWN&&chamber>=0?letters[chamber][i]:null;const form=letter==null?undefined:letter===26?'!':letter===27?'?':String.fromCharCode(65+letter);const key=`${species}/${mon.min_level}/${mon.max_level}/${form??''}`;const entry=combined.get(key)??{species,min:mon.min_level,max:mon.max_level,rate:0,...(form?{form}:{})};entry.rate+=field.encounter_rates[i];combined.set(key,entry)}
   const encounters=[...combined.values()];assert.equal(encounters.reduce((s,e)=>s+e.rate,0),100)
   methods.push({name:names[method],encounters})
  }
 }
 if(methods.length)output[game].push({id:enc.map,name:title(enc.map),methods})
}
await fs.writeFile('src/data/fireRedLeafGreenEncounters.js','// Generated from pret/pokefirered wild_encounters.json. Run node tools/buildFireRedLeafGreenEncounters.mjs <source-directory>\nexport const fireRedLeafGreenEncounters = '+JSON.stringify(output)+'\n')
console.log(Object.fromEntries(Object.entries(output).map(([g,v])=>[g,v.length])))
