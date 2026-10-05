import test from 'node:test'
import assert from 'node:assert/strict'
import { evolutions } from '../src/data/evolutionResources.js'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
import { evolutionMethod, previousEvolutions } from '../src/utils/evolutions.js'
const id = dex => Object.keys(pokemonMeta).find(key => pokemonMeta[key].dex === dex)

test('every extracted evolution has a known species and readable method', () => {
  assert.equal(Object.values(evolutions).flat().length, 184)
  for (const [from, entries] of Object.entries(evolutions)) {
    assert.ok(pokemonMeta[from])
    for (const entry of entries) {
      assert.ok(pokemonMeta[entry.target])
      assert.ok(evolutionMethod(entry))
      assert.ok(!evolutionMethod(entry).includes('undefined'))
    }
  }
})

test('branched evolutions and reverse links retain their conditions', () => {
  assert.equal(evolutions[id(133)].length, 5)
  assert.equal(evolutions[id(236)].length, 3)
  assert.equal(evolutions[id(366)].length, 2)
  assert.equal(previousEvolutions(id(2))[0].from, id(1))
  assert.match(evolutionMethod(evolutions[id(25)][0]), /Thunder Stone/i)
  const eevee = evolutions[id(133)]
  assert.match(evolutionMethod(eevee.find(e => e.method === 'FRIENDSHIP_DAY')), /noon–11:59 PM/)
  assert.match(evolutionMethod(eevee.find(e => e.method === 'FRIENDSHIP_NIGHT')), /midnight–11:59 AM/)
})

test('Emerald special evolutions stay distinct', () => {
  assert.match(evolutionMethod(evolutions[id(290)].find(e => e.method === 'LEVEL_SHEDINJA')), /empty party slot/)
  assert.match(evolutionMethod(evolutions[id(265)][0]), /fixed personality/i)
  assert.match(evolutionMethod(evolutions[id(349)][0]), /Beauty of 170/)
  assert.deepEqual(previousEvolutions(id(132)), [])
})
