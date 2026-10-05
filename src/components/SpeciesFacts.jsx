import SpeciesPanel from './SpeciesPanel'
import ResourceTypeIcons from './ResourceTypeIcons'
import { speciesDetails } from '../data/speciesDetails.js'
import { eggCycles } from '../data/hatchingResources.js'
import { eggGroups } from '../data/breedingResources.js'
import { eggGroupNames } from '../utils/breeding.js'
import { evYields } from '../data/evResources.js'
import { itemNames } from '../data/emeraldData.js'
import { emeraldTypes, typeMultiplier } from '../utils/typeMatchups.js'
const stats={hp:'HP',attack:'Attack',defense:'Defense',spAttack:'Sp. Attack',spDefense:'Sp. Defense',speed:'Speed'}
export default function SpeciesFacts({ id, types, baseStats, growthRate, mode, embedded = false }) {
 const info=speciesDetails[id]
 const same=info.commonItem&&info.commonItem===info.rareItem
 const items=same?[[info.commonItem,100]]:[[info.commonItem,50],[info.rareItem,5]].filter(([item])=>item)
 if (mode === 'stats') return <SpeciesPanel embedded={embedded} anchor="stats" title="Stats & Matchups" open>{baseStats}<h3>Type Matchups</h3>{[[4,'4×'],[2,'2×'],[0.5,'½×'],[0.25,'¼×'],[0,'0×']].map(([multiplier,label])=>{const matches=emeraldTypes.filter(type=>typeMultiplier(type,types)===multiplier);return matches.length>0&&<div className="resource-type-group" data-multiplier={multiplier} key={multiplier}><h4>{label}</h4><ResourceTypeIcons types={matches} /></div>})}</SpeciesPanel>
 return <>
  <SpeciesPanel embedded={embedded} anchor="extra" title="More"><dl><dt>Height</dt><dd>{info.height} m</dd><dt>Weight</dt><dd>{info.weight} kg</dd><dt>Experience growth</dt><dd>{growthRate?.replace('GROWTH_', '').replaceAll('_', ' ').toLowerCase() ?? 'Not recorded'}</dd><dt>Catch rate</dt><dd>{info.catchRate} / 255</dd><dt>Wild held items</dt><dd>{items.length ? items.map(([item,chance]) => `${itemNames[item]} · ${chance}%`).join(' / ') : '-'}</dd><dt>Base friendship</dt><dd>{info.friendship}</dd><dt>Base experience yield</dt><dd>{info.expYield}</dd><dt>EV yield</dt><dd>{Object.entries(evYields[id]).filter(([,amount])=>amount).map(([stat,amount])=>`${amount} ${stats[stat]}`).join(' · ')||'None'}</dd><dt>Egg groups</dt><dd>{eggGroups[id].map(group=>eggGroupNames[group]).join(' / ')}</dd><dt>Egg cycles</dt><dd>{eggCycles[id]}</dd><dt>Approx. hatch steps</dt><dd>{(eggCycles[id]*256).toLocaleString()}</dd></dl></SpeciesPanel>

 </>
}
