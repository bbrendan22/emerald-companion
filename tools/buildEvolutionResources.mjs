import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const root = process.argv[2]
assert(root, 'Usage: node tools/buildEvolutionResources.mjs /path/to/pokeemerald')
const read = path => fs.readFile(`${root}/${path}`, 'utf8')
const constants = await read('include/constants/species.h')
const ids = Object.fromEntries([...constants.matchAll(/#define (SPECIES_\w+)\s+(\d+)/g)].map(m => [m[1], Number(m[2])]))
const items = await read('include/constants/items.h')
const itemIds = {}
let itemIndex = 0
for (const token of items.match(/enum\s*\{([\s\S]*?)\};/)[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').split(',')) {
  const name = token.trim().match(/^(ITEM_\w+)/)?.[1]
  if (name) itemIds[name] = itemIndex++
}
const source = await read('src/data/pokemon/evolution.h')
const evolutions = {}
for (const block of source.matchAll(/\[(SPECIES_\w+)\]\s*=\s*\{([\s\S]*?)(?=\n\s*\[SPECIES_|\n\};)/g)) {
  const from = ids[block[1]]
  assert(pokemonMeta[from], block[1])
  evolutions[from] = [...block[2].matchAll(/\{(EVO_\w+),\s*(\w+),\s*(SPECIES_\w+)\}/g)].map(m => {
    const param = m[2].startsWith('ITEM_') ? itemIds[m[2]] : Number(m[2])
    assert(Number.isInteger(param) && pokemonMeta[ids[m[3]]], m[0])
    return { method: m[1].replace('EVO_', ''), param, target: ids[m[3]] }
  })
  assert(evolutions[from].length, block[1])
}
assert.equal(evolutions[1][0].target, 2)
assert.equal(evolutions[133].length, 5)
await fs.writeFile(new URL('../src/data/evolutionResources.js', import.meta.url), `// Generated from pret/pokeemerald evolution.h.\nexport const evolutions = ${JSON.stringify(evolutions)}\n`)
console.log(`Generated ${Object.values(evolutions).flat().length} evolution methods.`)
