import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const root=process.argv[2]
assert(root,'Usage: node tools/buildEVResources.mjs /path/to/pokeemerald')
const constants=await fs.readFile(`${root}/include/constants/species.h`,'utf8')
const ids=Object.fromEntries([...constants.matchAll(/#define (SPECIES_\w+)\s+(\d+)/g)].map(m=>[m[1],+m[2]]))
const source=await fs.readFile(`${root}/src/data/pokemon/species_info.h`,'utf8')
const fields={hp:'HP',attack:'Attack',defense:'Defense',spAttack:'SpAttack',spDefense:'SpDefense',speed:'Speed'},yields={}
for(const m of source.matchAll(/\[(SPECIES_\w+)\]\s*=\s*\{([\s\S]*?)(?=\n\s*\[SPECIES_|\n\};)/g)){
 const id=ids[m[1]];if(!pokemonMeta[id])continue
 yields[id]=Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,Number(m[2].match(new RegExp('\\.evYield_'+field+'\\s*=\\s*(\\d+)'))?.[1]??0)]))
}
assert.equal(Object.keys(yields).length,386)
assert.equal(yields[ids.SPECIES_MAGIKARP].speed,1)
assert.equal(yields[ids.SPECIES_WHISMUR].hp,1)
assert(Object.values(yields).every(v=>Object.values(v).reduce((a,b)=>a+b,0)>=1))
await fs.writeFile(new URL('../src/data/evResources.js',import.meta.url),`// Generated from pret/pokeemerald species EV yields.\nexport const evYields = ${JSON.stringify(yields)}\n`)
console.log('Generated all 386 species EV yields.')
