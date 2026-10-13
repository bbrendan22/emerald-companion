import test from 'node:test'
import assert from 'node:assert/strict'
import { friendshipDisplay, pokerusDisplay, collectionRibbonCatalog, ribbonEarned, toggleRibbon, expForLevel, levelFromExperience } from '../src/utils/collectionDetails.js'

test('friendship keeps exact, estimated, and unknown values distinct', () => {
  assert.equal(friendshipDisplay({}), 'Unknown')
  assert.equal(friendshipDisplay({friendship:0}), '0 · Detests you')
  assert.equal(friendshipDisplay({friendship:76}), '76 · Not used to you')
  assert.equal(friendshipDisplay({friendshipAssessment:'200'}), 'Very happy · 200–254 (estimated)')
  assert.equal(friendshipDisplay({friendship:255}), '255 · Adores you')
})
test('Pokérus supports imported data and explicit manual unknown', () => {
  assert.equal(pokerusDisplay({}), 'Unknown')
  assert.equal(pokerusDisplay({pokerus:0}), 'Never infected')
  assert.equal(pokerusDisplay({pokerus:17}), 'Currently infected')
  assert.equal(pokerusDisplay({pokerus:16}), 'Previously infected')
  assert.equal(pokerusDisplay({pokerus:17,pokerusStatus:'Unknown'}), 'Unknown')
})
test('contest ribbon ranks include earlier ranks and clear later ones', () => {
  const ranks=collectionRibbonCatalog.filter(r=>r.category==='Cool')
  assert.equal(ribbonEarned(['Cool Rank 3'],ranks[1]),true)
  const selected=toggleRibbon([],ranks[2],true)
  assert.equal(selected.length,3)
  assert.deepEqual(toggleRibbon(selected,ranks[1],false),['Cool Normal Ribbon'])
})
test('experience derives levels at boundaries across growth groups', () => {
  for(const growth of ['GROWTH_FAST','GROWTH_MEDIUM_SLOW','GROWTH_SLOW','GROWTH_ERRATIC','GROWTH_FLUCTUATING','GROWTH_MEDIUM_FAST']) {
    assert.equal(expForLevel(1,growth),0)
    for(const level of [5,31,50,100]) {
      assert.equal(levelFromExperience(expForLevel(level,growth),growth),level)
      assert.equal(levelFromExperience(expForLevel(level,growth)-1,growth),level-1)
    }
  }
})
