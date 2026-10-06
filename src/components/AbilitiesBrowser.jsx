import { useState } from 'react'
import { speciesInfo } from '../data/emeraldData'
import { abilities, matchingAbilities } from '../utils/resourceSearch'
import { abilityFieldEffects } from '../data/abilityFieldEffects'
import { abilityDescriptions } from '../data/abilityDescriptions'
import GameNames from './GameNames'
import { pokemonMeta } from '../data/pokemonMeta'

const species = Object.entries(pokemonMeta).sort((a,b)=>a[1].dex-b[1].dex)

export default function AbilitiesBrowser({ onBack, onPokemon, initialAbility, embedded = false, browserState, onBrowserState }) {
  const [localSearch,setLocalSearch]=useState('')
  const search=browserState ? browserState.search : localSearch
  const setSearch=value => onBrowserState ? onBrowserState(previous => ({...previous, search:value})) : setLocalSearch(value)
  const [localSelected,setLocalSelected]=useState(()=>abilities.find(a=>a.id===String(initialAbility))??null)
  const selected=browserState ? browserState.selected : localSelected
  const setSelected=value => onBrowserState ? onBrowserState(previous => ({...previous, selected:value})) : setLocalSelected(value)
  const matches=matchingAbilities({search})
  const holders=selected?species.filter(([id])=>speciesInfo[id]?.abilities?.includes(Number(selected.id))):[]
  return <div className="resources-page">
      {!embedded && <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><h2>Abilities</h2><span>{matches.length} abilities</span></div>}
      <div className="resource-database-controls resource-abilities-controls">
        <label className="resources-search"><input aria-label="Search abilities" type="search" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      </div>
      <div className="resource-moves-table resource-abilities-table">
        <div className="resource-learnset-columns" aria-hidden="true"><span>Ability</span></div>
        {matches.map(ability=><div className="resource-expandable-entry" key={ability.id}><button className="resource-learnset-move" aria-expanded={selected?.id === ability.id} aria-controls={`ability-holders-${ability.id}`} onClick={()=>setSelected(selected?.id === ability.id ? null : ability)}>
          <strong>{ability.name}</strong>
          <p className="resource-learnset-description">{abilityDescriptions[ability.id]}{abilityFieldEffects[ability.id] && <> {abilityFieldEffects[ability.id].games && <><GameNames>{abilityFieldEffects[ability.id].games}</GameNames>: </>}{abilityFieldEffects[ability.id].description}</>}</p>
        </button>{selected?.id === ability.id && <section className="resource-inline-learners" id={`ability-holders-${ability.id}`}><h3>Pokémon with {ability.name}</h3><div className="resource-move-learner-grid">{holders.map(entry=>{const [id,meta]=entry;return <button key={id} onClick={()=>onPokemon(entry,ability.id)}><img loading="lazy" src={`${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`} alt=""/><span>{meta.name}</span></button>})}</div>{!holders.length && <p className="resource-note">No Pokémon has this ability in Generation III.</p>}</section>}</div>)}
      </div>
      {!matches.length&&<p className="resource-empty">No results.</p>}
  </div>
}
