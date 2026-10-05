import fs from 'node:fs'
import path from 'node:path'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
import { moveNames } from '../src/data/emeraldData.js'
import { levelMoves, eggMoves } from '../src/data/eggMoveResources.js'
import { machineResources } from '../src/data/itemResources.js'
import { tutorResources } from '../src/data/tutorResources.js'
import { previousEvolutions } from '../src/utils/evolutions.js'
const cache = process.argv[2] ?? '/private/tmp'
const normalize = text => text.toLowerCase().replace(/[^a-z0-9]/g, '')
const moves = new Map(Object.entries(moveNames).map(([id,name])=>[normalize(name),Number(id)]))
const text = html => html.replace(/<[^>]*>/g,' ').replace(/&#8212;|&mdash;/g,'—').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()
const resources = {}
for (const [id,meta] of Object.entries(pokemonMeta)) {
 const html=fs.readFileSync(path.join(cache,`emerald-serebii-${String(meta.dex).padStart(3,'0')}.html`),'latin1')
 const entries=[]
 for (const table of html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)) {
  const header=text(table[0].split('</thead>')[0])
  const level=header.includes('Level Up'), special=header.includes('Special Attacks')
  const tutor=header.includes('Tutor Attacks')&&!header.startsWith('Emerald')
  if(!level&&!special&&!tutor)continue
  const rows=[...table[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match=>match[1])
  for(let i=0;i<rows.length;i++) {
   const link=rows[i].match(/<a\b[^>]*href="\/attackdex\/[^\"]+"[^>]*>(.*?)<\/a>/i)
   if(!link)continue
   const move=moves.get(normalize(text(link[1])))
   if(!move)throw new Error(`Unknown move ${text(link[1])} for ${meta.name}`)
   if(level) {
    const cells=[...rows[i].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
    const value=text(cells[0][1]); const lv=/^\d+$/.test(value)?Number(value):1
    entries.push({move,method:'Level-up',game:header.startsWith('Fire Red')?'FireRed / LeafGreen':'Ruby / Sapphire / Colosseum / XD',level:lv})
   } else if(tutor) entries.push({move,method:'Move tutor',game:'FireRed / LeafGreen'})
   else {
    const source=text((rows[i+1]??'').match(/<b>([\s\S]*?)<\/b>/i)?.[1]??'')
    if(!source)throw new Error(`Missing special source ${meta.name}`)
    if(source.includes('Cape Brink') && ![3,6,9].includes(meta.dex))continue // Only fully evolved Kanto starters qualify.
    const game=source.includes('Box')?'Pokémon Box':source.includes('Fire Red')?'FireRed / LeafGreen':'XD'
    const method=source.includes('Purifying')?'Purification':source.includes('Prize')?'Mt. Battle reward':source.includes('Box')?'Gift Egg':source.includes('Cape')?'Cape Brink tutor':'Mew tutor · Mt. Battle'
    const requirement=source.includes('Box')?(source.startsWith('Start')?'Start Pokémon Box':`Deposit ${source.match(/\d+/)?.[0]} Pokémon in Pokémon Box`):undefined
    entries.push({move,game,method,...(requirement?{requirement}:{})})
   }
  }
 }
 resources[id]=entries
}
// Audit corrections: species tables omit XD general tutors and misidentify Mew's Role Play.
// PokeAPI's factual Gen III method tables supply level-up/tutor compatibility.
const csvPath=process.argv[3] ?? '/private/tmp/emerald-pokemon-moves.csv'
const rows=fs.readFileSync(csvPath,'utf8').trim().split('\n').slice(1).map(line=>line.split(',').map(Number))
const dexIds=new Map(Object.entries(pokemonMeta).map(([id,meta])=>[meta.dex,id]))
for(const id of Object.keys(resources)) resources[id]=resources[id].filter(entry=>!['Level-up','Move tutor'].includes(entry.method)&&!entry.method.startsWith('Mew tutor'))
for(const [dex,version,move,method,level] of rows) {
 if(![5,7,12,13].includes(version)||![1,3].includes(method))continue
 let target=dex,game={5:'Ruby / Sapphire',7:'FireRed / LeafGreen',12:'Colosseum',13:'XD'}[version]
 if(dex===10001&&version===7){target=386;game='FireRed · Attack Forme'}
 if(dex===10002&&version===7){target=386;game='LeafGreen · Defense Forme'}
 if(target>386||!dexIds.has(target))continue
 const id=dexIds.get(target)
 const entry={move,method:method===1?'Level-up':'Move tutor',game,...(method===1?{level}:{})}
 if(!resources[id].some(e=>e.move===move&&e.method===entry.method&&e.game===game&&e.level===entry.level))resources[id].push(entry)
}
// Include purification-only moves missing from species-page special tables.
for(const [dex,version,move,method] of rows) {
 if(version!==13||method!==9||!dexIds.has(dex))continue
 const id=dexIds.get(dex),family=new Set([id])
 for(const species of family)for(const entry of previousEvolutions(species))family.add(entry.from)
 const covered=[...family].some(species=>resources[species].some(entry=>entry.move===move)||(levelMoves[species]??[]).some(entry=>entry.move===move)||(eggMoves[species]??[]).includes(move)||machineResources.some(entry=>entry.moveId===move&&entry.species.includes(Number(species)))||tutorResources.some(entry=>entry.moveId===move&&entry.species.includes(Number(species))))
 if(!covered)resources[id].push({move,method:'Purification',game:'XD'})
}
const mew=dexIds.get(151)
const frlgTutorLocations = new Map(Object.entries({
 'Body Slam':'Four Island', Counter:'Celadon City', 'Double Edge':'Victory Road',
 'Dream Eater':'Viridian City', Explosion:'Mt. Ember', 'Mega Kick':'Route 4',
 'Mega Punch':'Route 4', Metronome:'Cinnabar Island', Mimic:'Saffron City',
 'Rock Slide':'Rock Tunnel', 'Seismic Toss':'Pewter City', 'Soft Boiled':'Celadon City',
 Substitute:'Fuchsia City', 'Swords Dance':'Seven Island', 'Thunder Wave':'Saffron City',
 'Blast Burn':'Cape Brink', 'Frenzy Plant':'Cape Brink', 'Hydro Cannon':'Cape Brink',
}).map(([name,location])=>[moves.get(normalize(name)),location]))
const mewTutorMoves = ['Faint Attack','Fake Out','Hypnosis','Night Shade','Role Play','Zap Cannon'].map(name=>moves.get(normalize(name)))
resources[mew]=resources[mew].filter(entry=>!(entry.game==='XD'&&entry.method==='Move tutor'&&mewTutorMoves.includes(entry.move)))
for(const name of ['Faint Attack','Fake Out','Hypnosis','Night Shade','Role Play','Zap Cannon'])resources[mew].push({move:moves.get(normalize(name)),method:'Mew tutor',game:'XD',requirement:'Mt. Battle · After the main story · 5,000 Poké Coupons'})
for(const entries of Object.values(resources))for(const entry of entries) {
 if(['FireRed / LeafGreen','FireRed · Attack Forme','LeafGreen · Defense Forme'].includes(entry.game)&&entry.method.toLowerCase().includes('tutor'))entry.location=frlgTutorLocations.get(entry.move)
 if(entry.game==='XD'&&entry.method==='Move tutor')entry.location='Agate Village'
 if(entry.game==='XD'&&entry.method==='Mew tutor')entry.location='Mt. Battle'
 if(entry.method==='Cape Brink tutor')entry.requirement='Fully evolved Kanto starter · Maximum friendship (255)'
 if(entry.method==='Mt. Battle reward')entry.requirement='Complete battles 1–100 in one challenge without leaving or changing the team'
 if(entry.method==='Gift Egg'&&entry.requirement.startsWith('Deposit'))entry.requirement+=' from the same GBA save file'
}
fs.writeFileSync('src/data/crossGameMoves.js',`// Gen III move methods from cached Serebii Gen III species tables.\n// Regenerate with node tools/buildCrossGameMoves.mjs <cache-directory> <pokemon-moves-csv>.\nexport const crossGameMoves = ${JSON.stringify(resources)}\n`)
console.log(`Generated ${Object.keys(resources).length} species`)
