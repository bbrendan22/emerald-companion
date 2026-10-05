import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const root=process.argv[2]
assert(root,'Usage: node tools/buildBreedingResources.mjs /path/to/pokeemerald')
const constants=await fs.readFile(`${root}/include/constants/species.h`,'utf8')
const ids=Object.fromEntries([...constants.matchAll(/#define (SPECIES_\w+)\s+(\d+)/g)].map(m=>[m[1],+m[2]]))
const source=await fs.readFile(`${root}/src/data/pokemon/species_info.h`,'utf8'),groups={}
for(const m of source.matchAll(/\[(SPECIES_\w+)\]\s*=\s*\{([\s\S]*?)(?=\n\s*\[SPECIES_|\n\};)/g)){
 const id=ids[m[1]];if(!pokemonMeta[id])continue
 const field=m[2].match(/\.eggGroups\s*=\s*\{([^}]+)\}/)?.[1];assert(field,m[1])
 groups[id]=[...new Set([...field.matchAll(/EGG_GROUP_(\w+)/g)].map(g=>g[1]))]
}
assert.equal(Object.keys(groups).length,386)
assert.deepEqual(groups[ids.SPECIES_DITTO],['DITTO'])
assert.deepEqual(groups[ids.SPECIES_NIDORINA],['NO_EGGS_DISCOVERED'])
await fs.writeFile(new URL('../src/data/breedingResources.js',import.meta.url),`// Generated from pret/pokeemerald species egg groups.\nexport const eggGroups = ${JSON.stringify(groups)}\n`)
console.log('Generated egg groups for all 386 species.')
