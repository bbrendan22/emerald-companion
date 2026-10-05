import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const root=process.argv[2]
assert(root,'Usage: node tools/buildPickupResources.mjs /path/to/pokeemerald')
const text=await fs.readFile(`${root}/src/battle_script_commands.c`,'utf8')
const constants=await fs.readFile(`${root}/include/constants/items.h`,'utf8')
const ids={};let index=0
for(const token of constants.match(/enum\s*\{([\s\S]*?)\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').split(',')){const name=token.trim().match(/^(ITEM_\w+)/)?.[1];if(name)ids[name]=index++}
const codes={}
for(const [i,m] of [...(await fs.readFile(`${root}/include/constants/tms_hms.h`,'utf8')).matchAll(/^\s*F\((\w+)\)/gm)].entries()){const kind=i<50?'TM':'HM',code=kind+String(i<50?i+1:i-49).padStart(2,'0');ids[`ITEM_${kind}_${m[1]}`]=ids[`ITEM_${code}`];codes[ids[`ITEM_${code}`]]=code}
const array=name=>text.match(new RegExp(name+'\\[\\]\\s*=\\s*\\{([\\s\\S]*?)\\};'))[1]
const items=name=>[...array(name).matchAll(/ITEM_\w+/g)].map(m=>{const item=ids[m[0]];assert(item,m[0]);return {item,...(codes[item]?{code:codes[item]}:{})}})
const normal=items('sPickupItems'),rare=items('sRarePickupItems'),thresholds=array('sPickupProbabilities').match(/\d+/g).map(Number)
const bands=Array.from({length:10},(_,i)=>({min:i*10+1,max:i*10+10,items:[...thresholds.map((t,j)=>({...normal[i+j],chance:t-(thresholds[j-1]??0)})),{...rare[i],chance:1},{...rare[i+1],chance:1}]}))
assert(bands.every(b=>b.items.length===11&&b.items.reduce((n,x)=>n+x.chance,0)===100))
assert.equal(bands[9].items.at(-1).code,'TM26')
await fs.writeFile(new URL('../src/data/pickupResources.js',import.meta.url),`// Generated from pret/pokeemerald standard Pickup tables. Chances are conditional on activation.\nexport const pickupBands = ${JSON.stringify(bands)}\n`)
console.log('Generated all 10 Pickup level bands.')
