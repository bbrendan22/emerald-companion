import test from 'node:test'
import assert from 'node:assert/strict'
import {frontierStatBar, frontierStatMaximums} from '../src/utils/frontierStatBars.js'

test('reference maxima preserve the full Frontier pool at both levels', () => {
  assert.deepEqual(frontierStatMaximums(50), {
    hp:330, attack:212, defense:282, spAttack:205, spDefense:310, speed:200,
  })
  assert.deepEqual(frontierStatMaximums(100), {
    hp:651, attack:419, defense:559, spAttack:405, spDefense:614, speed:394,
  })
})

test('linear bars show proportional differences, with a visibility floor and cap', () => {
  for (const level of [50,100]) {
    for (const [key,maximum] of Object.entries(frontierStatMaximums(level))) {
      assert.equal(frontierStatBar(maximum/2,key,level).width,50)
      assert.equal(frontierStatBar(maximum,key,level).width,100)
      assert.equal(frontierStatBar(maximum*2,key,level).width,100)
      assert.equal(frontierStatBar(0,key,level).width,5)
      assert.equal(frontierStatBar(-1,key,level).width,5)
      assert.equal(frontierStatBar(undefined,key,level).width,5)
    }
  }
})
