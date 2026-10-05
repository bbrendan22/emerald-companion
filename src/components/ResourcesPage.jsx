import { deoxysForms } from '../data/deoxysForms'
import { pokedexEntries } from '../data/pokedexEntries'
import GameNames from './GameNames'
import { useRef, useState } from 'react'
import { emeraldTypes } from '../utils/typeMatchups'
import { pokemonMeta } from '../data/pokemonMeta'
import { speciesInfo, abilityNames } from '../data/emeraldData'
import './ResourcesPage.css'
import LocationsBrowser from './LocationsBrowser'
import LocationDatabase from './LocationDatabase'
import TrainersBrowser from './TrainersBrowser'
import ItemsBrowser from './ItemsBrowser'
import AbilitiesBrowser from './AbilitiesBrowser'
import GuidesBrowser from './GuidesBrowser'
import ToolsBrowser from './ToolsBrowser'
import MovesBrowser from './MovesBrowser'
import EvolutionSection from './EvolutionSection'
import LearnsetSection from './LearnsetSection'
import SpeciesEncounters from './SpeciesEncounters'
import SpeciesFacts from './SpeciesFacts'
import ResourceTypeIcons from './ResourceTypeIcons'
import { abilityDescriptions } from '../data/abilityDescriptions'
import { abilityFieldEffects } from '../data/abilityFieldEffects'

const pokemon = Object.entries(pokemonMeta).filter(([, meta]) => meta.dex >= 1 && meta.dex <= 386 && meta.generation <= 3).sort((a, b) => a[1].dex - b[1].dex)
const unownForms = [...Array.from({ length:26 }, (_, index) => ({ key:String.fromCharCode(97 + index), name:String.fromCharCode(65 + index) })), { key:'exclamation', name:'!' }, { key:'question', name:'?' }]
const castformForms = {
  normal: { name:'Normal', artwork:'351', types:['NORMAL'] },
  sunny: { name:'Sunny', artwork:'castform-sunny', types:['FIRE'] },
  rainy: { name:'Rainy', artwork:'castform-rainy', types:['WATER'] },
  snowy: { name:'Snowy', artwork:'castform-snowy', types:['ICE'] },
}
const types = emeraldTypes
const statNames = [['HP', 'hp'], ['Attack', 'attack'], ['Defense', 'defense'], ['Sp. Attack', 'spAttack'], ['Sp. Defense', 'spDefense'], ['Speed', 'speed']]
const statMaximums = Object.fromEntries(statNames.map(([, key]) => [key, Math.max(...pokemon.map(([id]) => speciesInfo[id]?.baseStats?.[key] ?? 0), ...Object.values(deoxysForms).map(form => form.baseStats[key]))]))
const categories = [
  { title: 'Database', icon: '▦', description: 'Pokémon, moves, abilities, items, and TMs/HMs.', available: true },
  { title: 'Explore Hoenn', icon: '◇', description: 'Locations, wild encounters, trainer teams, and items across Hoenn.', available: true },
  { title: 'Guides', icon: '▤', description: 'Breeding, training, tutors, and Battle Frontier.', available: true },
  { title: 'Tools & Charts', icon: '⌘', description: 'Calculators, natures, types, and Pickup tables.', available: true },
]

function genderRatio(value) {
  if (value === 255) return 'Genderless'
  if (value === 254) return 'Female only'
  if (value === 0) return 'Male only'
  const female = { 31: 12.5, 63: 25, 127: 50, 191: 75 }[value]
  return female == null ? 'Not recorded' : `${100 - female}% male · ${female}% female`
}

export default function ResourcesPage() {
  const [view, updateView] = useState('home')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [generation, setGeneration] = useState('')
  const [selected, updateSelected] = useState(null)
  const [pokemonTab, setPokemonTab] = useState('overview')
  const [entryGame, setEntryGame] = useState('Emerald')
  const [deoxysForm, setDeoxysForm] = useState('speed')
  const [unownForm, setUnownForm] = useState('a')
  const [castformForm, setCastformForm] = useState('normal')
  const [showShiny, setShowShiny] = useState(false)
  const [abilityOrigin, setAbilityOrigin] = useState(null)
  const [itemOrigin, setItemOrigin] = useState(null)
  const [linkedMove, setLinkedMove] = useState(null)
  const [eggOrigin, setEggOrigin] = useState(null)
  const [breedingOrigin, setBreedingOrigin] = useState(null)
  const [tutorOrigin, setTutorOrigin] = useState(null)
  const [guideOrigin, setGuideOrigin] = useState(null)
  const [toolOrigin, setToolOrigin] = useState(null)
  const [locationOrigin, setLocationOrigin] = useState(null)
  const [learnsetOrigin, setLearnsetOrigin] = useState(null)
  const [encounterOrigin, setEncounterOrigin] = useState(null)
  const history = useRef([])
  const [previousPage, setPreviousPage] = useState(null)
  const snapshot = { view, selected, query, type, generation, abilityOrigin, itemOrigin, linkedMove, eggOrigin, breedingOrigin, tutorOrigin, guideOrigin, toolOrigin, locationOrigin, learnsetOrigin, encounterOrigin }
  const remember = () => {
    if (history.current.at(-1) !== snapshot) { history.current.push(snapshot); setPreviousPage(snapshot) }
  }
  const setView = next => { if (next !== view) remember(); updateView(next) }
  const setSelected = next => {
    // Sibling Pokémon share the parent that opened this detail branch.
    if (next && !(view === 'pokemon' && selected)) remember()
    updateSelected(next)
    setDeoxysForm('speed')
    setUnownForm('a')
    setCastformForm('normal')
    setShowShiny(false)
    setPokemonTab('overview')
    if (!(next && view === 'pokemon' && selected)) setEntryGame('Emerald')
  }
  const goBack = () => {
    setDeoxysForm('speed')
    setUnownForm('a')
    setCastformForm('normal')
    setShowShiny(false)
    setEntryGame('Emerald')
    const previous = history.current.pop()
    setPreviousPage(history.current.at(-1) ?? null)
    if (!previous) { updateView('home'); updateSelected(null); return }
    // Keep the detail that launched an external link when restoring its browser.
    if (previous.view === 'abilities') previous.abilityOrigin = abilityOrigin
    if (previous.view === 'locations') previous.locationOrigin = locationOrigin
    if (previous.view === 'items' || previous.view === 'machines') previous.itemOrigin = itemOrigin
    if (previous.view === 'guides') Object.assign(previous, { eggOrigin, breedingOrigin, tutorOrigin, guideOrigin })
    if (previous.view === 'tools') previous.toolOrigin = toolOrigin
    updateView(previous.view); updateSelected(previous.selected); setPokemonTab('overview')
    setQuery(previous.query); setType(previous.type); setGeneration(previous.generation)
    setAbilityOrigin(previous.abilityOrigin); setItemOrigin(previous.itemOrigin); setLinkedMove(previous.linkedMove)
    setEggOrigin(previous.eggOrigin); setBreedingOrigin(previous.breedingOrigin); setTutorOrigin(previous.tutorOrigin)
    setGuideOrigin(previous.guideOrigin); setToolOrigin(previous.toolOrigin); setLocationOrigin(previous.locationOrigin)
    setLearnsetOrigin(previous.learnsetOrigin); setEncounterOrigin(previous.encounterOrigin)
  }
  const matches = pokemon.filter(([, meta]) => {
    const search = query.trim().toLowerCase()
    return (!search || meta.name.toLowerCase().startsWith(search)) && (!type || type === 'all' || meta.types.includes(type)) && (!generation || generation === 'all' || meta.generation === Number(generation))
  })
  const showingList = view === 'pokemon' || Boolean(query.trim())
  const weatherForm = selected?.[1].dex === 351 ? castformForms[castformForm] : null
  const displayTypes = weatherForm?.types ?? selected?.[1].types
  const form = selected?.[1].dex === 386 ? deoxysForms[deoxysForm] : null
  const profile = selected ? { ...speciesInfo[selected[0]], ...(form ? { baseStats:form.baseStats } : {}) } : null
  if (view === 'guides') return <GuidesBrowser initialEgg={eggOrigin} onEggMove={(id,origin)=>{setEggOrigin(origin);setBreedingOrigin(null);setTutorOrigin(null);setGuideOrigin(null);setItemOrigin(null);setLinkedMove(id);setView('moves')}} onEggPokemon={(entry,origin)=>{setEggOrigin(origin);setBreedingOrigin(null);setTutorOrigin(null);setGuideOrigin(null);setItemOrigin(null);setLocationOrigin(null);setAbilityOrigin(null);setSelected(entry);setView('pokemon')}} initialParent={breedingOrigin} onBreedingPokemon={(entry,parent)=>{setEggOrigin(null);setBreedingOrigin(parent);setTutorOrigin(null);setGuideOrigin(null);setItemOrigin(null);setLocationOrigin(null);setAbilityOrigin(null);setSelected(entry);setView('pokemon')}} initialTutor={tutorOrigin} onTutorMove={id=>{setEggOrigin(null);setBreedingOrigin(null);setTutorOrigin(id);setGuideOrigin(null);setItemOrigin(null);setLinkedMove(id);setView('moves')}} onTutorPokemon={(entry,id)=>{setEggOrigin(null);setBreedingOrigin(null);setTutorOrigin(id);setGuideOrigin(null);setItemOrigin(null);setLocationOrigin(null);setAbilityOrigin(null);setSelected(entry);setView('pokemon')}} initialStat={guideOrigin} onBack={goBack} onPokemon={(entry,stat)=>{setEggOrigin(null);setBreedingOrigin(null);setTutorOrigin(null);setGuideOrigin(stat);setItemOrigin(null);setLocationOrigin(null);setAbilityOrigin(null);setSelected(entry);setView('pokemon')}} onLocation={(location,stat)=>{setGuideOrigin(stat);setLocationOrigin(location);setView('locations')}} />
  if (view === 'tools') return <ToolsBrowser initialTool={toolOrigin?.tool} initialLevel={toolOrigin?.level} onBack={goBack} onItem={(entry,level)=>{setLocationOrigin(null);setToolOrigin({tool:'pickup',level});setItemOrigin({view:entry.machine?'machines':'items',entry});setView(entry.machine?'machines':'items')}} />
  if (view === 'locations') return <LocationsBrowser onDetailBack={encounterOrigin || previousPage?.view === 'guides' ? goBack : null} initialLocation={locationOrigin} onItem={(entry,location)=>{setLocationOrigin(location);setItemOrigin({view:entry.machine?'machines':'items',entry});setView(entry.machine?'machines':'items')}} onBack={goBack} onPokemon={(entry,location) => { setAbilityOrigin(null); setItemOrigin(null); setLocationOrigin(location); setSelected(entry); setView('pokemon') }} />
  if (view === 'abilities') return <AbilitiesBrowser onDetailBack={previousPage?.selected ? goBack : null} initialAbility={abilityOrigin} onBack={goBack} onPokemon={(entry, abilityId) => { setSelected(entry); setAbilityOrigin(abilityId); setView('pokemon') }} />
  if (view === 'items' || view === 'machines') return <ItemsBrowser machinesOnly={view === 'machines'} onToolBack={toolOrigin ? goBack : null} onLocationBack={locationOrigin ? goBack : null} initialEntry={itemOrigin?.entry} onBack={goBack} onMove={(id,entry) => { setItemOrigin({view,entry}); setLinkedMove(id); setView('moves') }} onPokemon={(entry,item) => { setAbilityOrigin(null); setItemOrigin({view,entry:item}); setSelected(entry); setView('pokemon') }} />
  if (view === 'moves') return <MovesBrowser onPokemon={(entry, move) => { setSelected(entry); const origin = history.current.at(-1); if (origin?.view === 'moves') origin.linkedMove = move; setLinkedMove(move); setView('pokemon') }} initialMove={linkedMove} onDetailBack={linkedMove ? goBack : null} onBack={goBack} />
  if (view === 'trainers') return <TrainersBrowser onBack={goBack} onPokemon={entry=>{setAbilityOrigin(null);setItemOrigin(null);setLocationOrigin(null);setSelected(entry);setView('pokemon')}} />
  if (view === 'location-database') return <LocationDatabase onBack={goBack}/>
  if (view === 'database') return <div className="resources-page">
    <button className="resources-back" onClick={goBack}>← Back</button>
    <div className="resource-list-heading"><h2>Database</h2></div>
    <div className="resources-categories">
      <button onClick={() => setView('pokemon')}><span className="resource-category-icon" aria-hidden="true">▦</span><h2>Pokémon</h2><p>Types, abilities, base stats, and species information.</p><b>Browse 386 species →</b></button>
      <button onClick={() => setView('moves')}><span className="resource-category-icon" aria-hidden="true">✦</span><h2>Moves</h2><p>Power, accuracy, PP, effects, and Gen III categories.</p><b>Browse 354 moves →</b></button>
      <button onClick={() => { setAbilityOrigin(null); setView('abilities') }}><span className="resource-category-icon" aria-hidden="true">◇</span><h2>Abilities</h2><p>Emerald effect summaries and Pokémon with each ability.</p><b>Browse abilities →</b></button>
      <button onClick={() => setView('trainers')}><h2>Trainers</h2><p>Emerald trainer teams, levels, locations, and prize money.</p><b>Browse trainers →</b></button>
      <button onClick={() => setView('location-database')}><h2>Locations</h2><p>Emerald routes, towns, and other locations.</p><b>Browse locations →</b></button>
      <button onClick={() => { setItemOrigin(null); setToolOrigin(null); setView('items') }}><h2>Items</h2><p>Medicine, battle and training items, berries, TMs/HMs, and more.</p><b>Browse items →</b></button>
    </div>
  </div>
  return <div className="resources-page">
    {selected ? <>
      <button className="resources-back" onClick={goBack}>← Back</button>
      <article className="resource-species resource-species-profile" key={selected[0]}>
        <div className="resource-species-summary"><img className={selected[1].dex === 201 ? "resource-unown-sprite" : undefined} src={`${import.meta.env.BASE_URL}${selected[1].dex === 201 ? `sprites/unown/${showShiny ? 'shiny/' : ''}${unownForm}.png` : `sprites/artwork/${showShiny && !(weatherForm && castformForm !== 'normal') ? 'shiny' : 'normal'}/${weatherForm?.artwork ?? form?.artwork ?? selected[1].dex}.png`}`} alt={`${showShiny ? 'Shiny ' : ''}${selected[1].name}`} /><button className="resource-shiny-toggle" aria-label="Show shiny artwork" aria-pressed={showShiny} title={showShiny ? 'Show normal artwork' : 'Show shiny artwork'} onClick={() => setShowShiny(value => !value)}><span aria-hidden="true">{showShiny ? '★' : '☆'}</span></button><div><span>#{String(selected[1].dex).padStart(3, '0')} · GEN {selected[1].generation}</span><div className="resource-species-name"><h2>{selected[1].name}</h2>{form && <select aria-label="Deoxys form" value={deoxysForm} onChange={event => setDeoxysForm(event.target.value)}>{Object.entries(deoxysForms).map(([key,entry]) => <option key={key} value={key}>{entry.name}</option>)}</select>}{selected[1].dex === 201 && <select aria-label="Unown form" value={unownForm} onChange={event => setUnownForm(event.target.value)}>{unownForms.map(entry => <option key={entry.key} value={entry.key}>{entry.name}</option>)}</select>}{weatherForm && <select aria-label="Castform form" value={castformForm} onChange={event => setCastformForm(event.target.value)}>{Object.entries(castformForms).map(([key,entry]) => <option key={key} value={key}>{entry.name}</option>)}</select>}</div><ResourceTypeIcons types={displayTypes} /><p>{profile?.genderRatio === 255 ? '\u00a0' : genderRatio(profile?.genderRatio)}</p></div></div>
        <div className="resource-profile-tabs" role="tablist" aria-label="Pokémon information">{[['overview','Overview'],['stats','Stats & Matchups'],['locations','Locations'],['moves','Learnset'],['extra','More']].map(([tab,label]) => <button key={tab} id={`pokemon-tab-${tab}`} role="tab" aria-selected={pokemonTab === tab} aria-controls={`pokemon-content-${tab}`} onClick={() => { if (tab !== pokemonTab) setEntryGame('Emerald'); setPokemonTab(tab) }}>{label}</button>)}</div>
        <div className="resource-profile-tab-content" id={`pokemon-content-${pokemonTab}`} role="tabpanel" aria-labelledby={`pokemon-tab-${pokemonTab}`}>
        {pokemonTab === 'overview' && <section className="resource-species-overview">

          <h3>Abilities</h3><div className="resource-overview-abilities">{profile?.abilities?.map(id => <div key={id}><button className="resource-ability-link" onClick={() => { setSelected(null); setLocationOrigin(null); setItemOrigin(null); setAbilityOrigin(id); setView('abilities') }}>{abilityNames[id] ?? 'Unknown'}</button><p>{abilityDescriptions[id]}{abilityFieldEffects[id] && <> {abilityFieldEffects[id].games && <><GameNames>{abilityFieldEffects[id].games}</GameNames>: </>}{abilityFieldEffects[id].description}</>}</p></div>)}</div>
          <h3 className="resource-pokedex-entry-heading">Pokédex Entry · <select aria-label="Pokédex entry game" data-game={entryGame} value={entryGame} onChange={event => setEntryGame(event.target.value)}>{['Emerald','Ruby','Sapphire','FireRed','LeafGreen'].map(game => <option key={game}>{game}</option>)}</select></h3><p>{pokedexEntries[selected[0]][entryGame]}</p>
        <EvolutionSection embedded id={selected[0]} onPokemon={setSelected} />
          {selected[1].dex === 386 && <div className="resource-deoxys-forms"><h3>Forms</h3><dl>
            <div><dt>Normal</dt><dd><GameNames>R/S/Colo/XD</GameNames></dd></div>
            <div><dt>Attack</dt><dd><GameNames>FR</GameNames></dd></div>
            <div><dt>Defense</dt><dd><GameNames>LG</GameNames></dd></div>
            <div><dt>Speed</dt><dd><GameNames>Emerald</GameNames></dd></div>
          </dl></div>}
        </section>}
        {pokemonTab === 'stats' && <SpeciesFacts embedded mode="stats" id={selected[0]} types={displayTypes} baseStats={<><div className="resource-base-stats">{statNames.map(([label, key]) => <div key={key} data-stat={key}><span>{label}</span><strong>{profile?.baseStats?.[key] ?? '—'}</strong><div><i style={{ width: `${Math.min(100, (profile?.baseStats?.[key] ?? 0) / statMaximums[key] * 100)}%` }} /></div></div>)}</div><p className="resource-stat-total">Total <strong>{statNames.reduce((sum, [, key]) => sum + (profile?.baseStats?.[key] ?? 0), 0)}</strong></p></>} />}
        {pokemonTab === 'locations' && <SpeciesEncounters embedded id={selected[0]} onPokemon={setSelected} onLocation={location=>{setEncounterOrigin(selected);setLocationOrigin(location);setView('locations')}} />}
        {pokemonTab === 'moves' && <LearnsetSection embedded id={selected[0]} />}
        {pokemonTab === 'extra' && <SpeciesFacts embedded id={selected[0]} types={displayTypes} growthRate={profile?.growthRate} />}
        </div>
      </article>
    </> : <>
      {showingList && <div className="resource-list-heading"><button className="resources-back" onClick={goBack}>← Back</button><h2>Pokémon Database</h2><span>{matches.length} species</span></div>}
      <div className={showingList ? "resource-database-controls" : undefined}>
      <label className="resources-search"><input aria-label="Search Pokémon by name" type="search" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} /></label>
      {showingList && <label className="resource-type-filter"><select aria-label="Type" value={type} onChange={e => setType(e.target.value)}><option value="" disabled hidden>Type</option><option value="all">All</option>{types.map(t => <option key={t}>{t}</option>)}</select></label>}
      {showingList && <label className="resource-type-filter"><select aria-label="Generation" value={generation} onChange={e => setGeneration(e.target.value)}><option value="" disabled hidden>Gen</option><option value="all">All</option>{[1, 2, 3].map(gen => <option key={gen} value={gen}>Gen {gen}</option>)}</select></label>}
      </div>
      {showingList ? <>
        <div className="resource-pokemon-grid">{matches.map(entry => { const [id, meta] = entry; return <button key={id} onClick={() => setSelected(entry)}><span>#{String(meta.dex).padStart(3, '0')}</span><img loading="lazy" src={`${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`} alt="" /><strong>{meta.name}</strong><ResourceTypeIcons types={meta.types} /></button> })}</div>
        {!matches.length && <p className="resource-empty">No results.</p>}
      </> : <>
        <div className="resources-categories">{categories.map(category => category.available ? <button key={category.title} onClick={() => { setLocationOrigin(null); setToolOrigin(null); setGuideOrigin(null); setTutorOrigin(null); setBreedingOrigin(null); setEggOrigin(null); setView(category.title === 'Database' ? 'database' : category.title === 'Tools & Charts' ? 'tools' : category.title === 'Guides' ? 'guides' : 'locations') }}><span className="resource-category-icon" aria-hidden="true">{category.icon}</span><h2>{category.title}</h2><p>{category.description}</p><b>{category.title === 'Database' ? 'Browse database →' : category.title === 'Tools & Charts' ? 'Open tools →' : category.title === 'Guides' ? 'Browse guides →' : 'Explore locations →'}</b></button> : <article key={category.title}><span className="resource-category-icon" aria-hidden="true">{category.icon}</span><h2>{category.title}</h2><p>{category.description}</p><b>Coming next</b></article>)}</div>
        <p className="resource-note">Browse Pokémon, moves, and abilities in Database. This search currently finds Pokémon; more library sections will be added.</p>
      </>}
    </>}
  </div>
}
