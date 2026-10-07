import { useState } from 'react'
import { frontierTrainers } from '../data/frontierTrainers'
import { frontierPokemon } from '../data/frontierPokemon'
import { frontierBrainPokemon } from '../data/frontierBrains'
import { pokemonMeta } from '../data/pokemonMeta'
import { frontierTrainerSprite } from '../utils/frontierSets'
import ResourceFilter from './ResourceFilter'

const setsById = new Map(frontierPokemon.map(set => [set.id, set]))
const metadata = new Map(Object.values(pokemonMeta).map(meta => [meta.name.toLowerCase(), meta]))
const brainClasses = { Anabel:'Salon Maiden', Tucker:'Dome Ace', Spenser:'Palace Maven', Greta:'Arena Tycoon', Noland:'Factory Head', Lucy:'Pike Queen', Brandon:'Pyramid King' }
const brains = Object.entries(brainClasses).map(([name, trainerClass]) => ({name, trainerClass, brain:true, sets:frontierBrainPokemon.filter(set => set.brainSet.startsWith(`${name} `) && name !== 'Noland')}))
const trainers = frontierTrainers.map(trainer => ({...trainer, sets:trainer.pokemonSetIds.map(id => setsById.get(id))}))
const titleCase = text => text.toLowerCase().replace(/(^|\s)\S/g, letter => letter.toUpperCase())

export default function FrontierTrainersBrowser({ onBack }) {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('trainer')
  const [trainerClass, setClass] = useState('all')
  const [iv, setIV] = useState('all')
  const [expanded, setExpanded] = useState(() => new Set())
  const source = mode === 'trainer' ? trainers : brains
  const classes = [...new Set(source.map(trainer => trainer.trainerClass))].sort()
  const ivOptions = [...new Set(source.flatMap(trainer => trainer.brain ? trainer.sets.map(set => set.fixedIVs) : [trainer.ivs]))].sort((a, b) => a - b)
  const query = search.trim().toLowerCase()
  const matches = source.filter(trainer => (trainerClass === 'all' || trainer.trainerClass === trainerClass) && (iv === 'all' || (trainer.brain ? trainer.sets.some(set => set.fixedIVs === Number(iv)) : trainer.ivs === Number(iv))) && [trainer.name, trainer.trainerClass].some(text => text.toLowerCase().split(/\s+/).some(word => word.startsWith(query))))
  const toggle = key => setExpanded(previous => { const next = new Set(previous); if (next.has(key)) next.delete(key); else next.add(key); return next })
  return <div className="resources-page resource-frontier-page resource-frontier-trainers-page">
    <div className="resource-frontier-sticky">
      <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><h2>Trainers</h2><span>{matches.length} {mode === 'trainer' ? 'trainers' : 'brains'}</span></div>
      <div className="resource-database-controls resource-abilities-controls"><label className="resources-search"><input type="search" aria-label="Search Frontier trainers" placeholder="Search trainer or class" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
      <div className="resource-frontier-filter-row resource-frontier-trainer-filters">
        <div className="resource-frontier-stat-heading"><div role="group" aria-label="Trainer source">{['trainer','brains'].map(value => <button key={value} aria-pressed={mode === value} onClick={() => { setMode(value); setClass('all'); setIV('all') }}>{value === 'trainer' ? 'Trainer' : 'Brains'}</button>)}</div></div>
        <ResourceFilter label="Class" value={trainerClass} onChange={setClass} options={classes.map(value => ({value, label:value}))} />
        {mode === 'trainer' ? <ResourceFilter label="IVs" value={iv} onChange={setIV} options={ivOptions.map(value => ({value:String(value), label:String(value)}))} /> : <span className="resource-frontier-fixed-ivs">Fixed IVs</span>}
      </div>
      <div className="resource-frontier-columns resource-frontier-trainer-columns"><strong>Trainer · Class</strong><strong>Pokémon</strong></div>
    </div>
    <div className="resource-moves-table resource-items-table resource-frontier-sets resource-frontier-trainer-list">
      {matches.map(trainer => {
        const key = `${mode}-${trainer.trainerClass}-${trainer.name}`
        const open = expanded.has(key)
        const sprite = trainer.brain ? `${frontierTrainerSprite(trainer.trainerClass)}_${trainer.name.toLowerCase()}` : frontierTrainerSprite(trainer.trainerClass)
        return <div className="resource-expandable-entry" key={key}>
          <button className="resource-learnset-move resource-item-main" aria-expanded={open} onClick={() => toggle(key)}>
            <img loading="lazy" src={`${import.meta.env.BASE_URL}trainers/${sprite}.png`} alt="" />
            <div><strong>{titleCase(trainer.name)}</strong><small>{trainer.trainerClass}</small><small className="resource-frontier-main-ivs">{trainer.brain ? (trainer.name === 'Noland' ? 'Rental IVs' : `IVs: Silver ${trainer.sets.find(set => set.brainSet.endsWith('Silver'))?.fixedIVs} · Gold ${trainer.sets.find(set => set.brainSet.endsWith('Gold'))?.fixedIVs}`) : `IVs: ${trainer.ivs}`}</small></div>
            <span className="resource-frontier-pool-count">{trainer.name === 'Noland' ? 'Random' : trainer.sets.length}</span>
          </button>
          {open && <section className="resource-frontier-detail resource-frontier-owned-sets">
            {trainer.name === 'Noland' ? <p className="resource-note">Noland uses rental Pokémon rather than fixed sets.</p> : <>
              <div className="resource-frontier-set-pool">{trainer.sets.map(set => {
                const meta = metadata.get(set.species.toLowerCase())
                return <div className="resource-frontier-owned-set" key={set.id ?? `${set.brainSet}-${set.species}`}>
                  {meta && <img loading="lazy" src={`${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`} alt="" />}
                  <div><strong>{set.species}{set.instance ? ` ${set.instance}` : ''}</strong>{trainer.brain && <small>{set.brainSet.split(' ').slice(1).join(' ')}</small>}</div>
                </div>
              })}</div>
            </>}
          </section>}
        </div>
      })}
    </div>
    {!matches.length && <p className="resource-empty">No results.</p>}
  </div>
}
