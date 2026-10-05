import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const source=process.argv[2]
assert(source,'Pass a local pret/pokeemerald checkout')
const sections=JSON.parse(await fs.readFile(path.join(source,'src/data/region_map/region_map_sections.json'),'utf8')).map_sections
const used=new Set()
for(const folder of await fs.readdir(path.join(source,'data/maps'))) {
 try { const map=JSON.parse(await fs.readFile(path.join(source,'data/maps',folder,'map.json'),'utf8'));used.add(map.region_map_section) } catch { /* Some directories have no map definition. */ }
}
const excluded=new Set(['','UNDERWATER','INSIDE OF TRUCK','SECRET BASE'])
const title=text=>text.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())
const locations=sections.filter(section=>used.has(section.id)&&!excluded.has(section.name)).map(section=>({id:section.id,name:title(section.name)}))
locations.push({id:'SS_TIDAL',name:'S.S. Tidal'})
locations.push(
 {id:'TRICK_HOUSE',name:'Trick House'},
 {id:'WEATHER_INSTITUTE',name:'Weather Institute'},
 {id:'POKEMON_DAY_CARE',name:'Pokémon Day Care'},
 {id:'LILYCOVE_DEPARTMENT_STORE',name:'Lilycove Department Store'},
 {id:'MAUVILLE_GAME_CORNER',name:'Mauville Game Corner'},
 {id:'POKEMON_LEAGUE',name:'Pokémon League'},
 {id:'DEVON_CORPORATION',name:'Devon Corporation'},
 {id:'OCEANIC_MUSEUM',name:'Oceanic Museum'},
 {id:'MOSSDEEP_SPACE_CENTER',name:'Mossdeep Space Center'},
 {id:'SLATEPORT_BATTLE_TENT',name:'Slateport Battle Tent'},
 {id:'VERDANTURF_BATTLE_TENT',name:'Verdanturf Battle Tent'},
 {id:'FALLARBOR_BATTLE_TENT',name:'Fallarbor Battle Tent'},
 {id:'CONTEST_HALL',name:'Contest Hall'},
 {id:'BERRY_MASTERS_HOUSE',name:'Berry Master’s House'},
 ...['Rustboro','Dewford','Mauville','Lavaridge','Petalburg','Fortree','Mossdeep','Sootopolis'].map(city=>({id:`GYM_${city.toUpperCase()}`,name:`${city} Gym`})),
 ...['Arena','Dome','Factory','Palace','Pike','Pyramid','Tower'].map(facility=>({id:`BATTLE_${facility.toUpperCase()}`,name:`Battle ${facility}`})),
 {id:'SEASIDE_CYCLING_ROAD',name:'Seaside Cycling Road'},
 {id:'MIRAGE_ISLAND',name:'Mirage Island'},
)
locations.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))
const parents={
 TRICK_HOUSE:'MAPSEC_ROUTE_110',WEATHER_INSTITUTE:'MAPSEC_ROUTE_119',POKEMON_DAY_CARE:'MAPSEC_ROUTE_117',
 LILYCOVE_DEPARTMENT_STORE:'MAPSEC_LILYCOVE_CITY',MAUVILLE_GAME_CORNER:'MAPSEC_MAUVILLE_CITY',POKEMON_LEAGUE:'MAPSEC_EVER_GRANDE_CITY',
 DEVON_CORPORATION:'MAPSEC_RUSTBORO_CITY',OCEANIC_MUSEUM:'MAPSEC_SLATEPORT_CITY',MOSSDEEP_SPACE_CENTER:'MAPSEC_MOSSDEEP_CITY',
 SLATEPORT_BATTLE_TENT:'MAPSEC_SLATEPORT_CITY',VERDANTURF_BATTLE_TENT:'MAPSEC_VERDANTURF_TOWN',FALLARBOR_BATTLE_TENT:'MAPSEC_FALLARBOR_TOWN',
 CONTEST_HALL:'MAPSEC_LILYCOVE_CITY',BERRY_MASTERS_HOUSE:'MAPSEC_ROUTE_123',SEASIDE_CYCLING_ROAD:'MAPSEC_ROUTE_110',MIRAGE_ISLAND:'MAPSEC_ROUTE_130',
}
for(const location of locations) {
 if(location.id.startsWith('GYM_')) {
  const city=location.id.slice(4)
  location.parent=`MAPSEC_${city}_${['DEWFORD','LAVARIDGE'].includes(city)?'TOWN':'CITY'}`
 } else if(location.id.startsWith('BATTLE_'))location.parent='MAPSEC_BATTLE_FRONTIER'
 else if(parents[location.id])location.parent=parents[location.id]
 if(location.parent)assert(locations.some(parent=>parent.id===location.parent),location.id)
}
assert.equal(new Set(locations.map(location=>location.name)).size,locations.length)
await fs.writeFile('src/data/locationIndex.js',`// Generated from Emerald region-map sections by tools/buildLocationIndex.mjs.\nexport const locationIndex = ${JSON.stringify(locations,null,2)}\n`)
console.log(`Generated ${locations.length} parent locations.`)
