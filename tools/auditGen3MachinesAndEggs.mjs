import fs from 'node:fs'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
import { eggMoves } from '../src/data/eggMoveResources.js'
import { machineResources } from '../src/data/itemResources.js'

// Compare Emerald resources against factual tables from the pret source projects.
for (const root of process.argv.slice(2)) {
  const read = file => fs.readFileSync(`${root}/${file}`,'utf8')
  const constants = (text,prefix) => Object.fromEntries([...text.matchAll(new RegExp(`#define (${prefix}_\\w+)\\s+(\\d+)`,'g'))].map(match=>[match[1],Number(match[2])]))
  const species = constants(read('include/constants/species.h'),'SPECIES')
  const moves = constants(read('include/constants/moves.h'),'MOVE')
  const eggs = Object.fromEntries([...read('src/data/pokemon/egg_moves.h').matchAll(/egg_moves\((\w+),([\s\S]*?)\)/g)].filter(match=>species[`SPECIES_${match[1]}`]).map(match=>[species[`SPECIES_${match[1]}`],[...match[2].matchAll(/MOVE_\w+/g)].map(move=>moves[move[0]])]))
  const machines = Object.fromEntries([...read('src/data/pokemon/tmhm_learnsets.h').matchAll(/\[(SPECIES_\w+)\]([\s\S]*?)(?=\[SPECIES_|$)/g)].map(match=>[species[match[1]],[...match[2].matchAll(/TMHM\((TM\d+|HM\d+)_/g)].map(machine=>machine[1])]))
  for (const id of Object.keys(pokemonMeta)) {
    assert.deepEqual([...(eggs[id]??[])].sort((a,b)=>a-b),[...(eggMoves[id]??[])].sort((a,b)=>a-b),`${root}: egg moves for ${pokemonMeta[id].name}`)
    assert.deepEqual([...new Set(machines[id]??[])].sort(),machineResources.filter(machine=>machine.species.includes(Number(id))).map(machine=>machine.code).sort(),`${root}: TM/HM compatibility for ${pokemonMeta[id].name}`)
  }
  console.log(`${root}: all 386 species match Emerald's standard egg moves and TM/HM compatibility`)
}
