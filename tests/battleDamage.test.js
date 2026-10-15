import test from 'node:test'
import assert from 'node:assert/strict'
import {calculateBattleDamage} from '../src/utils/battleDamage.js'
const mon={name:'Test',dex:1,level:50,types:['NORMAL'],ability:'Overgrow',item:'None',stats:{hp:100,attack:100,defense:100,spAttack:100,spDefense:100}}
const hit={name:'Strength',type:'NORMAL',power:100,effect:'HIT'}
test('Gen III base damage, STAB and sixteen random rolls',()=>{
 const result=calculateBattleDamage(hit,mon,mon).scenarios[0]
 assert.equal(result.min,58);assert.equal(result.max,69);assert.equal(result.koChance,0)
 assert.equal(calculateBattleDamage(hit,mon,{...mon,stats:{...mon.stats,hp:60}}).scenarios[0].koChance,87.5)
})
test('physical and special categories follow type rather than move',()=>{
 const attacker={...mon,stats:{...mon.stats,attack:200,spAttack:50}}
 assert.equal(calculateBattleDamage({...hit,type:'GHOST'},attacker,{...mon,types:['PSYCHIC']}).category,'Physical')
 assert.equal(calculateBattleDamage({...hit,type:'DARK'},attacker,mon).category,'Special')
})
test('immunities, ability uncertainty, and Thick Fat use separate scenarios',()=>{
 const fire={...hit,type:'FIRE'}
 const result=calculateBattleDamage(fire,mon,{...mon,ability:'Thick Fat / Flash Fire'})
 assert.equal(result.scenarios[0].max,24)
 assert.equal(result.scenarios[1].max,0)
 assert.equal(calculateBattleDamage(hit,mon,{...mon,types:['GHOST']}).scenarios[0].max,0)
})
test('Choice Band and Explosion modify stats before base damage',()=>{
 assert.equal(calculateBattleDamage(hit,{...mon,item:'Choice Band'},mon).scenarios[0].max,102)
 assert.equal(calculateBattleDamage({...hit,effect:'EXPLOSION'},mon,mon).scenarios[0].max,135)
})
test('special and status moves never receive a misleading normal calculation',()=>{
 assert.match(calculateBattleDamage({...hit,power:0},mon,mon).message,/status/)
 assert.match(calculateBattleDamage({...hit,power:1,effect:'COUNTER'},mon,mon).message,/special/)
 assert.match(calculateBattleDamage(hit,mon,null).message,/both/)
})
test('remaining target HP changes KO odds without changing maximum-HP damage percentages',()=>{
 const full=calculateBattleDamage(hit,mon,mon).scenarios[0]
 const damaged=calculateBattleDamage(hit,mon,{...mon,currentHp:50}).scenarios[0]
 assert.equal(damaged.minPercent,full.minPercent)
 assert.equal(damaged.koChance,100)
 assert.equal(calculateBattleDamage(hit,mon,{...mon,currentHp:0}).scenarios,undefined)
})
test('Eruption scales down with current HP and remains calculable at one HP',()=>{
 const eruption={...hit,type:'FIRE',power:150,effect:'ERUPTION'}
 assert.equal(calculateBattleDamage(eruption,mon,mon).power,150)
 assert.equal(calculateBattleDamage(eruption,{...mon,currentHp:50},mon).power,75)
 assert.equal(calculateBattleDamage(eruption,{...mon,currentHp:1},mon).power,1)
 assert.ok(calculateBattleDamage(eruption,{...mon,currentHp:1},mon).scenarios)
})
test('Flail and Reversal respect the Gen III HP brackets',()=>{
 const flail={...hit,power:1,effect:'FLAIL'}
 const attacker={...mon,stats:{...mon.stats,hp:480}}
 for(const [currentHp,power] of [[480,20],[329,40],[169,80],[99,100],[49,150],[10,200]])assert.equal(calculateBattleDamage(flail,{...attacker,currentHp},mon).power,power)
})
test('starter abilities activate at one third HP, including the integer threshold',()=>{
 const grass={...hit,type:'GRASS'}
 const boosted=calculateBattleDamage(grass,{...mon,currentHp:33},mon).scenarios[0]
 const normal=calculateBattleDamage(grass,{...mon,currentHp:34},mon).scenarios[0]
 assert.ok(boosted.max>normal.max)
})
test('attack and defense stages apply independently and cancel at equal stages',()=>{
 assert.equal(calculateBattleDamage(hit,{...mon,stages:{attack:2}},mon).scenarios[0].max,135)
 assert.equal(calculateBattleDamage(hit,mon,{...mon,stages:{defense:2}}).scenarios[0].max,36)
 assert.equal(calculateBattleDamage(hit,{...mon,stages:{attack:2}},{...mon,stages:{defense:2}}).scenarios[0].max,69)
})
test('burn reduces physical damage, Guts overrides that penalty and activates on all major status',()=>{
 assert.equal(calculateBattleDamage(hit,{...mon,status:'burn'},mon).scenarios[0].max,36)
 for(const status of ['burn','paralysis','poison','toxic','sleep','freeze'])assert.equal(calculateBattleDamage(hit,{...mon,ability:'Guts',status},mon).scenarios[0].max,102)
 const special={...hit,type:'WATER'}
 assert.equal(calculateBattleDamage(special,{...mon,status:'burn'},mon).scenarios[0].max,calculateBattleDamage(special,mon,mon).scenarios[0].max)
})
test('Marvel Scale boosts physical defense only while statused',()=>{
 const defender={...mon,ability:'Marvel Scale',status:'poison'}
 assert.equal(calculateBattleDamage(hit,mon,defender).scenarios[0].max,46)
 assert.equal(calculateBattleDamage(hit,mon,{...defender,status:'none'}).scenarios[0].max,69)
})
test('sun and rain modify damage before the final +2',()=>{
 const water={...hit,type:'WATER'}
 assert.equal(calculateBattleDamage(water,{...mon,weather:'rain'},mon).scenarios[0].max,68)
 assert.equal(calculateBattleDamage(water,{...mon,weather:'sun'},mon).scenarios[0].max,24)
 assert.equal(calculateBattleDamage({...hit,type:'FIRE'},{...mon,weather:'sun'},mon).scenarios[0].max,68)
})
test('Reflect and Light Screen affect only their damage category, while Brick Break bypasses screens',()=>{
 const defender={...mon,screens:{reflect:true,lightScreen:true}}
 assert.equal(calculateBattleDamage(hit,mon,defender).scenarios[0].max,36)
 assert.equal(calculateBattleDamage({...hit,type:'WATER'},mon,defender).scenarios[0].max,24)
 assert.equal(calculateBattleDamage({...hit,name:'Brick Break'},mon,defender).scenarios[0].max,69)
})
test('Cloud Nine and Air Lock suppress weather for either side, preserving possible ability scenarios',()=>{
 const water={...hit,type:'WATER'}
 const attacker={...mon,weather:'rain'}
 assert.equal(calculateBattleDamage(water,attacker,{...mon,ability:'Cloud Nine'}).scenarios[0].max,46)
 assert.equal(calculateBattleDamage(water,{...attacker,ability:'Air Lock'},mon).scenarios[0].max,46)
 assert.deepEqual(calculateBattleDamage(water,attacker,{...mon,ability:'Cloud Nine / Run Away'}).scenarios.map(s=>s.max),[46,68])
})
test('Weather Ball changes type, power and category; Sandstorm grants no Gen III SpD boost',()=>{
 const weatherBall={...hit,name:'Weather Ball',power:50,effect:'WEATHER_BALL'}
 const result=calculateBattleDamage(weatherBall,{...mon,weather:'sand'},mon)
 assert.equal(result.type,'ROCK');assert.equal(result.power,100);assert.equal(result.category,'Physical')
 assert.equal(calculateBattleDamage(weatherBall,{...mon,weather:'rain'},{...mon,ability:'Cloud Nine'}).power,50)
 const water={...hit,type:'WATER'}
 assert.equal(calculateBattleDamage(water,{...mon,weather:'sand'},{...mon,types:['ROCK']}).scenarios[0].max,calculateBattleDamage(water,mon,{...mon,types:['ROCK']}).scenarios[0].max)
})
test('fixed damage ignores stats, STAB, resistance, items, weather, and screens',()=>{
 const attacker={...mon,level:50,status:'burn',item:'Choice Band',weather:'rain',stages:{attack:6}}
 const defender={...mon,types:['WATER'],screens:{reflect:true,lightScreen:true},stages:{defense:6}}
 for(const [effect,value] of [['LEVEL_DAMAGE',50],['DRAGON_RAGE',40],['SONICBOOM',20]]){
  const result=calculateBattleDamage({...hit,power:1,effect},attacker,defender).scenarios[0]
  assert.equal(result.min,value);assert.equal(result.max,value)
 }
})
test('fixed damage respects immunities and Emerald’s Soundproof exceptions',()=>{
 assert.equal(calculateBattleDamage({...hit,power:1,effect:'LEVEL_DAMAGE',type:'NORMAL'},mon,{...mon,types:['GHOST']}).scenarios[0].max,0)
 assert.equal(calculateBattleDamage({...hit,name:'SonicBoom',power:1,effect:'SONICBOOM'},mon,{...mon,ability:'Soundproof'}).scenarios[0].max,20)
 assert.equal(calculateBattleDamage({...hit,power:1,effect:'DRAGON_RAGE',type:'DRAGON'},mon,{...mon,ability:'Wonder Guard'}).scenarios[0].max,0)
})
test('Super Fang rounds down remaining HP, deals one at one HP; Endeavor uses the difference or fails',()=>{
 const fang={...hit,power:1,effect:'SUPER_FANG'}
 assert.equal(calculateBattleDamage(fang,mon,{...mon,currentHp:51}).scenarios[0].max,25)
 assert.equal(calculateBattleDamage(fang,mon,{...mon,currentHp:1}).scenarios[0].koChance,100)
 const endeavor={...hit,power:1,effect:'ENDEAVOR'}
 assert.equal(calculateBattleDamage(endeavor,{...mon,currentHp:20},{...mon,currentHp:80}).scenarios[0].max,60)
 assert.match(calculateBattleDamage(endeavor,mon,{...mon,currentHp:80}).message,/fails/)
})
test('Low Kick uses Gen III weights and each exact weight bracket',async()=>{
 const {lowKickPower}=await import('../src/utils/battleDamage.js')
 for(const [weight,power] of [[9.9,20],[10,40],[24.9,40],[25,60],[49.9,60],[50,80],[99.9,80],[100,100],[199.9,100],[200,120]])assert.equal(lowKickPower(weight),power)
 assert.equal(calculateBattleDamage({...hit,power:1,effect:'LOW_KICK'},mon,{...mon,dex:306}).power,120)
 assert.equal(calculateBattleDamage({...hit,power:1,effect:'LOW_KICK'},mon,{...mon,dex:285}).power,20)
})
test('Return and Frustration use exact friendship, preserving zero and defaulting unknown to maximum power',()=>{
 const ret={...hit,power:1,effect:'RETURN'}
 const frustration={...hit,power:1,effect:'FRUSTRATION'}
 for(const friendship of [null,undefined,'']){
  assert.equal(calculateBattleDamage(ret,{...mon,friendship},mon).power,102)
  assert.equal(calculateBattleDamage(frustration,{...mon,friendship},mon).power,102)
 }
 for(const [friendship,returnPower,frustrationPower] of [[0,1,102],[100,40,62],[255,102,1]]){
  assert.equal(calculateBattleDamage(ret,{...mon,friendship},mon).power,returnPower)
  assert.equal(calculateBattleDamage(frustration,{...mon,friendship},mon).power,frustrationPower)
 }
})
test('two-hit moves sum independently rounded damage rolls',()=>{
 const single=calculateBattleDamage(hit,mon,mon).scenarios[0]
 for(const effect of ['DOUBLE_HIT','TWINEEDLE']){
  const result=calculateBattleDamage({...hit,effect},mon,mon).scenarios[0]
  assert.equal(result.hitRanges.length,1)
  assert.equal(result.hitRanges[0].hits,2)
  assert.equal(result.hitRanges[0].min,single.min*2)
  assert.equal(result.hitRanges[0].max,single.max*2)
  assert.equal(result.koChance,100)
 }
})
test('2–5 hits use Emerald probabilities and exact independent-roll convolution',async()=>{
 const {emeraldHitProbabilities,multiHitDistribution}=await import('../src/utils/battleDamage.js')
 assert.deepEqual(emeraldHitProbabilities.map(row=>row.probability),[.375,.375,.125,.125])
 assert.deepEqual([...multiHitDistribution([1,2],2)],[[2,.25],[3,.5],[4,.25]])
 const defender={...mon,stats:{...mon.stats,hp:200}}
 const result=calculateBattleDamage({...hit,effect:'MULTI_HIT'},mon,defender).scenarios[0]
 assert.deepEqual(result.hitRanges.map(row=>row.hits),[2,3,4,5])
 assert.equal(result.hitRanges[0].koChance,0)
 assert.equal(result.hitRanges[2].koChance,100)
 assert.equal(result.koChance,result.hitRanges.reduce((sum,row)=>sum+row.probability*row.koChance,0))
})
test('multi-hit immunity produces zero total damage at every hit count',()=>{
 const result=calculateBattleDamage({...hit,effect:'MULTI_HIT'},mon,{...mon,types:['GHOST']}).scenarios[0]
 assert.ok(result.hitRanges.every(row=>row.min===0&&row.max===0&&row.koChance===0))
})
test('critical toggle doubles base damage and respects Shell Armor and Battle Armor',()=>{
 const attacker={...mon,critical:true}
 assert.equal(calculateBattleDamage(hit,attacker,mon).scenarios[0].max,138)
 for(const ability of ['Shell Armor','Battle Armor']){
  const scenario=calculateBattleDamage(hit,attacker,{...mon,ability}).scenarios[0]
  assert.equal(scenario.max,69);assert.equal(scenario.critBlocked,true)
 }
 assert.deepEqual(calculateBattleDamage(hit,attacker,{...mon,ability:'Shell Armor / Water Absorb'}).scenarios.map(s=>s.max),[69,138])
})
test('Gen III critical hits ignore negative attack, positive defense and screens, retaining opposite stages and burn',()=>{
 const attacker={...mon,critical:true,stages:{attack:-6}}
 const defender={...mon,stages:{defense:6},screens:{reflect:true,lightScreen:true}}
 assert.equal(calculateBattleDamage(hit,attacker,defender).scenarios[0].max,138)
 assert.equal(calculateBattleDamage(hit,{...attacker,stages:{attack:2}},{...defender,stages:{defense:-2}}).scenarios[0].max,534)
 assert.equal(calculateBattleDamage(hit,{...attacker,status:'burn'},defender).scenarios[0].max,72)
 assert.equal(calculateBattleDamage({...hit,type:'WATER'},attacker,defender).scenarios[0].max,92)
})
test('fixed damage ignores the crit toggle and multi-hit moves apply it per hit',()=>{
 assert.equal(calculateBattleDamage({...hit,power:1,effect:'LEVEL_DAMAGE'},{...mon,critical:true},mon).scenarios[0].max,50)
 const scenario=calculateBattleDamage({...hit,effect:'DOUBLE_HIT'},{...mon,critical:true},mon).scenarios[0]
 assert.equal(scenario.hitRanges[0].max,276)
})
test('Psywave uses eleven level-scaled outcomes without ordinary modifiers',()=>{
 const move={name:'Psywave',type:'PSYCHIC',power:1,effect:'PSYWAVE'}
 const scenario=calculateBattleDamage(move,{...mon,critical:true},mon).scenarios[0]
 assert.deepEqual(scenario.rolls,[25,30,35,40,45,50,55,60,65,70,75])
 assert.equal(calculateBattleDamage(move,mon,{...mon,types:['DARK']}).scenarios[0].max,0)
})
test('Magnitude enumerates all seven powers and weighted KO odds',()=>{
 const move={name:'Magnitude',type:'GROUND',power:1,effect:'MAGNITUDE'}
 const scenario=calculateBattleDamage(move,mon,mon).scenarios[0]
 assert.deepEqual(scenario.outcomeRanges.map(r=>r.power),[10,30,50,70,90,110,150])
 assert.ok(Math.abs(scenario.outcomeRanges.reduce((s,r)=>s+r.probability,0)-1)<1e-12)
 assert.equal(calculateBattleDamage(move,mon,{...mon,ability:'Levitate'}).scenarios[0].koChance,0)
})
test('Present separates exact cartridge damage and healing probabilities',()=>{
 const move={name:'Present',type:'NORMAL',power:1,effect:'PRESENT'}
 const scenario=calculateBattleDamage(move,mon,{...mon,currentHp:1}).scenarios[0]
 assert.deepEqual(scenario.outcomeRanges.map(r=>r.probability),[102/256,76/256,26/256,52/256])
 assert.equal(scenario.outcomeRanges.at(-1).healed,25)
 assert.equal(scenario.koChance,204/256*100)
 assert.equal(calculateBattleDamage(move,mon,{...mon,types:['GHOST'],currentHp:1}).scenarios[0].outcomeRanges.at(-1).healed,25)
})
test('Triple Kick escalates each separately rounded kick and checks subsequent accuracy',()=>{
 const move={name:'Triple Kick',type:'FIGHTING',power:10,accuracy:90,effect:'TRIPLE_KICK'}
 const scenario=calculateBattleDamage(move,mon,mon).scenarios[0]
 assert.ok(Math.abs(scenario.hitRanges[0].probability-.1)<1e-12)
 assert.ok(Math.abs(scenario.hitRanges[1].probability-.09)<1e-12)
 assert.equal(scenario.hitRanges[2].probability,.81)
 const kicks=[10,20,30].map(power=>calculateBattleDamage({...move,power,effect:'HIT'},mon,mon).scenarios[0])
 assert.equal(scenario.hitRanges[2].max,kicks.reduce((sum,k)=>sum+k.max,0))
 assert.equal(calculateBattleDamage(move,mon,{...mon,types:['GHOST']}).scenarios[0].koChance,0)
})
test('Triple Kick hit odds honor accuracy abilities, weather and Gen III evasion items',()=>{
 const move={name:'Triple Kick',type:'FIGHTING',power:10,accuracy:90,effect:'TRIPLE_KICK'}
 const odds=(attacker,defender)=>calculateBattleDamage(move,attacker,defender).scenarios[0].hitRanges[2].probability
 assert.equal(odds({...mon,ability:'Compound Eyes'},mon),1)
 assert.equal(odds({...mon,ability:'Hustle'},mon),.72**2)
 assert.equal(odds(mon,{...mon,item:'Lax Incense'}),.85**2)
 assert.equal(odds(mon,{...mon,item:'BrightPowder'}),.81**2)
 assert.equal(odds({...mon,weather:'sand'},{...mon,ability:'Sand Veil'}),.72**2)
})
