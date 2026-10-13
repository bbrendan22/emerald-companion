import TutorChart from './TutorChart'
import EVTrainingTool from './EVTrainingTool'
import EggMoveTool from './EggMoveTool'
import PickupTool from './PickupTool'
import { BasicNatureChart, BasicTypeChart } from './ReferenceCharts'
import HiddenPowerTool from './HiddenPowerTool'
import IVCalculatorTool from './IVCalculatorTool'
import StatsEVTool from './StatsEVTool'
import MoveCoverage from './MoveCoverage'
import ResourceHeading from './ResourceHeading'
import ResourceFilter from './ResourceFilter'
import useResourceViewport from './useResourceViewport'
import { deoxysForms } from '../data/deoxysForms'
import { pokedexEntries } from '../data/pokedexEntries'
import GameNames from './GameNames'
import { useRef, useState } from 'react'
import { emeraldTypes } from '../utils/typeMatchups'
import { pokemonMeta } from '../data/pokemonMeta'
import { speciesInfo, abilityNames } from '../data/emeraldData'
import './ResourcesPage.css'
import LocationsBrowser from './LocationsBrowser'
import ItemsBrowser from './ItemsBrowser'
import FrontierSetsBrowser from './FrontierSetsBrowser'
import FrontierTrainersBrowser from './FrontierTrainersBrowser'
import AbilitiesBrowser from './AbilitiesBrowser'
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


function genderRatio(value) {
  if (value === 255) return 'Genderless'
  if (value === 254) return 'Female only'
  if (value === 0) return 'Male only'
  const female = { 31: 12.5, 63: 25, 127: 50, 191: 75 }[value]
  return female == null ? 'Not recorded' : `${100 - female}% male · ${female}% female`
}

export default function ResourcesPage({ collection=[] }) {
  useResourceViewport()
  const [view, updateView] = useState('home')
  const [itemCategory, setItemCategory] = useState('Battle')
  const [frontierSection, setFrontierSection] = useState('Pokémon Sets')
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
  const [locationOrigin, setLocationOrigin] = useState(null)
  const [learnsetOrigin, setLearnsetOrigin] = useState(null)
  const [encounterOrigin, setEncounterOrigin] = useState(null)
  const history = useRef([])
  const pokemonGrid = useRef(null)
  const resourcesHome = useRef(null)
  const [previousPage, setPreviousPage] = useState(null)
  const snapshot = { view, selected, query, type, generation, abilityOrigin, itemOrigin, linkedMove, locationOrigin, learnsetOrigin, encounterOrigin }
  const remember = () => {
    if (history.current.at(-1)?.render === snapshot) return
    const entry = { ...snapshot, render:snapshot, pokemonScroll:pokemonGrid.current?.scrollTop ?? 0, homeScroll:resourcesHome.current?.scrollTop ?? 0, scroll:window.scrollY }
    history.current.push(entry)
    setPreviousPage(entry)
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
    const saved = history.current.pop()
    const previous = saved ? {...saved} : null
    setPreviousPage(history.current.at(-1) ?? null)
    if (!previous) { updateView('home'); updateSelected(null); return }
    // Keep the detail that launched an external link when restoring its browser.
    if (previous.view === 'abilities') previous.abilityOrigin = abilityOrigin
    if (previous.view === 'locations') previous.locationOrigin = locationOrigin
    if (previous.view === 'items' || previous.view === 'machines') previous.itemOrigin = itemOrigin
    requestAnimationFrame(() => {
      window.scrollTo(0, previous.scroll ?? 0)
      if (pokemonGrid.current) pokemonGrid.current.scrollTop = previous.pokemonScroll ?? 0
      if (resourcesHome.current) resourcesHome.current.scrollTop = previous.homeScroll ?? 0
    })
    updateView(previous.view); updateSelected(previous.selected); setPokemonTab('overview')
    setQuery(previous.query); setType(previous.type); setGeneration(previous.generation)
    setAbilityOrigin(previous.abilityOrigin); setItemOrigin(previous.itemOrigin); setLinkedMove(previous.linkedMove)
    setLocationOrigin(previous.locationOrigin)
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
  if (view === 'ev-training') return <EVTrainingTool onBack={goBack}/>
  if (view === 'egg-move-tool') return <EggMoveTool onBack={goBack}/>
  if (view === 'tutor-chart') return <TutorChart onBack={goBack}/>
  if (view === 'pickup-tables') return <PickupTool onBack={goBack}/>
  if (view === 'nature-chart') return <BasicNatureChart onBack={goBack}/>
  if (view === 'type-chart') return <BasicTypeChart onBack={goBack}/>
  if (view === 'hidden-power') return <HiddenPowerTool collection={collection} onBack={goBack}/>
  if (view === 'iv-calculator') return <IVCalculatorTool onBack={goBack}/>
  if (view === 'stats-evs') return <StatsEVTool collection={collection} onBack={goBack}/>
  if (view === 'coverage') return <MoveCoverage onBack={goBack}/>
  if (view === 'locations') return <LocationsBrowser onDetailBack={encounterOrigin ? goBack : null} initialLocation={locationOrigin} onItem={(entry,location)=>{setLocationOrigin(location);setItemOrigin({view:entry.machine?'machines':'items',entry});setView(entry.machine?'machines':'items')}} onBack={goBack} onPokemon={(entry,location) => { setAbilityOrigin(null); setItemOrigin(null); setLocationOrigin(location); setSelected(entry); setView('pokemon') }} />
  if (view === 'abilities') return <AbilitiesBrowser onDetailBack={previousPage?.selected ? goBack : null} initialAbility={abilityOrigin} onBack={goBack} onPokemon={(entry, abilityId) => { setSelected(entry); setAbilityOrigin(abilityId); setView('pokemon') }} />
  if (view === 'items' || view === 'machines') return <ItemsBrowser initialCategory={itemCategory} machinesOnly={view === 'machines'} onLocationBack={locationOrigin ? goBack : null} initialEntry={itemOrigin?.entry} onBack={goBack} onMove={(id,entry) => { setItemOrigin({view,entry}); setLinkedMove(id); setView('moves') }} onPokemon={(entry,item) => { setAbilityOrigin(null); setItemOrigin({view,entry:item}); setSelected(entry); setView('pokemon') }} />
  if (view === 'moves') return <MovesBrowser onPokemon={(entry, move) => { setSelected(entry); const origin = history.current.at(-1); if (origin?.view === 'moves') history.current[history.current.length-1] = {...origin,linkedMove:move}; setLinkedMove(move); setView('pokemon') }} initialMove={linkedMove} onDetailBack={linkedMove ? goBack : null} onBack={goBack} />
  if (view === 'frontier-database' && frontierSection === 'Pokémon Sets') return <FrontierSetsBrowser onBack={goBack}/>
  if (view === 'frontier-database' && frontierSection === 'Trainers') return <FrontierTrainersBrowser onBack={goBack}/>
  if (view === 'frontier-database') return <div className="resources-page"><div className="resource-list-heading"><button className="resources-back" onClick={goBack}>← Back</button><ResourceHeading>Battle Frontier · {frontierSection}</ResourceHeading></div><p className="resource-note">This database will be added here.</p></div>
  if (view === 'home' && !selected) return <div className="resources-page resource-home-scroll-page">
    <div className="resource-list-heading"><ResourceHeading>Resources</ResourceHeading></div>
    <div ref={resourcesHome} className="resource-home-scroll-content" tabIndex={0} aria-label="Resources categories">
    <section className="resource-location-category"><h3>Pokémon</h3><div className="resource-location-index">
      <div><button className="resource-location-link" onClick={() => { updateSelected(null); setView('pokemon') }}>Pokémon Database</button></div>
      <div><button className="resource-location-link" onClick={() => { setLinkedMove(null); setView('moves') }}>Moves</button></div>
      <div><button className="resource-location-link" onClick={() => { setAbilityOrigin(null); setView('abilities') }}>Abilities</button></div>
    </div></section>
    <section className="resource-location-category"><h3>Useful Items</h3><div className="resource-location-index">{[['Battle','Battle'],['Utility','Utility'],['Berries','Berries'],['Poké Balls','Poké Balls'],['TMs/HMs','TM/HM'],['Misc.','Misc.']].map(([category,label]) => <div key={category}><button className="resource-location-link" onClick={() => { setItemCategory(category); setItemOrigin(null);  setView('items') }}>{label}</button></div>)}</div></section>
    <section className="resource-location-category"><h3>Battle Frontier</h3><div className="resource-location-index">{['Pokémon Sets','Trainers'].map(section => <div key={section}><button className="resource-location-link" onClick={() => { setFrontierSection(section); setView('frontier-database') }}>{section}</button></div>)}</div></section>
    <section className="resource-location-category"><h3>Tools</h3><div className="resource-location-index">
      <div><button className="resource-location-link" onClick={() => setView('iv-calculator')}>IV Calculator</button></div>
      <div><button className="resource-location-link" onClick={() => setView('hidden-power')}>Hidden Power Calculator</button></div>
      <div><button className="resource-location-link" onClick={() => setView('stats-evs')}>Stat Calculator</button></div>
      <div><button className="resource-location-link" onClick={() => setView('coverage')}>Move Coverage</button></div>
      <div><button className="resource-location-link" onClick={() => setView('egg-move-tool')}>Breeding</button></div>
      <div><button className="resource-location-link" onClick={() => setView('ev-training')}>EV Training</button></div>
    </div></section>
    <section className="resource-location-category"><h3>Charts</h3><div className="resource-location-index">
      <div><button className="resource-location-link" onClick={() => setView('nature-chart')}>Nature Chart</button></div>
      <div><button className="resource-location-link" onClick={() => setView('type-chart')}>Type Chart</button></div>
      <div><button className="resource-location-link" onClick={() => setView('pickup-tables')}>Pickup Tables</button></div>
      <div><button className="resource-location-link" onClick={() => setView('tutor-chart')}>Move Tutors</button></div>
    </div></section>
    <section className="resource-location-category"><h3>Guides</h3></section>

    </div>
  </div>
  return <div className={`resources-page${selected ? ' resource-pokemon-detail-page' : showingList ? ' resource-pokemon-database-page' : ''}`}>
    {selected ? <>
      <div className="resource-list-heading resource-pokemon-detail-heading"><button className="resources-back" onClick={goBack}>← Back</button><ResourceHeading>Pokémon Database</ResourceHeading></div>
      <article className="resource-species resource-species-profile" key={selected[0]}>
        <div className="resource-species-summary"><img className={selected[1].dex === 201 ? "resource-unown-sprite" : undefined} src={`${import.meta.env.BASE_URL}${selected[1].dex === 201 ? `sprites/unown/${showShiny ? 'shiny/' : ''}${unownForm}.png` : `sprites/artwork/${showShiny && !(weatherForm && castformForm !== 'normal') ? 'shiny' : 'normal'}/${weatherForm?.artwork ?? form?.artwork ?? selected[1].dex}.png`}`} alt={`${showShiny ? 'Shiny ' : ''}${selected[1].name}`} /><button className="resource-shiny-toggle" aria-label="Show shiny artwork" aria-pressed={showShiny} title={showShiny ? 'Show normal artwork' : 'Show shiny artwork'} onClick={() => setShowShiny(value => !value)}><span aria-hidden="true">{showShiny ? '★' : '☆'}</span></button><div><span>#{String(selected[1].dex).padStart(3, '0')} · GEN {selected[1].generation}</span><div className="resource-species-name"><h2>{selected[1].name}</h2>{form && <select aria-label="Deoxys form" value={deoxysForm} onChange={event => setDeoxysForm(event.target.value)}>{Object.entries(deoxysForms).map(([key,entry]) => <option key={key} value={key}>{entry.name}</option>)}</select>}{selected[1].dex === 201 && <select aria-label="Unown form" value={unownForm} onChange={event => setUnownForm(event.target.value)}>{unownForms.map(entry => <option key={entry.key} value={entry.key}>{entry.name}</option>)}</select>}{weatherForm && <select aria-label="Castform form" value={castformForm} onChange={event => setCastformForm(event.target.value)}>{Object.entries(castformForms).map(([key,entry]) => <option key={key} value={key}>{entry.name}</option>)}</select>}</div><ResourceTypeIcons types={displayTypes} /><p>{profile?.genderRatio === 255 ? '\u00a0' : genderRatio(profile?.genderRatio)}</p></div></div>
        <div className="resource-profile-tabs" role="tablist" aria-label="Pokémon information">{[['overview','Overview'],['stats','Stats & Matchups'],['locations','Locations'],['moves','Learnset'],['extra','More']].map(([tab,label]) => <button key={tab} id={`pokemon-tab-${tab}`} role="tab" aria-selected={pokemonTab === tab} aria-controls={`pokemon-content-${tab}`} onClick={() => { if (tab !== pokemonTab) setEntryGame('Emerald'); setPokemonTab(tab) }}>{label}</button>)}</div>
        <div className="resource-profile-tab-content" tabIndex={0} key={pokemonTab} id={`pokemon-content-${pokemonTab}`} role="tabpanel" aria-labelledby={`pokemon-tab-${pokemonTab}`}>
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
      {showingList && <div className="resource-list-heading"><button className="resources-back" onClick={goBack}>← Back</button><ResourceHeading>Pokémon Database</ResourceHeading><span>{matches.length} species</span></div>}
      <div className={showingList ? "resource-database-controls" : undefined}>
      <label className="resources-search"><input aria-label="Search Pokémon by name" type="search" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} /></label>
      {showingList && <ResourceFilter label="Type" value={type} onChange={setType} options={types.map(t => ({value:t,label:t}))}/>}
      {showingList && <ResourceFilter label="Gen" value={generation} onChange={setGeneration} options={[1,2,3].map(gen => ({value:String(gen),label:`Gen ${gen}`}))}/>}
      </div>
      {showingList ? <>
        <div ref={pokemonGrid} tabIndex={0} aria-label="Pokémon list" className="resource-pokemon-grid resource-pokemon-rows"><div className="resource-pokemon-columns" aria-hidden="true"><span>Dex</span><span /><span>Pokémon</span><span>Type</span></div>{matches.map(entry => { const [id, meta] = entry; return <button key={id} onClick={() => setSelected(entry)}><span>#{String(meta.dex).padStart(3, '0')}</span><img loading="lazy" src={`${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`} alt="" /><strong>{meta.name.replace(/([♀♂])/g, '$1\uFE0E')}</strong><ResourceTypeIcons types={meta.types} /></button> })}</div>
        {!matches.length && <p className="resource-empty">No results.</p>}
      </> : null}
    </>}
  </div>
}
