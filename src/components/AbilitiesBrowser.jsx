import { useState } from 'react'
import { abilityNames, speciesInfo } from '../data/emeraldData'
import { abilityResources } from '../data/abilityResources'
import { abilityFieldEffects } from '../data/abilityFieldEffects'
import { abilityDescriptions } from '../data/abilityDescriptions'
import GameNames from './GameNames'
import { pokemonMeta } from '../data/pokemonMeta'

const species = Object.entries(pokemonMeta).sort((a,b)=>a[1].dex-b[1].dex)
const abilities = Object.entries(abilityResources).map(([id,data])=>({id,name:abilityNames[id],...data})).sort((a,b)=>a.name.localeCompare(b.name))

export default function AbilitiesBrowser({ onBack, onPokemon, initialAbility, onDetailBack }) {
  const [search,setSearch]=useState('')
  const [selected,setSelected]=useState(()=>abilities.find(a=>a.id===String(initialAbility))??null)
  const matches=abilities.filter(a=>a.name.toLowerCase().startsWith(search.trim().toLowerCase()))
  const holders=selected?species.filter(([id])=>speciesInfo[id]?.abilities?.includes(Number(selected.id))):[]
  return <div className="resources-page">
    {selected && <button className="resources-back" onClick={onDetailBack ?? (()=>setSelected(null))}>← Back</button>}
    {selected?<article className="resource-species">
      <section><h3>Pokémon with {selected.name}</h3><div className="resource-move-learner-grid">{holders.map(entry=>{const [id,meta]=entry;return <button key={id} onClick={()=>onPokemon(entry,selected.id)}><img loading="lazy" src={`${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`} alt=""/><span>{meta.name}</span></button>})}</div>{!holders.length&&<p className="resource-note">No Pokémon has this ability in Generation III.</p>}</section>
    </article>:<>
      <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><h2>Abilities</h2><span>{matches.length} abilities</span></div>
      <div className="resource-database-controls resource-abilities-controls">
        <label className="resources-search"><input aria-label="Search abilities" type="search" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      </div>
      <div className="resource-move-list">{matches.map(ability=><button key={ability.id} onClick={()=>setSelected(ability)}><div><strong>{ability.name}</strong><small>{abilityDescriptions[ability.id]}{abilityFieldEffects[ability.id] && <> {abilityFieldEffects[ability.id].games && <><GameNames>{abilityFieldEffects[ability.id].games}</GameNames>: </>}{abilityFieldEffects[ability.id].description}</>}</small></div><b aria-hidden="true">›</b></button>)}</div>
      {!matches.length&&<p className="resource-empty">No results.</p>}
    </>}
  </div>
}
