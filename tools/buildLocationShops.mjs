import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=process.argv[2]
assert(root,'Usage: node tools/buildLocationShops.mjs /path/to/pokeemerald')
const read=p=>fs.readFile(path.join(root,p),'utf8')
const constants=await read('include/constants/items.h'),ids={};let index=0
for(const token of constants.match(/enum\s*\{([\s\S]*?)\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').split(',')){const name=token.trim().match(/^(ITEM_\w+)/)?.[1];if(name)ids[name]=index++}
const codes={}
for(const [i,m] of [...(await read('include/constants/tms_hms.h')).matchAll(/^\s*F\((\w+)\)/gm)].entries()){const kind=i<50?'TM':'HM',code=kind+String(i<50?i+1:i-49).padStart(2,'0');ids[`ITEM_${kind}_${m[1]}`]=ids[`ITEM_${code}`];codes[ids[`ITEM_${code}`]]=code}
const prices=Object.fromEntries([...(await read('src/data/items.h')).matchAll(/\[(ITEM_\w+)\]\s*=\s*\{([\s\S]*?)\n\s*\}/g)].map(m=>[ids[m[1]],Number(m[2].match(/\.price\s*=\s*(\d+)/)?.[1]??0)]))
const berries=Object.fromEntries([...(await read('data/scripts/new_game.inc')).matchAll(/setberrytree (BERRY_TREE_\w+),\s*ITEM_TO_BERRY\((ITEM_\w+)\)/g)].map(m=>[m[1],ids[m[2]]]))
const title=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())
const locations=[]
for(const folder of await fs.readdir(path.join(root,'data/maps'))){
 let map,scripts;try{[map,scripts]=await Promise.all([read(`data/maps/${folder}/map.json`).then(JSON.parse),read(`data/maps/${folder}/scripts.inc`)])}catch{continue}
 const trees=(map.object_events??[]).filter(o=>berries[o.trainer_sight_or_berry_tree_id]).map(o=>({item:berries[o.trainer_sight_or_berry_tree_id],x:o.x,y:o.y}))
 const shops=[]
 for(const label of new Set([...scripts.matchAll(/^\s*pokemart (\w+)/gm)].map(m=>m[1]))){
 const block=scripts.match(new RegExp('^'+label+':+\\s*\\n([\\s\\S]*?)pokemartlistend','m'))?.[1];assert(block,label)
 const items=[...block.matchAll(/\.2byte (ITEM_\w+)/g)].map(m=>{const item=ids[m[1]];assert(item&&prices[item]>0,m[1]);return {item,price:prices[item],...(codes[item]?{code:codes[item]}:{})}})
 const suffix=label.split(/_Pokemart_?/)[1]??''
 shops.push({name:suffix?title(suffix.replace(/([a-z])(\d)/g,'$1 $2').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ')):'Shop',items})
 }
 if(trees.length||shops.length)locations.push({id:map.id,name:title(map.id.replace(/^MAP_/,'').replace(/_/g,' ').replace(/([A-Z])(\d)/g,'$1 $2')).replace(/ (\d+)f\b/gi,' $1F'),shops,trees})
}
assert.equal(locations.find(l=>l.id==='MAP_ROUTE102').trees.length,2)
assert.equal(locations.find(l=>l.id==='MAP_OLDALE_TOWN_MART').shops.length,2)
assert(locations.find(l=>l.id==='MAP_LILYCOVE_CITY_DEPARTMENT_STORE_4F').shops.flatMap(s=>s.items).every(i=>i.code&&i.price>0))
await fs.writeFile(new URL('../src/data/locationShops.js',import.meta.url),`// Generated from pret/pokeemerald shop scripts, item prices, and initial berry trees.\nexport const shopLocations = ${JSON.stringify(locations)}\n`)
console.log(`${locations.reduce((n,l)=>n+l.shops.length,0)} shop inventories; ${locations.reduce((n,l)=>n+l.trees.length,0)} initial berry trees.`)
