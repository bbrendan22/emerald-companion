import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const root=process.argv[2];assert(root,'Usage: node tools/buildEggMoveResources.mjs /path/to/pokeemerald')
const read=p=>fs.readFile(`${root}/${p}`,'utf8')
const parse=(text,prefix)=>Object.fromEntries([...text.matchAll(new RegExp('#define ('+prefix+'_\\w+)\\s+(\\d+)','g'))].map(m=>[m[1],+m[2]]))
const species=parse(await read('include/constants/species.h'),'SPECIES'),moves=parse(await read('include/constants/moves.h'),'MOVE')
const eggs=Object.fromEntries([...(await read('src/data/pokemon/egg_moves.h')).matchAll(/egg_moves\((\w+),([\s\S]*?)\)/g)].filter(m=>species['SPECIES_'+m[1]]).map(m=>[species['SPECIES_'+m[1]],[...m[2].matchAll(/MOVE_\w+/g)].map(x=>moves[x[0]])]))
const sets=Object.fromEntries([...(await read('src/data/pokemon/level_up_learnsets.h')).matchAll(/static const u16 (\w+)\[\]\s*=\s*\{([\s\S]*?)\};/g)].map(m=>[m[1],[...m[2].matchAll(/LEVEL_UP_MOVE\(\s*(\d+),\s*(MOVE_\w+)\)/g)].map(x=>({level:+x[1],move:moves[x[2]]}))]))
const levelMoves=Object.fromEntries([...(await read('src/data/pokemon/level_up_learnset_pointers.h')).matchAll(/\[(SPECIES_\w+)\]\s*=\s*(\w+)/g)].filter(m=>pokemonMeta[species[m[1]]]).map(m=>[species[m[1]],sets[m[2]]]))
const evolutions={}
for(const m of (await read('src/data/pokemon/evolution.h')).matchAll(/\[(SPECIES_\w+)\]\s*=\s*\{([\s\S]*?)(?=\n\s*\[SPECIES_|\n\};)/g))evolutions[species[m[1]]]=[...m[2].matchAll(/\{EVO_\w+,\s*[^,]+,\s*(SPECIES_\w+)\}/g)].map(x=>species[x[1]]).filter(id=>pokemonMeta[id])
assert.equal(Object.keys(levelMoves).length,386);assert(eggs[1].length===8);assert(Object.values(eggs).flat().every(Boolean))
await fs.writeFile(new URL('../src/data/eggMoveResources.js',import.meta.url),`// Generated from pret/pokeemerald egg moves, level learnsets, and evolution links.\nexport const eggMoves = ${JSON.stringify(eggs)}\nexport const levelMoves = ${JSON.stringify(levelMoves)}\nexport const breedingEvolutions = ${JSON.stringify(evolutions)}\n`)
console.log(`Generated ${Object.keys(eggs).length} egg-move species and 386 level learnsets.`)
