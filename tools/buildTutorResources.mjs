import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const root=process.argv[2]
assert(root,'Usage: node tools/buildTutorResources.mjs /path/to/pokeemerald')
const read=p=>fs.readFile(`${root}/${p}`,'utf8')
const parse=(text,prefix)=>Object.fromEntries([...text.matchAll(new RegExp('#define ('+prefix+'_\\w+)\\s+(\\d+)','g'))].map(m=>[m[1],+m[2]]))
const moveIds=parse(await read('include/constants/moves.h'),'MOVE'),speciesIds=parse(await read('include/constants/species.h'),'SPECIES')
const learnsets=await read('src/data/pokemon/tutor_learnsets.h'),compatible={}
for(const m of learnsets.matchAll(/\[(SPECIES_\w+)\]\s*=\s*\(([\s\S]*?)\),/g)){const id=speciesIds[m[1]];if(!pokemonMeta[id])continue;for(const move of m[2].matchAll(/TUTOR\((MOVE_\w+)\)/g))(compatible[moveIds[move[1]]]??=[]).push(id)}
const title=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())
const tutors=[]
const scripts=await read('data/scripts/move_tutors.inc')
for(const m of scripts.matchAll(/(\w+)_EventScript_\w+Tutor::([\s\S]*?)(?=\n\w+::)/g)){
 const move=m[2].match(/setvar VAR_0x8005, TUTOR_(MOVE_\w+)/)?.[1];if(!move)continue
 const map=JSON.parse(await read(`data/maps/${m[1]}/map.json`))
 const location=title(map.id.replace(/^MAP_/,'').replace(/_/g,' ')).replace(/ (\d+)f\b/gi,' $1F')
 tutors.push({moveId:moveIds[move],location,cost:0,repeatable:false,species:compatible[moveIds[move]]??[]})
}
const frontier=await read('data/maps/BattleFrontier_Lounge7/scripts.inc'),field=await read('src/field_specials.c')
for(const side of [1,2]){
 const block=field.match(new RegExp('sBattleFrontier_TutorMoves'+side+'\\[\\]\\s*=\\s*\\{([\\s\\S]*?)\\};'))[1]
 for(const m of block.matchAll(/MOVE_(\w+)/g)){
 const suffix=m[1].replace(/_/g,'').toLowerCase()
 const costBlock=[...frontier.matchAll(/BattleFrontier_Lounge7_EventScript_(\w+)::\s*\n\s*setvar VAR_0x8008, (\d+)/g)].find(x=>x[1].toLowerCase()===suffix)
 assert(costBlock,m[1]);const moveId=moveIds[m[0]]
 tutors.push({moveId,location:'Battle Frontier · Move Tutor house',side:side===1?'Left tutor':'Right tutor',cost:+costBlock[2],repeatable:true,species:compatible[moveId]??[]})
 }
}
assert.equal(tutors.length,30)
assert(tutors.every(t=>t.species.length>0))
assert.equal(tutors.find(t=>t.moveId===moveIds.MOVE_ROCK_SLIDE).cost,48)
await fs.writeFile(new URL('../src/data/tutorResources.js',import.meta.url),`// Generated from pret/pokeemerald tutor scripts and learnsets.\nexport const tutorResources = ${JSON.stringify(tutors)}\n`)
console.log('Generated 10 one-time tutors and 20 Frontier tutor moves with compatibility.')
