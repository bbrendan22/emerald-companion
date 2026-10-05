import test from 'node:test'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
import { eggMoveMothers, eggRequirements, findEggMoveFathers } from '../src/utils/eggMoveFathers.js'

const id = dex => Object.keys(pokemonMeta).find(key => pokemonMeta[key].dex === dex)

test('special male offspring use their actual female parent family', () => {
  assert.deepEqual(eggMoveMothers(id(32)), [id(29)])
  assert.deepEqual(eggMoveMothers(id(313)), [id(314)])
  assert.ok(findEggMoveFathers(id(32), 93).length)
  assert.ok(findEggMoveFathers(id(313), 271).length)
})

test('Nidoran can carry a move into an intermediate chain', () => {
  const route = findEggMoveFathers(id(4), 251).find(father => father.steps.some(step => step.hatch === id(32)))
  assert.ok(route)
  const step = route.steps.find(step => step.hatch === id(32))
  assert.equal(step.mother, id(29))
  assert.equal(step.randomOffspring, true)
})

test('Azurill intermediate chains retain the required incense', () => {
  const route = findEggMoveFathers(id(7), 287).find(father => father.steps.some(step => step.hatch === id(298)))
  assert.ok(route)
  assert.equal(route.steps.find(step => step.hatch === id(298)).incense, 'Sea Incense')
  assert.deepEqual(eggMoveMothers(id(298)), [id(183), id(184)])
  assert.equal(eggRequirements(id(360)).incense, 'Lax Incense')
})
