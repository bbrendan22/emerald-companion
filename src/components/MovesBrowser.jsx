import MoveLearners from './MoveLearners'
import { machineResources } from '../data/itemResources'
const machineCodes = Object.fromEntries(machineResources.map(machine => [machine.moveId, machine.code]))
import { useState } from 'react'
import { emeraldTypes } from '../utils/typeMatchups'
import { moveNames } from '../data/emeraldData'
import { moveResources } from '../data/moveResources'
const physicalTypes = new Set(['NORMAL','FIGHTING','FLYING','POISON','GROUND','ROCK','BUG','GHOST','STEEL'])
const category = move => move.power === 0 ? 'Status' : physicalTypes.has(move.type) ? 'Physical' : 'Special'
const types = [...emeraldTypes, ...new Set(Object.values(moveResources).map(move => move.type).filter(type => !emeraldTypes.includes(type)))]
const moves = Object.entries(moveResources).map(([id, move]) => ({ id, name: moveNames[id], ...move })).sort((a,b)=>a.name.localeCompare(b.name))

export default function MovesBrowser({ onBack, initialMove, onDetailBack, onPokemon }) {
  const [search,setSearch]=useState('')
  const [type,setType]=useState('')
  const [kind,setKind]=useState('')
  const [selected,setSelected]=useState(()=>moves.find(move=>move.id===String(initialMove))??null)
  const matches=moves.filter(move => move.name.toLowerCase().startsWith(search.trim().toLowerCase()) && (!type||type==='all'||move.type===type) && (!kind||kind==='all'||category(move)===kind))
  return <div className="resources-page">
    {selected && <button className="resources-back" onClick={selected?(onDetailBack??(()=>setSelected(null))):onBack}>← Back</button>}
    {selected ? <article className="resource-species resource-move-detail">
      <MoveLearners key={selected.id} move={selected.id} onPokemon={entry => onPokemon(entry, selected.id)} />
    </article> : <>
      <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><h2>Moves</h2><span>{matches.length} moves</span></div>
      <div className="resource-database-controls resource-moves-controls">
        <label className="resources-search"><input aria-label="Search moves" type="search" placeholder="Search" value={search} onChange={event=>setSearch(event.target.value)} /></label>
        <label className="resource-type-filter"><select aria-label="Type" value={type} onChange={event=>setType(event.target.value)}><option value="" disabled hidden>Type</option><option value="all">All</option>{types.map(t=><option key={t}>{t}</option>)}</select></label>
        <label className="resource-type-filter"><select aria-label="Category" value={kind} onChange={event=>setKind(event.target.value)}><option value="" disabled hidden>Category</option><option value="all">All</option>{['Physical','Special','Status'].map(k=><option key={k}>{k}</option>)}</select></label>
      </div>
      <div className="resource-moves-table">
        <div className="resource-learnset-columns" aria-hidden="true"><span /><span>Move</span><span>Pow</span><span>Acc</span><span>PP</span><span>Eff</span></div>
        {matches.map(move => <button className="resource-learnset-move" key={move.id} onClick={() => setSelected(move)}>
          <div className="resource-learnset-heading">
            <span className="resource-learnset-icon">{move.type !== 'MYSTERY' && <img src={`${import.meta.env.BASE_URL}type-icons/${move.type.toLowerCase()}.png`} alt={`${move.type} type`} />}</span>
            <strong>{move.name}{machineCodes[move.id]&&<span className="resource-machine-label">{machineCodes[move.id]}</span>}</strong>
            <span title="Power">{move.power === 0 ? '-' : move.power === 1 ? 'Var' : move.power}</span>
            <span title="Accuracy">{move.accuracy === 0 ? '-' : `${move.accuracy}%`}</span>
            <span title="PP">{move.pp}</span>
            <span title="Secondary effect chance">{move.effectChance > 0 ? `${move.effectChance}%` : '-'}</span>
          </div>
          <p className="resource-learnset-description">{move.description}</p>
        </button>)}
      </div>
      {!matches.length&&<p className="resource-empty">No results.</p>}
    </>}
  </div>
}
