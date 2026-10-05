import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
// Pass a local pret/pokeemerald checkout; no upstream code is executed.
const root=process.argv[2]
assert(root,'Usage: node tools/buildTrainerResources.mjs /path/to/pokeemerald')
const read=p=>fs.readFile(path.join(root,p),'utf8')
const [constants,parties,definitions,classes,battle]=await Promise.all(['include/constants/species.h','src/data/trainer_parties.h','src/data/trainers.h','src/data/text/trainer_class_names.h','src/battle_main.c'].map(read))
const species=Object.fromEntries([...constants.matchAll(/#define (SPECIES_\w+)\s+(\d+)/g)].map(m=>[m[1],+m[2]]))
const title=s=>s.replace(/\{PKMN\}/g,'Pokémon').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())
const classNames=Object.fromEntries([...classes.matchAll(/\[(TRAINER_CLASS_\w+)\]\s*=\s*_\("([^"]+)"\)/g)].map(m=>[m[1],title(m[2])]))
const money=Object.fromEntries([...battle.matchAll(/\{\s*(TRAINER_CLASS_\w+)\s*,\s*(\d+)\s*\}/g)].map(m=>[m[1],+m[2]]))
const [moveConstants,itemConstants,learnsets,pointers]=await Promise.all(['include/constants/moves.h','include/constants/items.h','src/data/pokemon/level_up_learnsets.h','src/data/pokemon/level_up_learnset_pointers.h'].map(read))
const moveIds=Object.fromEntries([...moveConstants.matchAll(/#define (MOVE_\w+)\s+(\d+)/g)].map(m=>[m[1],+m[2]]))
const itemEnum=itemConstants.match(/enum\s*\{([\s\S]*?)\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'')
const itemIds=Object.fromEntries([...itemEnum.matchAll(/ITEM_(\w+)/g)].map((m,i)=>['ITEM_'+m[1],i]))
const levelSets=Object.fromEntries([...learnsets.matchAll(/static const u16 (\w+)\[\] = \{([\s\S]*?)\};/g)].map(m=>[m[1],[...m[2].matchAll(/LEVEL_UP_MOVE\(\s*(\d+),\s*(MOVE_\w+)\)/g)].map(x=>({level:+x[1],move:moveIds[x[2]]}))]))
const speciesSets=Object.fromEntries([...pointers.matchAll(/\[(SPECIES_\w+)\]\s*=\s*(\w+)/g)].map(m=>[species[m[1]],levelSets[m[2]]]))
const teams={}
for(const match of parties.matchAll(/static const struct \w+ (sParty_\w+)\[\] = \{([\s\S]*?)\n\};/g)) {
 teams[match[1]]=[...match[2].matchAll(/\{([\s\S]*?)\n\s*\}/g)].map(m=>{
 const body=m[1],level=+body.match(/\.lvl\s*=\s*(\d+)/)[1],id=species[body.match(/\.species\s*=\s*(SPECIES_\w+)/)[1]]
 const custom=body.match(/\.moves\s*=\s*\{([^}]+)\}/)?.[1]
 const moves=[]
 if(custom) moves.push(...[...custom.matchAll(/MOVE_\w+/g)].map(x=>moveIds[x[0]]).filter(Boolean))
 else for(const entry of speciesSets[id]??[]) { if(entry.level>level)break; if(!moves.includes(entry.move)){if(moves.length===4)moves.shift();moves.push(entry.move)} }
 assert(moves.length>0 && moves.every(Boolean),match[1])
 return {species:id,level,moves,heldItem:itemIds[body.match(/\.heldItem\s*=\s*(ITEM_\w+)/)?.[1]]??0}
})
}
const trainers={}
for(const match of definitions.matchAll(/\[(TRAINER_\w+)\]\s*=\s*\{([\s\S]*?)(?=\n    \[TRAINER_|\n\};)/g)) {
 const body=match[2],team=teams[body.match(/\(\s*(sParty_\w+)\s*\)/)?.[1]]
 if(!team?.length)continue
 const trainerClass=body.match(/\.trainerClass\s*=\s*(TRAINER_CLASS_\w+)/)?.[1]
 const double=/\.doubleBattle\s*=\s*TRUE/.test(body)
 assert(team.every(mon=>pokemonMeta[mon.species]),match[1])
 trainers[match[1]]={id:match[1],name:title(body.match(/\.trainerName\s*=\s*_\("([^"]+)"\)/)?.[1]??''),class:classNames[trainerClass],sprite:body.match(/\.trainerPic\s*=\s*TRAINER_PIC_(\w+)/)?.[1].toLowerCase(),double,prize:4*team.at(-1).level*(money[trainerClass]??5)*(double?2:1),team}
}
const setup=await read('src/battle_setup.c')
const rematchIds=new Set()
let rematchCount=0
for(const match of setup.matchAll(/= REMATCH\(([^)]+)\)/g)) {
 const ids=match[1].split(',').slice(0,5).map(id=>id.trim())
 const base=trainers[ids[0]]
 assert(base,ids[0])
 const variants=[...new Set(ids.slice(1))].filter(id=>id!==ids[0])
 base.rematches=variants.map(id=>{assert(trainers[id],id);rematchIds.add(id);return trainers[id]})
 if(variants.length)rematchCount++
}
const locations=[]
const coverage=new Set()
const gabbyRoutes={MAP_ROUTE111:[1,4,6],MAP_ROUTE118:[2,5,6],MAP_ROUTE120:[3,6]}

for(const folder of await fs.readdir(path.join(root,'data/maps'))) {
 let scripts,map
 try { [scripts,map]=await Promise.all([read(`data/maps/${folder}/scripts.inc`),read(`data/maps/${folder}/map.json`).then(JSON.parse)]) } catch {continue}
 const direct=[...scripts.matchAll(/trainerbattle_(?!rematch)\w+\s+(TRAINER_\w+)/g)].map(m=>m[1])
 const raw=[...scripts.matchAll(/trainerbattle\s+TRAINER_BATTLE_(SET_TRAINER_[AB]|\w+),\s*(TRAINER_\w+)/g)]
 const ids=[...new Set([...direct,...raw.map(m=>m[2])])].filter(id=>trainers[id]&&!rematchIds.has(id))
 for(const id of ids)coverage.add(id)
 const entries=ids.map(id=>{
  const trainer={...trainers[id]}
  if(raw.some(m=>m[2]===id&&m[1].startsWith('SET_TRAINER_')))trainer.battleType='Multi'
  const starter=id.match(/^TRAINER_(?:MAY|BRENDAN)_.+_(TREECKO|TORCHIC|MUDKIP)$/)?.[1]
  if(starter)trainer.variant=`Your starter: ${title(starter)}`
  return trainer
 })
 const stages=gabbyRoutes[map.id]
 if(stages) {
  const base={...trainers[`TRAINER_GABBY_AND_TY_${stages[0]}`],variant:`Battle ${stages[0]}`,rematches:stages.slice(1).map(stage=>({...trainers[`TRAINER_GABBY_AND_TY_${stage}`],label:`Battle ${stage}${stage===6?' onward':''}`}))}
  entries.push(base)
 }

 if(!entries.length)continue
 const name=title(map.id.replace(/^MAP_/,'').replace(/_/g,' ').replace(/([A-Z])(\d)/g,'$1 $2')).replace(/ (\d+)f\b/gi,' $1F')
 locations.push({id:map.id,name,trainers:entries})
}
assert(coverage.has('TRAINER_MAXIE_MOSSDEEP'))
assert(coverage.has('TRAINER_TABITHA_MOSSDEEP'))
for(const route of Object.keys(gabbyRoutes))assert(locations.find(l=>l.id===route).trainers.some(t=>t.id.startsWith('TRAINER_GABBY_AND_TY_')))
assert.equal(locations.find(l=>l.id==='MAP_ROUTE102').trainers.length,4)
assert.equal(trainers.TRAINER_CALVIN_1.prize,80)
assert.equal(trainers.TRAINER_ROXANNE_1.team.length,3)
assert(locations.length>80)
assert.equal(trainers.TRAINER_ROXANNE_1.rematches.length,4)
assert.equal(trainers.TRAINER_CALVIN_1.rematches.length,4)
assert(Object.values(trainers).every(trainer=>trainer.prize>0))
assert(Object.values(teams).flat().every(mon=>mon.moves.length<=4 && mon.level>=1 && mon.level<=100))
console.log(`Validated teams and prize money; ${rematchCount} trainer rematch chains.`)
await fs.writeFile(new URL('../src/data/trainerResources.js',import.meta.url),`// Generated from pret/pokeemerald map scripts and trainer data.\nexport const trainerLocations = ${JSON.stringify(locations)}\n`)
console.log(`Generated ${locations.length} locations with ${locations.reduce((n,l)=>n+l.trainers.length,0)} trainer entries.`)
