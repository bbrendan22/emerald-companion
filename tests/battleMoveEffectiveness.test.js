import test from 'node:test'
import assert from 'node:assert/strict'
import {battleMoveEffectiveness} from '../src/utils/battleMoveEffectiveness.js'
const target={types:['PSYCHIC']}
const hidden={type:'NORMAL',power:1,effect:'HIDDEN_POWER'}
test('status and special moves use compact symbols',()=>{
 assert.equal(battleMoveEffectiveness({type:'NORMAL',power:0},target).label,'—')
 const result=battleMoveEffectiveness({type:'FIGHTING',power:1,effect:'LEVEL_DAMAGE'},target)
 assert.equal(result.label,'*')
 assert.match(result.explanation,/level/)
})
test('Hidden Power uses complete IVs and preserves unknown IVs',()=>{
 const ivs=Object.fromEntries(['hp','attack','defense','speed','spAttack','spDefense'].map(key=>[key,31]))
 const result=battleMoveEffectiveness(hidden,target,ivs)
 assert.equal(result.type,'DARK')
 assert.equal(result.label,'2×')
 assert.equal(battleMoveEffectiveness(hidden,target,{hp:31}).label,'*')
 assert.equal(battleMoveEffectiveness(hidden,null,ivs).label,'—')
})
test('normal attacks retain immunity and resistance multipliers',()=>{
 assert.equal(battleMoveEffectiveness({type:'NORMAL',power:80},{types:['GHOST']}).label,'0×')
 assert.equal(battleMoveEffectiveness({type:'FIRE',power:80},{types:['WATER','DRAGON']}).label,'0.25×')
})
