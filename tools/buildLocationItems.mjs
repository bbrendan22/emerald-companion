import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { itemResources } from '../src/data/itemResources.js'
const root=process.argv[2]
assert(root,'Usage: node tools/buildLocationItems.mjs /path/to/pokeemerald')
const read=p=>fs.readFile(path.join(root,p),'utf8')
const constants=await read('include/constants/items.h')
const ids={};let index=0
for(const token of constants.match(/enum\s*\{([\s\S]*?)\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').split(',')){const name=token.trim().match(/^(ITEM_\w+)/)?.[1];if(name)ids[name]=index++}
const machines=[...(await read('include/constants/tms_hms.h')).matchAll(/^\s*F\((\w+)\)/gm)]
for(const [i,m] of machines.entries()){const kind=i<50?'TM':'HM',number=i<50?i+1:i-49;ids[`ITEM_${kind}_${m[1]}`]=ids[`ITEM_${kind}${String(number).padStart(2,'0')}`]}
const machineCodes=Object.fromEntries(machines.map((m,i)=>{const code=(i<50?'TM':'HM')+String(i<50?i+1:i-49).padStart(2,'0');return [ids[`ITEM_${code}`],code]}))
const balls=await read('data/scripts/item_ball_scripts.inc')
const pickups=Object.fromEntries([...balls.matchAll(/(\w+)::\s*\n\s*finditem (ITEM_\w+)(?:,\s*(\d+))?/g)].map(m=>[m[1],{item:ids[m[2]],quantity:Number(m[3]??1)}]))
const title=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())
const locations=[]
for(const folder of await fs.readdir(path.join(root,'data/maps'))){
 let map,scripts
 try{[map,scripts]=await Promise.all([read(`data/maps/${folder}/map.json`).then(JSON.parse),read(`data/maps/${folder}/scripts.inc`)])}catch{continue}
 const items=[]
 for(const obj of map.object_events??[])if(pickups[obj.script])items.push({...pickups[obj.script],kind:'Pickup',x:obj.x,y:obj.y})
 for(const obj of map.bg_events??[])if(obj.type==='hidden_item')items.push({item:ids[obj.item],quantity:1,kind:'Hidden item',x:obj.x,y:obj.y})
 for(const m of scripts.matchAll(/^\s*giveitem (ITEM_\w+)(?:,\s*(\d+))?/gm))items.push({item:ids[m[1]],quantity:Number(m[2]??1),kind:'Gift / reward'})
 const seen=new Set()
 const valid=items.filter(item=>{if(machineCodes[item.item])item.code=machineCodes[item.item];if(!itemResources[item.item]&&!item.code)return false;const key=JSON.stringify(item);if(seen.has(key))return false;seen.add(key);return true})
 if(valid.length)locations.push({id:map.id,name:title(map.id.replace(/^MAP_/,'').replace(/_/g,' ').replace(/([A-Z])(\d)/g,'$1 $2')).replace(/ (\d+)f\b/gi,' $1F'),items:valid})
}
const route=locations.find(l=>l.id==='MAP_ROUTE102')
assert(route.items.some(i=>i.item===ids.ITEM_POTION&&i.kind==='Pickup'))
const gym=locations.find(l=>l.id==='MAP_RUSTBORO_CITY_GYM')
assert(gym.items.some(i=>i.item===ids.ITEM_TM_ROCK_TOMB&&i.kind==='Gift / reward'))
assert(locations.find(l=>l.id==='MAP_ROUTE104').items.filter(i=>i.kind==='Hidden item').length===5)
assert(locations.length>100)
await fs.writeFile(new URL('../src/data/locationItems.js',import.meta.url),`// Generated from pret/pokeemerald map events and scripts.\nexport const itemLocations = ${JSON.stringify(locations)}\n`)
console.log(`Generated ${locations.length} locations with ${locations.reduce((n,l)=>n+l.items.length,0)} item entries.`)
