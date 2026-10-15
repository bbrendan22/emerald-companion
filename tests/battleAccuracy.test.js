import test from 'node:test'
import assert from 'node:assert/strict'
import {calculateBattleDamage,multiHitKoChance} from '../src/utils/battleDamage.js'
import {retaliationPreview} from '../src/utils/battleRetaliation.js'
import {battleMoveEffectiveness} from '../src/utils/battleMoveEffectiveness.js'
const mon={name:'Test',dex:1,level:50,types:['NORMAL'],ability:'Overgrow',item:'None',stats:{hp:200,attack:100,defense:100,spAttack:100,spDefense:100}}
const hit={name:'Strength',type:'NORMAL',power:100,effect:'HIT'}
test('Facade and SmellingSalt double completed base damage rather than base power',()=>{
 assert.equal(calculateBattleDamage({...hit,effect:'FACADE'},{...mon,status:'poison'},mon).scenarios[0].max,138)
 assert.equal(calculateBattleDamage({...hit,effect:'SMELLINGSALT'},mon,{...mon,status:'paralysis'}).scenarios[0].max,138)
 // Burn still halves physical base damage in Gen III Facade, before doubling.
 assert.equal(calculateBattleDamage({...hit,effect:'FACADE'},{...mon,status:'burn'},mon).scenarios[0].max,72)
})
test('Emerald Soundproof blocks Hyper Voice but not SonicBoom',()=>{
 const defender={...mon,ability:'Soundproof'}
 assert.equal(calculateBattleDamage({...hit,name:'Hyper Voice'},mon,defender).scenarios[0].max,0)
 assert.equal(calculateBattleDamage({...hit,name:'SonicBoom',power:1,effect:'SONICBOOM'},mon,defender).scenarios[0].max,20)
})
test('Hidden Power triggers Counter even when its damage category is special in Emerald',()=>{
 const attacker={...mon,ivs:Object.fromEntries(['hp','attack','defense','speed','spAttack','spDefense'].map(key=>[key,31])),moves:[{name:'Hidden Power',type:'NORMAL',power:1,effect:'HIDDEN_POWER'}]}
 assert.equal(calculateBattleDamage(attacker.moves[0],attacker,mon).category,'Special')
 assert.equal(retaliationPreview({type:'FIGHTING',power:1,effect:'COUNTER'},mon,attacker).rows.length,1)
 assert.equal(retaliationPreview({type:'PSYCHIC',power:1,effect:'MIRROR_COAT'},mon,attacker).rows.length,0)
})
test('False Swipe cannot knock out and caps damage at current HP minus one',()=>{
 const result=calculateBattleDamage({...hit,effect:'FALSE_SWIPE'},mon,{...mon,currentHp:10}).scenarios[0]
 assert.equal(result.max,9);assert.equal(result.koChance,0)
 assert.equal(calculateBattleDamage({...hit,effect:'FALSE_SWIPE'},mon,{...mon,currentHp:1}).scenarios[0].max,0)
})
test('Focus Band affects single-hit, fixed damage and multi-hit knockout odds',()=>{
 const defender={...mon,currentHp:1,item:'Focus Band'}
 assert.ok(Math.abs(calculateBattleDamage(hit,mon,defender).scenarios[0].koChance-90)<1e-9)
 assert.equal(calculateBattleDamage({...hit,type:'DRAGON',power:1,effect:'DRAGON_RAGE'},mon,defender).scenarios[0].koChance,90)
 assert.ok(Math.abs(multiHitKoChance([10],2,20,true)-81)<1e-9)
 assert.ok(Math.abs(multiHitKoChance([20],2,20,true)-90)<1e-9)
 assert.equal(multiHitKoChance([0],5,20,true),0)
})
test('Focus Band survival can enable Counter and is also respected by retaliation KO chances',()=>{
 const attacker={...mon,currentHp:20,item:'Focus Band'}
 const target={...mon,currentHp:1,item:'Focus Band',moves:[hit]}
 const result=retaliationPreview({type:'FIGHTING',power:1,effect:'COUNTER'},attacker,target).rows[0].scenarios[0]
 assert.ok(Math.abs(result.survivalChance-10)<1e-9)
 assert.ok(Math.abs(result.koChance-9)<1e-9)
})
test('type-only effectiveness remains separate from Thick Fat damage rounding',()=>{
 const move={...hit,type:'FIRE'}
 assert.equal(battleMoveEffectiveness(move,{...mon,ability:'Thick Fat'}).label,'.5×')
 assert.equal(calculateBattleDamage(move,mon,{...mon,ability:'Thick Fat'}).scenarios[0].max,24)
})
test('Soul Dew provides no boost in Frontier battles, Light Ball boosts only Pikachu special damage',()=>{
 const latios={...mon,dex:381,item:'Soul Dew'}
 assert.equal(calculateBattleDamage({...hit,type:'PSYCHIC'},latios,mon).scenarios[0].max,calculateBattleDamage({...hit,type:'PSYCHIC'},{...latios,item:'None'},mon).scenarios[0].max)
 const pikachu={...mon,dex:25,item:'Light Ball'}
 assert.equal(calculateBattleDamage(hit,pikachu,mon).scenarios[0].max,69)
 assert.equal(calculateBattleDamage({...hit,type:'ELECTRIC'},pikachu,mon).scenarios[0].max,90)
})
