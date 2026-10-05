import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const cache=process.argv[2]??'/private/tmp'
const games=['Ruby','Sapphire','Emerald','FireRed','LeafGreen','Colosseum','XD']
const output={}
const clean=value=>value.replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()
for(let dex=1;dex<=386;dex++){
 const html=await fs.readFile(`${cache}/emerald-serebii-${String(dex).padStart(3,'0')}.html`,'latin1')
 const table=html.match(/<a\s+name=["']location["'][^>]*>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i)?.[1]
 assert(table,`Missing location table: ${dex}`)
 const entries=[]
 for(const row of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell=>clean(cell[1]))
  if(!games.includes(cells[0]))continue
  if(!cells[1]){entries.push({game:cells[0],native:false,event:false,method:'Not listed'});continue}
  const text=cells[1]
  const trade=/trade from|transfer from/i.test(text)
  // Store factual source-game classifications, not the site's descriptive prose.
  entries.push({game:cells[0],native:!trade&&!/^(none|not available|unavailable|n\/?a|-)$/i.test(text),event:/event|bonus|channel|ticket|navel rock|birth island|faraway island/i.test(text),method:/trade/i.test(text)&&!trade?'In-game trade':/snag/i.test(text)?'Shadow Pokémon':/breed/i.test(text)?'Breeding':/evolv/i.test(text)?'Evolution':/^starter/i.test(text)?'Starter':/fossil|reviv/i.test(text)?'Fossil':/gift|egg|obtained|given/i.test(text)?'Gift':trade?'Trade':'Encounter'})
 }
 assert.equal(entries.length,7,`Expected seven game rows: ${dex}`)
 output[dex]=entries
}
await fs.writeFile(new URL('../src/data/availabilitySources.js',import.meta.url),`// Factual game/method classifications from Serebii's Gen III location tables.\n// Rebuild with node tools/buildAvailabilitySources.mjs /path/to/html/cache.\nexport const availabilitySources = ${JSON.stringify(output)}\n`)
console.log('Classified source-game availability for all 386 species.')
