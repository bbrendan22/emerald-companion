import test from 'node:test'
import assert from 'node:assert/strict'
import { createCollectionId } from '../src/utils/collectionId.js'

test('uses native UUIDs when available',()=>{
  assert.equal(createCollectionId({randomUUID:()=> 'native-id'}),'native-id')
})
test('HTTP preview fallback creates valid unique UUIDs without randomUUID',()=>{
  const api={getRandomValues:globalThis.crypto.getRandomValues.bind(globalThis.crypto)}
  const ids=Array.from({length:100},()=>createCollectionId(api))
  assert.equal(new Set(ids).size,100)
  for(const id of ids) assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})
