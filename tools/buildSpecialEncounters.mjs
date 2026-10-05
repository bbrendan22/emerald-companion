import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const root=process.argv[2]
assert(root,'Usage: node tools/buildSpecialEncounters.mjs /path/to/pokeemerald')
const ids=Object.fromEntries([...(await fs.readFile(`${root}/include/constants/species.h`,'utf8')).matchAll(/#define (SPECIES_\w+)\s+(\d+)/g)].map(m=>[m[1],Number(m[2])]))
const encounters=[]
for(const map of await fs.readdir(`${root}/data/maps`)){
 let script;try{script=await fs.readFile(`${root}/data/maps/${map}/scripts.inc`,'utf8')}catch{continue}
 for(const m of script.matchAll(/^\s*(givemon|giveegg|setwildbattle|seteventmon)\s+(SPECIES_\w+)(?:,\s*(\d+))?/gm)){
  const entry={species:ids[m[2]],map,kind:m[1]==='giveegg'?'Gift Egg':m[1]==='givemon'?'Gift':m[1]==='seteventmon'?'Event encounter':'Fixed encounter',level:m[1]==='giveegg'?5:m[3]?Number(m[3]):null}
  if(!encounters.some(e=>JSON.stringify(e)===JSON.stringify(entry)))encounters.push(entry)
 }
}
await fs.writeFile(new URL('../src/data/specialEncounters.js',import.meta.url),`// Generated from pret/pokeemerald map scripts.\nexport const specialEncounters = ${JSON.stringify(encounters)}\n`)
console.log(`Generated ${encounters.length} gift and fixed encounter entries.`)
