import test from 'node:test'
import assert from 'node:assert/strict'
import {retaliationPreview} from '../src/utils/battleRetaliation.js'
const mon={name:'Test',dex:1,level:50,types:['NORMAL'],ability:'Overgrow',item:'None',stats:{hp:200,attack:100,defense:100,spAttack:100,spDefense:100}}
const counter={name:'Counter',power:1,type:'FIGHTING',effect:'COUNTER'}
const coat={name:'Mirror Coat',power:1,type:'PSYCHIC',effect:'MIRROR_COAT'}
const hit={name:'Strength',power:100,type:'NORMAL',effect:'HIT'}
test('Counter doubles physical damage and Mirror Coat rejects it',()=>{
 const result=retaliationPreview(counter,mon,{...mon,moves:[hit]}).rows[0].scenarios[0]
 assert.ok(Math.abs(result.minPercent-58)<1e-10);assert.equal(result.maxPercent,69)
 assert.equal(result.survivalChance,100)
 assert.equal(retaliationPreview(coat,mon,{...mon,moves:[hit]}).rows.length,0)
})
test('Gen III special typing qualifies for Mirror Coat and includes ability immunities',()=>{
 const dark={...hit,name:'Crunch',type:'DARK'}
 assert.equal(retaliationPreview(coat,mon,{...mon,moves:[dark]}).rows[0].scenarios[0].survivalChance,100)
 assert.equal(retaliationPreview(coat,mon,{...mon,types:['DARK'],moves:[dark]}).rows[0].scenarios[0].blocked,true)
 assert.equal(retaliationPreview(counter,mon,{...mon,types:['GHOST'],moves:[hit]}).rows[0].scenarios[0].blocked,true)
})
test('previews exclude lethal rolls and flag unavoidable fainting',()=>{
 const partial=retaliationPreview(counter,{...mon,currentHp:60},{...mon,moves:[hit]}).rows[0].scenarios[0]
 assert.ok(partial.survivalChance>0&&partial.survivalChance<100)
 assert.ok(partial.maxPercent<=59)
 assert.match(retaliationPreview(counter,{...mon,currentHp:1},{...mon,moves:[hit]}).rows[0].scenarios[0].message,/faints/)
})
test('multi-hit and self-KO moves have explicit limitations',()=>{
 const rows=retaliationPreview(counter,mon,{...mon,moves:[{...hit,effect:'DOUBLE_HIT'},{...hit,effect:'EXPLOSION'}]}).rows
 assert.match(rows[0].message,/Multi-hit/)
 assert.match(rows[1].message,/Opponent faints/)
})
