import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const root=process.argv[2];assert(root,'Usage: node tools/buildHatchingResources.mjs /path/to/pokeemerald')
const constants=await fs.readFile(`${root}/include/constants/species.h`,'utf8')
const ids=Object.fromEntries([...constants.matchAll(/#define (SPECIES_\w+)\s+(\d+)/g)].map(m=>[m[1],+m[2]])),cycles={}
const source=await fs.readFile(`${root}/src/data/pokemon/species_info.h`,'utf8')
for(const m of source.matchAll(/\[(SPECIES_\w+)\]\s*=\s*\{([\s\S]*?)(?=\n\s*\[SPECIES_|\n\};)/g)){const id=ids[m[1]];if(!pokemonMeta[id])continue;cycles[id]=Number(m[2].match(/\.eggCycles\s*=\s*(\d+)/)?.[1]);assert(cycles[id]>0,m[1])}
assert.equal(Object.keys(cycles).length,386)
await fs.writeFile(new URL('../src/data/hatchingResources.js',import.meta.url),`// Generated from pret/pokeemerald species egg-cycle values.\nexport const eggCycles = ${JSON.stringify(cycles)}\n`)
