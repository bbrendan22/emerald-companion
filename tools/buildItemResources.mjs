import fs from 'node:fs/promises'
import { pokemonMeta } from '../src/data/pokemonMeta.js'
const base='https://raw.githubusercontent.com/pret/pokeemerald/master/'
const paths=['include/constants/items.h','src/data/items.h','src/data/text/item_descriptions.h','include/constants/tms_hms.h','include/constants/moves.h','include/constants/species.h','src/data/pokemon/tmhm_learnsets.h']
const [constants,source,descriptions,machines,moves,species,learnsets]=await Promise.all(paths.map(async path=>{let r=await fetch(base+path);if(!r.ok)throw new Error(path);return r.text()}))
const parse=(text,prefix)=>Object.fromEntries([...text.matchAll(new RegExp('#define '+prefix+'_(\\w+)\\s+(\\d+)','g'))].map(m=>[m[1],Number(m[2])]))
const itemIds={}
let itemIndex=0
for (const token of constants.match(/enum\s*\{([\s\S]*?)\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').split(',')) { const name=token.trim().match(/^ITEM_(\w+)/)?.[1]; if(name)itemIds[name]=itemIndex++ }
const moveIds=parse(moves,'MOVE'),speciesIds=parse(species,'SPECIES')
const desc=Object.fromEntries([...descriptions.matchAll(/static const u8 (\w+)\[\] = _\(([\s\S]*?)\);/g)].map(m=>[m[1],[...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(q=>JSON.parse('"'+q[1]+'"')).join('').replace(/\n/g,' ')]))
const items={}
for(const m of source.matchAll(/\[ITEM_(\w+)\]\s*=\s*\{([\s\S]*?)\n\s*\}/g)){
 const id=itemIds[m[1]],body=m[2],name=body.match(/\.name\s*=\s*_\("([^"]+)"\)/)?.[1];if(!id||!name||name.includes('?'))continue
 const field=key=>body.match(new RegExp('\\.'+key+'\\s*=\\s*(\\w+)'))?.[1]
 items[id]={name:name.replace('POKé','Poké'),description:desc[field('description')],pocket:field('pocket')?.replace('POCKET_',''),price:Number(field('price')??0),held:!!field('holdEffect')&&field('holdEffect')!=='HOLD_EFFECT_NONE'}
 if(!items[id].description)throw new Error('Missing description '+name)
}
const compatible={}
for(const m of learnsets.matchAll(/\[SPECIES_(\w+)\]\s*=\s*\{\s*\.learnset\s*=\s*\{([\s\S]*?)\}\s*\}/g)){
 const id=speciesIds[m[1]];if(!pokemonMeta[id])continue
 for(const match of m[2].matchAll(/\.(\w+)\s*=\s*TRUE/g))(compatible[match[1]]??=[]).push(id)
}
const machineList=[...machines.matchAll(/^\s*F\((\w+)\)/gm)].map((m,index)=>({code:(index<50?'TM':'HM')+String(index<50?index+1:index-49).padStart(2,'0'),moveId:moveIds[m[1]],species:compatible[m[1]]??[]}))
if(Object.keys(items).length<250)throw new Error('Incomplete item data')
if(machineList.length!==58||machineList.some(m=>!m.moveId))throw new Error('Invalid machine mapping')
await fs.writeFile('src/data/itemResources.js','// Generated from pret/pokeemerald. Run node tools/buildItemResources.mjs\nexport const itemResources = '+JSON.stringify(items,null,2)+'\nexport const machineResources = '+JSON.stringify(machineList,null,2)+'\n')
console.log(Object.keys(items).length+' named items and 58 TMs/HMs generated.')
