import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const root=process.argv[2]
assert(root,'Usage: node tools/buildSpeciesDetails.mjs /path/to/pokeemerald')
const read=path=>fs.readFile(`${root}/${path}`,'utf8')
const ids=Object.fromEntries([...(await read('include/constants/species.h')).matchAll(/#define (SPECIES_\w+)\s+(\d+)/g)].map(m=>[m[1],Number(m[2])]))
const items=(await read('include/constants/items.h')).match(/enum\s*\{([\s\S]*?)\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').split(',').map(t=>t.trim().match(/^(ITEM_\w+)/)?.[1]).filter(Boolean)
const texts=Object.fromEntries([...(await read('src/data/pokemon/pokedex_text.h')).matchAll(/const u8 (\w+)\[\] = _\(([\s\S]*?)\);/g)].map(m=>[m[1],[...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(q=>JSON.parse(`"${q[1]}"`)).join('').replaceAll('\n',' ')]))
const entries={}
for(const m of (await read('src/data/pokemon/pokedex_entries.h')).matchAll(/\[NATIONAL_DEX_(\w+)\]\s*=\s*\{([\s\S]*?)\n\s*\}/g)){
 const id=ids[`SPECIES_${m[1]}`];if(!pokemonMeta[id])continue
 const number=field=>Number(m[2].match(new RegExp('\\.'+field+'\\s*=\\s*(\\d+)'))?.[1])
 const description=texts[m[2].match(/\.description\s*=\s*(\w+)/)?.[1]]
 assert(description,m[1])
 entries[id]={category:m[2].match(/\.categoryName\s*=\s*_\("([^"]+)"\)/)[1],height:number('height')/10,weight:number('weight')/10,description}
}
for(const m of (await read('src/data/pokemon/species_info.h')).matchAll(/\[(SPECIES_\w+)\]\s*=\s*\{([\s\S]*?)(?=\n\s*\[SPECIES_|\n\};)/g)){
 const id=ids[m[1]];if(!pokemonMeta[id])continue
 const value=field=>m[2].match(new RegExp('\\.'+field+'\\s*=\\s*(\\w+)'))?.[1]
 assert(entries[id],m[1])
 Object.assign(entries[id],{catchRate:Number(value('catchRate')),expYield:Number(value('expYield')),friendship:value('friendship')==='STANDARD_FRIENDSHIP'?70:Number(value('friendship')),commonItem:items.indexOf(value('itemCommon')),rareItem:items.indexOf(value('itemRare'))})
 assert(Object.values(entries[id]).every(v=>typeof v!=='number'||Number.isFinite(v)&&v>=0),m[1])
}
assert.equal(Object.keys(entries).length,386)
await fs.writeFile(new URL('../src/data/speciesDetails.js',import.meta.url),`// Generated from pret/pokeemerald species and Emerald Pokédex data.\nexport const speciesDetails = ${JSON.stringify(entries)}\n`)
console.log('Generated species details for all 386 Pokémon.')
