import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
import { speciesDetails } from '../src/data/speciesDetails.js'
const [rubyRoot, frlgRoot] = process.argv.slice(2)
assert(rubyRoot && frlgRoot, 'Provide pokeruby and pokefirered source directories')
const parse = source => Object.fromEntries([...source.matchAll(/const u8 (\w+)\[\]\s*=\s*_\(([\s\S]*?)\);/g)].map(m => [m[1], [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(q => JSON.parse(`"${q[1]}"`)).join('').replace(/\s+/g, ' ').trim()]))
const rs = {}
for (const game of ['Ruby','Sapphire']) {
 const source = execFileSync('cpp', ['-P', '-DREVISION=1', `-D${game.toUpperCase()}`, `${rubyRoot}/src/data/pokedex_entries_en.h`], {encoding:'utf8', maxBuffer:4e6})
 const texts = parse(source)
 rs[game] = [...source.matchAll(/\.descriptionPage1\s*=\s*(\w+),\s*\.descriptionPage2\s*=\s*(\w+)/g)].map(m => `${texts[m[1]]} ${texts[m[2]]}`.trim())
 assert.equal(rs[game].length, 387)
}
const pointerSource = fs.readFileSync(`${frlgRoot}/src/data/pokemon/pokedex_entries.h`, 'utf8')
const ids = Object.fromEntries([...fs.readFileSync(`${frlgRoot}/include/constants/species.h`,'utf8').matchAll(/#define SPECIES_(\w+)\s+(\d+)/g)].map(m=>[m[1],m[2]]))
const result = Object.fromEntries(Object.entries(pokemonMeta).map(([id,p])=>[id,{Emerald:speciesDetails[id].description,Ruby:rs.Ruby[p.dex],Sapphire:rs.Sapphire[p.dex]}]))
for(const [game,suffix]of [['FireRed','fr'],['LeafGreen','lg']]) {
 const texts=parse(fs.readFileSync(`${frlgRoot}/src/data/pokemon/pokedex_text_${suffix}.h`,'utf8'))
 for(const m of pointerSource.matchAll(/\[NATIONAL_DEX_(\w+)\]\s*=\s*\{([\s\S]*?)\n\s*\}/g)) {
  const id=ids[m[1]];if(!result[id])continue
  result[id][game]=texts[m[2].match(/\.description\s*=\s*(\w+)/)[1]]
 }
}
for(const [id,entries]of Object.entries(result))assert(Object.values(entries).every(text=>typeof text==='string'&&text.length>0)&&Object.keys(entries).length===5,`Incomplete ${id}`)
fs.writeFileSync('src/data/pokedexEntries.js', `// Generated from pret/pokeruby, pokefirered and existing Emerald data.\nexport const pokedexEntries = ${JSON.stringify(result)}\n`)
console.log('Generated five game entries for all 386 species')
