import { useState } from 'react'
import { frontierBrainPokemon } from '../data/frontierBrains'
import { speciesInfo } from '../data/emeraldData'
import { emeraldStat } from '../utils/ivCalculator'
import { frontierPokemon } from '../data/frontierPokemon'
import { pokemonMeta } from '../data/pokemonMeta'
import ResourceTypeIcons from './ResourceTypeIcons'
import ResourceFilter from './ResourceFilter'
import { emeraldTypes } from '../utils/typeMatchups'
import { trainersBySet, frontierTrainerSprite } from '../utils/frontierSets'

const metadata = new Map(Object.entries(pokemonMeta).map(([speciesId, meta]) => [meta.name.toLowerCase(), {...meta, speciesId}]))
const statKeys = {hp:'hp', atk:'attack', def:'defense', spa:'spAttack', spd:'spDefense', spe:'speed'}
const brainSets = frontierBrainPokemon.filter(set => !set.brainSet.startsWith('Noland')).map((set, index) => ({...set, id:`${set.species} · ${set.brainSet}`, entry:`brain-${index}`}))
function setStats(set, level, iv) {
  const base = speciesInfo[metadata.get(set.species.toLowerCase()).speciesId].baseStats
  return Object.fromEntries(Object.entries(statKeys).map(([key, stat]) => [key, emeraldStat(base[stat], stat, iv, set.evs[key], Number(level), set.nature, set.species === 'Shedinja')]))
}
const shortStats = { hp:'HP', atk:'Atk', def:'Def', spa:'SpA', spd:'SpD', spe:'Spe' }
const stats = [['hp', 'HP'], ['atk', 'Attack'], ['def', 'Defense'], ['spa', 'Sp. Attack'], ['spd', 'Sp. Defense'], ['spe', 'Speed']]

export default function FrontierSetsBrowser({ onBack }) {
  const [search, setSearch] = useState('')
  const [expandedSets, setExpandedSets] = useState(() => new Set())
  const [type, setType] = useState('all')
  const toggleSet = entry => setExpandedSets(previous => {
    const next = new Set(previous)
    if (next.has(entry)) next.delete(entry)
    else next.add(entry)
    return next
  })
  const [level, setLevel] = useState('50')
  const [mode, setMode] = useState('trainer')
  const [iv, setIV] = useState('31')
  const [sort, setSort] = useState('all')
  const query = search.trim().toLowerCase()
  const matches = (mode === 'trainer' ? frontierPokemon : brainSets).filter(set => set.species.toLowerCase().startsWith(query) && (type === 'all' || metadata.get(set.species.toLowerCase())?.types.includes(type))).sort((a, b) => {
    if (sort === 'all') return 0
    return setStats(b, level, b.fixedIVs ?? Number(iv))[sort] - setStats(a, level, a.fixedIVs ?? Number(iv))[sort]
  })
  return <div className="resources-page resource-frontier-page">
    <div className="resource-frontier-sticky">
    <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><h2>Pokémon Sets</h2><span>{matches.length} sets</span></div>
    <div className="resource-database-controls resource-abilities-controls"><label className="resources-search"><input aria-label="Search Frontier sets" type="search" placeholder="Search Pokémon" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
    <div className="resource-frontier-filter-row">
      <div className="resource-frontier-stat-heading"><div role="group" aria-label="Stat level">{['50', '100'].map(value => <button key={value} aria-pressed={level === value} onClick={() => setLevel(value)}>Lv. {value}</button>)}</div></div>
      <div className="resource-frontier-stat-heading"><div role="group" aria-label="Set source">{['trainer','brains'].map(value => <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'trainer' ? 'Trainer' : 'Brains'}</button>)}</div></div>
      <ResourceFilter label="Type" value={type} onChange={setType} options={emeraldTypes.map(value => ({value, label:value.charAt(0) + value.slice(1).toLowerCase()}))}/>
      <ResourceFilter label="Stats" value={sort} onChange={setSort} options={stats.map(([value]) => ({value, label:shortStats[value]}))}/>
      {mode === 'trainer' ? <label className="resource-frontier-iv">IVs <select aria-label="IVs" value={iv} onChange={event => setIV(event.target.value)}>{[3,6,9,12,15,18,21,31].map(value => <option key={value} value={value}>{value}</option>)}</select></label> : <span className="resource-frontier-fixed-ivs">Fixed IVs</span>}
    </div>
    <div className="resource-frontier-columns" aria-hidden="true"><span /><div className="resource-frontier-row-content"><strong>Pokémon · Item</strong><div className="resource-frontier-stat-labels">{stats.map(([key, label]) => <span key={key} title={label}>{shortStats[key]}</span>)}</div></div></div>
    </div>
    <div className="resource-moves-table resource-items-table resource-frontier-sets">
      {matches.map(set => {
        const meta = metadata.get(set.species.toLowerCase())
        const expanded = expandedSets.has(set.entry)
        const values = setStats(set, level, set.fixedIVs ?? Number(iv))
        return <div className={`resource-expandable-entry${expanded ? ' resource-frontier-expanded' : ''}`} key={set.entry}>
          <button className="resource-learnset-move resource-item-main" aria-expanded={expanded} aria-controls={`frontier-set-${set.entry}`} onClick={() => toggleSet(set.entry)}>
            {meta && <img className="resource-frontier-sprite" loading="lazy" src={`${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`} alt="" />}
            <div className="resource-frontier-row-content">
              <div className="resource-frontier-identity">
                <div><strong>{set.id}</strong><div className="resource-frontier-type-item">{meta && <ResourceTypeIcons types={meta.types} />}<small>{set.item}</small></div></div>
              </div>
              <div className="resource-frontier-battle-info"><dl className="resource-frontier-stats">{stats.map(([key, label]) => <div key={key}><dt className="resource-frontier-sr-label">{label}</dt><dd className={sort === key ? 'resource-frontier-selected-stat' : undefined}>{values[key]}</dd></div>)}</dl></div>
              <p className="resource-frontier-moves">{set.moves.join(' · ')}</p>
            </div>
          </button>
          {expanded && <section className="resource-inline-learners resource-frontier-detail" id={`frontier-set-${set.entry}`}>
            <dl className="resource-frontier-details-grid"><div><dt>Nature</dt><dd>{set.nature}</dd></div><div><dt>Ability</dt><dd>{set.possibleAbility}</dd></div><div className="resource-frontier-evs"><dt>EVs</dt><dd>{stats.filter(([key]) => set.evs[key] > 0).map(([key, label]) => `${label} ${set.evs[key]}`).join(' · ')}</dd></div></dl>
            {mode === 'trainer' && <><h3 className="resource-frontier-trainers-heading">Trainers using this set <span className="resource-frontier-trainer-count">· {trainersBySet.get(set.id)?.length ?? 0}</span></h3>
            <div className="resource-frontier-trainers">{(trainersBySet.get(set.id) ?? []).map(trainer => <div className="resource-frontier-trainer" key={`${trainer.trainerClass}-${trainer.name}`}>
              <img loading="lazy" src={`${import.meta.env.BASE_URL}trainers/${frontierTrainerSprite(trainer.trainerClass)}.png`} alt="" />
              <div><strong>{trainer.name}</strong><small>{trainer.trainerClass}</small></div>
            </div>)}</div>
            {!trainersBySet.get(set.id)?.length && <p className="resource-note">No trainers listed for this set.</p>}</>}
            {mode === 'brains' && <div className="resource-frontier-trainer resource-frontier-brain"><img src={`${import.meta.env.BASE_URL}trainers/${{Anabel:'salon_maiden_anabel', Tucker:'dome_ace_tucker', Spenser:'palace_maven_spenser', Greta:'arena_tycoon_greta', Lucy:'pike_queen_lucy', Brandon:'pyramid_king_brandon'}[set.brainSet.split(' ')[0]]}.png`} alt=""/><div><strong>{set.brainSet}</strong><small>{set.fixedIVs} IVs</small></div></div>}
          </section>}
        </div>
      })}
    </div>
    {!matches.length && <p className="resource-empty">No results.</p>}
  </div>
}
