import {levelMoves} from './eggMoveResources.js'
import {machineResources} from './itemResources.js'
import {tutorResources} from './tutorResources.js'
// FR/LG tutor locations; each move can be taught once per save, including Cape Brink moves.
const kanto=[[34,'Four Island'],[68,'Celadon Department Store · 3F'],[38,'Victory Road'],[138,'Viridian City'],[153,'Mt. Ember'],[25,'Route 4'],[5,'Route 4'],[118,'Cinnabar Island · Pokémon Lab'],[102,'Saffron City · Copycat’s house'],[157,'Rock Tunnel'],[69,'Pewter Museum'],[135,'Celadon City'],[164,'Fuchsia City'],[14,'Seven Island'],[86,'Silph Co. · 2F'],[307,'Two Island · Cape Brink','Blast Burn: Charizard, maximum friendship'],[308,'Two Island · Cape Brink','Hydro Cannon: Blastoise, maximum friendship'],[338,'Two Island · Cape Brink','Frenzy Plant: Venusaur, maximum friendship']]
export const tutorChartGames={
 Emerald:tutorResources.filter(t=>!t.repeatable).map(t=>({...t,location:t.location.replaceAll('Pokemon','Pokémon').replace(' House2',' · northeast house')})),
 'Battle Frontier':tutorResources.filter(t=>t.repeatable),
 'FireRed / LeafGreen':kanto.map(([moveId,location,requirement])=>({moveId,location,cost:0,repeatable:false,requirement})),
}

const xdStages=[[[102,69,86],'Available from the start'],[[196,164,138],'Reach Pyrite Town'],[[207,34,171],'Collect the Music Disc in Phenac City'],[[143],'Speak to Hordel at Outskirt Stand'],[[38],'Enter Cipher Key Lair'],[[120],'Reach Citadark Isle']]
tutorChartGames.XD=xdStages.flatMap(([moves,requirement])=>moves.map(moveId=>({moveId,location:'Agate Village · Teacher Lady',cost:0,repeatable:false,requirement})))
const mewMoves=new Set([...levelMoves[151].map(entry=>entry.move),...machineResources.map(entry=>entry.moveId),...tutorResources.filter(entry=>entry.species.includes(151)).map(entry=>entry.moveId),...tutorChartGames.XD.map(entry=>entry.moveId),185,252,95,101,272,192])
export const xdMewTutors=[...mewMoves].map(moveId=>({moveId,location:'Mt. Battle · Mew tutor',price:'5,000 Coupons',repeatable:true}))
