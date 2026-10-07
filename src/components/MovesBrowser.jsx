import ResourceFilter from './ResourceFilter'
import { moves, matchingMoves } from '../utils/resourceSearch'
import MoveLearners from './MoveLearners'
import { machineResources } from '../data/itemResources'
const machineCodes = Object.fromEntries(machineResources.map(machine => [machine.moveId, machine.code]))
import { useState } from 'react'
import { emeraldTypes } from '../utils/typeMatchups'
import { moveResources } from '../data/moveResources'
const types = [...emeraldTypes, ...new Set(Object.values(moveResources).map(move => move.type).filter(type => !emeraldTypes.includes(type)))]

export default function MovesBrowser({ onBack, initialMove, onPokemon, embedded = false, browserState, onBrowserState }) {
  const [localSearch,setLocalSearch]=useState('')
  const search=browserState ? browserState.search : localSearch
  const setSearch=value => onBrowserState ? onBrowserState(previous => ({...previous, search:value})) : setLocalSearch(value)
  const [localType,setLocalType]=useState('')
  const type=browserState ? browserState.type : localType
  const setType=value => onBrowserState ? onBrowserState(previous => ({...previous, type:value})) : setLocalType(value)
  const [localKind,setLocalKind]=useState('')
  const kind=browserState ? browserState.kind : localKind
  const setKind=value => onBrowserState ? onBrowserState(previous => ({...previous, kind:value})) : setLocalKind(value)
  const [localSelected,setLocalSelected]=useState(()=>moves.find(move=>move.id===String(initialMove))??null)
  const selected=browserState ? browserState.selected : localSelected
  const setSelected=value => onBrowserState ? onBrowserState(previous => ({...previous, selected:value})) : setLocalSelected(value)
  const matches=matchingMoves({search,type,kind})
  return <div className={`resources-page${!embedded ? ' resource-scroll-database-page' : ''}`}>
      {!embedded && <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><h2>Moves</h2><span>{matches.length} moves</span></div>}
      <div className="resource-database-controls resource-moves-controls">
        <label className="resources-search"><input aria-label="Search moves" type="search" placeholder="Search" value={search} onChange={event=>setSearch(event.target.value)} /></label>
        <ResourceFilter label="Type" value={type} onChange={setType} options={types.map(t => ({value:t,label:t}))}/>
        <ResourceFilter label="Category" value={kind} onChange={setKind} options={['Physical','Special','Status'].map(k => ({value:k,label:k}))}/>
      </div>
      <div tabIndex={0} aria-label="Moves list" className="resource-moves-table">
        <div className="resource-learnset-columns" aria-hidden="true"><span /><span>Move</span><span>Pow</span><span>Acc</span><span>PP</span><span>Eff</span></div>
        {matches.map(move => <div className="resource-expandable-entry" key={move.id}><button className="resource-learnset-move" aria-expanded={selected?.id === move.id} aria-controls={`move-learners-${move.id}`} onClick={() => setSelected(selected?.id === move.id ? null : move)}>
          <div className="resource-learnset-heading">
            <span className="resource-learnset-icon">{move.type !== 'MYSTERY' && <img src={`${import.meta.env.BASE_URL}type-icons/${move.type.toLowerCase()}.png`} alt={`${move.type} type`} />}</span>
            <strong>{move.name}{machineCodes[move.id]&&<span className="resource-machine-label">{machineCodes[move.id]}</span>}</strong>
            <span title="Power">{move.power === 0 ? '-' : move.power === 1 ? 'Var' : move.power}</span>
            <span title="Accuracy">{move.accuracy === 0 ? '-' : `${move.accuracy}%`}</span>
            <span title="PP">{move.pp}</span>
            <span title="Secondary effect chance">{move.effectChance > 0 ? `${move.effectChance}%` : '-'}</span>
          </div>
          <p className="resource-learnset-description">{move.description}</p>
        </button>{selected?.id === move.id && <div className="resource-inline-learners" id={`move-learners-${move.id}`}><MoveLearners move={move.id} onPokemon={entry => onPokemon(entry, move.id)} /></div>}</div>)}
      </div>
      {!matches.length&&<p className="resource-empty">No results.</p>}
  </div>
}
