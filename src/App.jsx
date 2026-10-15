import { createPortal } from 'react-dom'
import NavigationDiagnostics from './components/NavigationDiagnostics'
import BattleWorkbench from './components/BattleWorkbench'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { emeraldTypes } from './utils/typeMatchups'
import ResourcesPage from './components/ResourcesPage'
import { createCollectionId } from './utils/collectionId'
import PokemonEditor from './components/PokemonEditor'
import ResourceTypeIcons from './components/ResourceTypeIcons'
import ResourceFilter from './components/ResourceFilter'
import useResourceViewport from './components/useResourceViewport'
import { abilityDescriptions } from './data/abilityDescriptions'
import { itemResources } from './data/itemResources'
import { moveResources } from './data/moveResources'
import { itemDescription } from './utils/itemCategories'
import SpeciesFacts from './components/SpeciesFacts'
import { collectionRibbonCatalog, ribbonEarned, friendshipDisplay, pokerusDisplay, expForLevel, levelFromExperience } from './utils/collectionDetails'
import { deoxysForms } from './data/deoxysForms'
import HomeSaveDialog from './components/HomeSaveDialog'
import { Pokeball, FrontierEmblem, HomeIcon, TrainerStatIcon } from './components/HomeArtwork'
import { pokemonMeta } from './data/pokemonMeta'
import { speciesInfo, moveInfo, itemNames } from './data/emeraldData'

const SAVE_STORAGE_KEY =
  'emerald-companion-save-v1'

const DESIGNATION_STORAGE_KEY =
  'emerald-companion-designations-v1'



const ROLES = [
  {
    id: 'bf',
    label: 'BF Trained',
  },
  {
    id: 'utility',
    label: 'Utility',
  },
  {
    id: 'pokedex',
    label: 'Pokédex',
  },
]

const ROLE_ORDER = {
  bf: 0,
  utility: 1,
  pokedex: 2,
}

function loadStoredSave() {
  // Local design preview does not overwrite the user's stored save.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')) {
    return {
      designPreview: true, trainerName: 'Brendan', trainerId: 12345, secretId: 54321,
      playTime: { hours: 124, minutes: 28 }, money: 302416,
      badgeData: { count: 8 }, pokedex: { caughtCount: 73 },
      frontierSymbols: { tower: 'gold', dome: 'silver', factory: 'gold' },
    }
  }
  try {
    const stored =
      localStorage.getItem(
        SAVE_STORAGE_KEY
      )

    return stored
      ? JSON.parse(stored)
      : null
  } catch {
    return null
  }
}

function loadDesignations() {
  try {
    const stored = localStorage.getItem(DESIGNATION_STORAGE_KEY)
    if (!stored) return {}
    const saved = JSON.parse(stored)
    return Object.entries(saved).reduce((migrated, [key, role]) => {
      const parts = key.split('-')
      const stableKey = parts.length >= 3 ? parts.slice(0, 2).join('-') : key
      migrated[stableKey] = role
      return migrated
    }, {})
  } catch {
    return {}
  }
}

function getPokemonId(pokemon) {
  return pokemon.manualId ?? [pokemon.personality, pokemon.otId].join('-')
}

function getRole(
  pokemon,
  designations
) {
  return (
    designations[
      pokemon.companionId
    ] ?? 'pokedex'
  )
}

function getMeta(pokemon) {
  return (
    pokemonMeta[
      pokemon.species
    ] ?? null
  )
}

function buildCollection(
  saveData
) {
  if (!saveData) {
    return []
  }

  const collection = (saveData.manualPokemon ?? []).map(pokemon => ({ ...pokemon, companionId: getPokemonId(pokemon) }))

  saveData.party?.pokemon
    ?.forEach((pokemon) => {
      collection.push({
        ...pokemon,
        companionId:
          getPokemonId(pokemon),
      })
    })

  saveData.pcStorage?.boxes
    ?.forEach((box) => {
      box.pokemon.forEach(
        (pokemon) => {
          collection.push({
            ...pokemon,
            companionId:
              getPokemonId(
                pokemon
              ),
          })
        }
      )
    })

  const seen = new Set()

  return collection.filter(
    (pokemon) => {
      if (
        seen.has(
          pokemon.companionId
        )
      ) {
        return false
      }

      seen.add(
        pokemon.companionId
      )

      return true
    }
  )
}

function formatPlayTime(
  playTime
) {
  if (!playTime) {
    return '--:--'
  }

  return `${playTime.hours}:${String(
    playTime.minutes
  ).padStart(2, '0')}`
}

function formatMoney(money) {
  if (
    money === null ||
    money === undefined
  ) {
    return '₽---'
  }

  return `₽${Number(
    money
  ).toLocaleString()}`
}

function spritePath(
  pokemon
) {
  const meta =
    getMeta(pokemon)

  if (!meta) {
    return ''
  }

  if (pokemon.shiny) {
    return `${import.meta.env.BASE_URL}sprites/emerald/shiny/${meta.dex}.png`
  }

  return `${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`
}

function artworkSpritePath(
  pokemon
) {
  const meta =
    getMeta(pokemon)

  if (!meta) {
    return ''
  }

  const variant = pokemon.shiny ? 'shiny' : 'normal'
  return `${import.meta.env.BASE_URL}sprites/artwork/${variant}/${meta.dex}.png`
}

function HomePage({
  saveData,
  collection,
  onSaveLoaded,
}) {
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    const original = viewport?.getAttribute('content')
    viewport?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    const preventGesture = (event) => event.preventDefault()
    const preventPinch = (event) => {
      if (event.touches.length > 1) event.preventDefault()
    }
    document.addEventListener('gesturestart', preventGesture, { passive: false })
    document.addEventListener('gesturechange', preventGesture, { passive: false })
    document.addEventListener('touchmove', preventPinch, { passive: false })
    return () => {
      if (original !== null && original !== undefined) viewport?.setAttribute('content', original)
      document.removeEventListener('gesturestart', preventGesture)
      document.removeEventListener('gesturechange', preventGesture)
      document.removeEventListener('touchmove', preventPinch)
    }
  }, [])

  const [editingSave, setEditingSave] = useState(false)
  const base = import.meta.env.BASE_URL
  const shinyCount = collection.filter((pokemon) => pokemon.shiny).length
  const caught = Number(saveData.pokedex?.caughtCount ?? 0)
  const caughtPct = Math.max(0, Math.min(100, (caught / 386) * 100))
  const caughtSegments = (caughtPct / 100) * 20
  const badgeCount = Number(saveData.badgeData?.count ?? 0)
  const sid = saveData.secretId ?? saveData.secretTrainerId ?? saveData.sid ?? '-----'
  const gender = String(saveData.trainerGender ?? saveData.gender ?? 'male').toLowerCase()
  const trainerSprite = gender.includes('female') || gender.includes('girl') || gender.includes('may') ? 'may.png' : 'brendan.png'

  const badges = [
    ['Stone', 'stone_badge.png'], ['Knuckle', 'knuckle_badge.png'],
    ['Dynamo', 'dynamo_badge.png'], ['Heat', 'heat_badge.png'],
    ['Balance', 'balance_badge.png'], ['Feather', 'feather_badge.png'],
    ['Mind', 'mind_badge.png'], ['Rain', 'rain_badge.png'],
  ]
  const facilities = [
    ['Tower', 'tower'], ['Dome', 'dome'], ['Palace', 'palace'], ['Arena', 'arena'],
    ['Factory', 'factory'], ['Pike', 'pike'], ['Pyramid', 'pyramid'],
  ]
  const frontierState = saveData.frontierSymbols ?? saveData.frontier?.symbols ?? {}
  const getSymbolState = (key) => {
    const raw = String(frontierState?.[key] ?? frontierState?.[key.toUpperCase()] ?? '').toLowerCase()
    if (raw.includes('gold')) return 'gold'
    if (raw.includes('silver')) return 'silver'
    return 'none'
  }
  const goldSymbols = facilities.filter(([, key]) => getSymbolState(key) === 'gold').length

  return (
    <div className="home97">
      {editingSave && <HomeSaveDialog saveData={saveData ?? {}} onSaveLoaded={onSaveLoaded} onClose={() => setEditingSave(false)} />}
      <header className="home97-header">
        <img className="home97-banner" src={`${base}home/header/tropical-pokemon-banner.png`} alt="Pokémon from Generations 1 through 3 relaxing together on a tropical beach" />
        <div className="home97-logo">
          <img src={`${base}home/header/pokemon_logo.png`} alt="Pokémon" />
          <strong>EMERALD</strong><span>COMPANION</span>
        </div>
      </header>

      <div className="home97-frame home97-frame-trainer"><section className="home97-card home97-trainer">
        <div className="home97-tab"><Pokeball />TRAINER</div>
        <div className="home97-trainer-top">
          <div className="home97-trainer-name">
            <h2>{saveData.trainerName || 'TRAINER'}</h2>
            <p><span>{`TID: ${String(saveData.trainerId ?? '-----').padStart(5, '0')}`}</span><span>{`SID: ${sid === '-----' ? sid : String(sid).padStart(5, '0')}`}</span></p>
          </div>
          <div className="home97-trainer-portrait"><img className="home97-trainer-sprite" src={`${base}home/trainers/${trainerSprite}`} alt="Trainer" /></div>
          <div className="home97-save"><button className="update-save-button" onClick={() => setEditingSave(true)}><svg className="save-upload-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square" strokeLinejoin="miter"><path d="M12 15V3m-5 5 5-5 5 5M4 14v6h16v-6" /></svg>Update Save</button></div>
        </div>
        <div className="home97-stats">
          <div><b className="home97-clock"><TrainerStatIcon kind="clock" /></b><p><span>TIME PLAYED</span><strong>{formatPlayTime(saveData.playTime)}</strong></p></div>
          <div><b className="home97-coin"><TrainerStatIcon kind="coin" /></b><p><span>MONEY</span><strong>{formatMoney(saveData.money)}</strong></p></div>
        </div>
        <div className="home97-badges"><label>BADGES</label><div>{badges.map(([name,file],i)=><img key={name} className={(saveData.badgeData?.badges?.[i] ?? (i < badgeCount)) ? '' : 'unearned'} src={`${base}home/badges/${file}`} alt={`${name} Badge`} />)}</div></div>
      </section></div>

      <div className="home97-frame home97-frame-dex"><section className="home97-card home97-dex">
        <div className="home97-tab home97-tab-wide"><Pokeball />NATIONAL POKÉDEX</div>
        <div className="home97-dex-main">
          <img className="home97-dex-art" src={`${base}home/pokedex/pokedex-pixel.png`} alt="Pokédex" />
          <div className="home97-caught"><span>CAUGHT</span><strong>{`${caught} / 386`}</strong><div className="home97-bar" role="progressbar" aria-label="Pokédex caught" aria-valuemin={0} aria-valuemax={386} aria-valuenow={Math.max(0, Math.min(386, caught))}>{Array.from({length:20},(_,i)=><i key={i}><span style={{width: `${Math.max(0, Math.min(1, caughtSegments - i)) * 100}%`}} /></i>)}</div><b>{caughtPct.toFixed(1)}% COMPLETE</b></div>
          <Pokeball className="home97-ballmark" />
        </div>
        <div className="home97-dex-bottom">
          <div><span>POKÉMON OWNED</span><strong>{collection.length}</strong><img className="home97-pikachu" src={`${base}home/pokedex/pikachu.png`} alt="" /></div>
          <div><span>SHINIES</span><strong>{shinyCount}</strong><img className="home97-starters" src={`${base}home/pokedex/gen1-starters-transparent.png`} alt="" /></div>
        </div>
      </section></div>

      <div className="home97-frame home97-frame-frontier"><section className="home97-card home97-frontier">
        <div className="home97-frontier-head"><div className="home97-tab"><Pokeball />BATTLE FRONTIER</div><strong>GOLD SYMBOLS&nbsp; {goldSymbols} / 7</strong></div>
        <div className="home97-symbols">{facilities.map(([label,key])=>{const state=getSymbolState(key);return <div className={state} key={key}><span>{label}</span><FrontierEmblem facility={key} state={state}/><b>{state==='none'?'---':state.toUpperCase()}</b></div>})}</div>
      </section></div>
    </div>
  )
}

function PokemonTile({
  pokemon,
  onOpen,
}) {
  const meta =
    getMeta(pokemon)

  if (!meta) {
    return null
  }

  return <button className="collection-database-card" onClick={() => onOpen(pokemon)}>
    <span>#{String(meta.dex).padStart(3, '0')}{pokemon.shiny ? ' ★' : ''}</span>
    <small className="collection-card-level">Lv. {pokemon.level ?? levelFromExperience(pokemon.experience,speciesInfo[pokemon.species]?.growthRate) ?? '—'}</small>
    <img loading="lazy" src={spritePath(pokemon)} alt="" draggable="false" />
    <strong>{pokemon.nickname || pokemon.speciesName}</strong>
    <ResourceTypeIcons types={meta.types} />
  </button>
}

function sumStats(stats) {
  if (!stats) {
    return null
  }

  const values = [
    stats.hp,
    stats.attack,
    stats.defense,
    stats.spAttack,
    stats.spDefense,
    stats.speed,
  ]

  if (
    values.some(
      (value) =>
        value === null ||
        value === undefined
    )
  ) {
    return null
  }

  return values.reduce(
    (total, value) =>
      total + Number(value),
    0
  )
}

function getHiddenPower(ivs) {
  if (!ivs) {
    return null
  }

  const values = [
    ivs.hp,
    ivs.attack,
    ivs.defense,
    ivs.speed,
    ivs.spAttack,
    ivs.spDefense,
  ]

  if (
    values.some(
      (value) =>
        value === null ||
        value === undefined
    )
  ) {
    return null
  }

  const types = [
    'Fighting',
    'Flying',
    'Poison',
    'Ground',
    'Rock',
    'Bug',
    'Ghost',
    'Steel',
    'Fire',
    'Water',
    'Grass',
    'Electric',
    'Psychic',
    'Ice',
    'Dragon',
    'Dark',
  ]

  const typeBits =
    values.reduce(
      (total, value, index) =>
        total +
        ((value & 1) << index),
      0
    )

  const powerBits =
    values.reduce(
      (total, value, index) =>
        total +
        (((value >> 1) & 1) <<
          index),
      0
    )

  const typeIndex =
    Math.floor(
      (typeBits * 15) / 63
    )

  const power =
    Math.floor(
      (powerBits * 40) / 63
    ) + 30

  return {
    type: types[typeIndex],
    power,
  }
}

function getPokerusStatus(pokemon) { return pokerusDisplay(pokemon) }

function getCurrentStats(pokemon) {
  return {
    hp:
      pokemon.currentHp ??
      pokemon.hp ??
      null,
    maxHp:
      pokemon.maxHp ?? null,
    attack:
      pokemon.attack ?? null,
    defense:
      pokemon.defense ?? null,
    spAttack:
      pokemon.spAttack ?? null,
    spDefense:
      pokemon.spDefense ?? null,
    speed:
      pokemon.speed ?? null,
  }
}

const NATURE_MODIFIERS = {
  Hardy: [null, null], Lonely: ['attack', 'defense'], Brave: ['attack', 'speed'],
  Adamant: ['attack', 'spAttack'], Naughty: ['attack', 'spDefense'],
  Bold: ['defense', 'attack'], Docile: [null, null], Relaxed: ['defense', 'speed'],
  Impish: ['defense', 'spAttack'], Lax: ['defense', 'spDefense'],
  Timid: ['speed', 'attack'], Hasty: ['speed', 'defense'], Serious: [null, null],
  Jolly: ['speed', 'spAttack'], Naive: ['speed', 'spDefense'],
  Modest: ['spAttack', 'attack'], Mild: ['spAttack', 'defense'],
  Quiet: ['spAttack', 'speed'], Bashful: [null, null], Rash: ['spAttack', 'spDefense'],
  Calm: ['spDefense', 'attack'], Gentle: ['spDefense', 'defense'],
  Sassy: ['spDefense', 'speed'], Careful: ['spDefense', 'spAttack'],
  Quirky: [null, null],
}


function natureMultiplier(nature, stat) {
  const [up, down] = NATURE_MODIFIERS[nature] ?? [null, null]
  if (up === stat) return 1.1
  if (down === stat) return 0.9
  return 1
}

function calculateStats(pokemon, profile, level) {
  const base = profile?.baseStats
  if (!base || !pokemon.ivs || !pokemon.evs || !level) return null
  const core = (stat) =>
    Math.floor(((2 * base[stat] + Number(pokemon.ivs[stat] ?? 0) + Math.floor(Number(pokemon.evs[stat] ?? 0) / 4)) * level) / 100)
  const hp = pokemon.speciesName === 'Shedinja' ? 1 : core('hp') + level + 10
  const calc = (stat) => Math.floor((core(stat) + 5) * natureMultiplier(pokemon.nature, stat))
  return { hp, maxHp: hp, attack: calc('attack'), defense: calc('defense'), spAttack: calc('spAttack'), spDefense: calc('spDefense'), speed: calc('speed') }
}

function getMoveMaxPp(basePp, ppBonuses, slot) {
  if (basePp == null) return null
  const ups = ppBonuses == null ? 0 : (Number(ppBonuses) >> (slot * 2)) & 0x3
  return Math.floor(Number(basePp) * (5 + ups) / 5)
}

function assetSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const ITEM_ICON_SLUG_OVERRIDES = {
  blackglasses: 'black-glasses',
  nevermeltice: 'never-melt-ice',
  silverpowder: 'silver-powder',
  twistedspoon: 'twisted-spoon',
}

function itemIconSlug(name) {
  const compact = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  return ITEM_ICON_SLUG_OVERRIDES[compact] || assetSlug(name)
}

function ItemIcon({ name }) {
  if (!name || name === 'None' || name === '—') return null
  return (
    <img
      className="held-item-icon"
      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemIconSlug(name)}.png`}
      alt=""
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}

function PokemonDetail({
  onEdit,
  pokemon,
  role,
  onRoleChange,
  onClose,
}) {
  const [detailTab, setDetailTab] = useState('summary')
  const [selectedRibbon, setSelectedRibbon] = useState(null)

  if (!pokemon) return null
  const meta = getMeta(pokemon)
  if (!meta) return null

  const profile = speciesInfo?.[pokemon.species] ?? null
  const level = pokemon.level ?? levelFromExperience(pokemon.experience, profile?.growthRate)
  const calculated = calculateStats(pokemon, profile, level)
  const live = getCurrentStats(pokemon)
  const current = {
    hp: live.hp ?? calculated?.hp ?? null,
    maxHp: live.maxHp ?? calculated?.maxHp ?? null,
    attack: live.attack ?? calculated?.attack ?? null,
    defense: live.defense ?? calculated?.defense ?? null,
    spAttack: live.spAttack ?? calculated?.spAttack ?? null,
    spDefense: live.spDefense ?? calculated?.spDefense ?? null,
    speed: live.speed ?? calculated?.speed ?? null,
  }
  const base = profile?.baseStats ?? meta.baseStats ?? pokemon.baseStats ?? null
  const distinctNickname = pokemon.nickname?.trim() && pokemon.nickname.trim().toLowerCase() !== pokemon.speciesName?.trim().toLowerCase() ? pokemon.nickname.trim() : null
  const hiddenPower = getHiddenPower(pokemon.ivs)
  const ivTotal = sumStats(pokemon.ivs)
  const evTotal = sumStats(pokemon.evs)
  const heldItem = !pokemon.heldItem ? 'None' : (itemNames?.[pokemon.heldItem] || pokemon.heldItemName || `Item ${pokemon.heldItem}`)
  const pokerusStatus = getPokerusStatus(pokemon)

  const statKeys = [['HP','hp'],['Atk','attack'],['Def','defense'],['SpA','spAttack'],['SpD','spDefense'],['Spe','speed']]

  const expNow = Number(pokemon.experience ?? 0)
  const nextLevelExp = level && level < 100 ? expForLevel(level + 1, profile?.growthRate) : expNow
  const thisLevelExp = level ? expForLevel(level, profile?.growthRate) : 0
  const expRemaining = Math.max(0, nextLevelExp - expNow)
  const expPct = nextLevelExp > thisLevelExp ? Math.max(0, Math.min(100, ((expNow - thisLevelExp) / (nextLevelExp - thisLevelExp)) * 100)) : 100


  return <div className="collection-profile-overlay">
    {selectedRibbon && <div className="collection-ribbon-popup-backdrop" onClick={() => setSelectedRibbon(null)}><div className="collection-ribbon-popup" role="tooltip" style={{left:selectedRibbon.x,top:selectedRibbon.y,maxWidth:selectedRibbon.width}}>{selectedRibbon.name}</div></div>}
    <article className="collection-profile">
      <div className="resource-list-heading collection-profile-heading"><button className="resources-back" onClick={onClose}>← Back</button><h2>My Pokémon</h2><button className="collection-profile-edit" onClick={() => onEdit(pokemon)}>Edit</button></div>
      <div className="collection-profile-frame resource-species resource-species-profile">
      <header className="collection-profile-summary resource-species-summary">
        <img src={artworkSpritePath(pokemon)} alt={pokemon.speciesName} />
        <div><span>#{String(meta.dex).padStart(3, '0')} · GEN {meta.generation}</span><div className="resource-species-name collection-profile-name"><h2>{pokemon.speciesName}{pokemon.shiny && ' ★'}</h2>{distinctNickname && <span className="collection-profile-nickname">“{distinctNickname}”</span>}</div><ResourceTypeIcons types={meta.types} /><p>Lv. {level ?? '—'}{pokemon.gender && pokemon.gender !== 'Unknown' ? ` · ${pokemon.gender}` : ''} · {pokemon.nature || 'Unknown nature'}</p></div>
      </header>
      <div className="collection-profile-tabs resource-profile-tabs" role="tablist" aria-label="Pokémon information">{[['summary','Overview'],['moves','Moves'],['training','Stats & Matchups'],['details','Details']].map(([key,label]) => <button key={key} role="tab" id={`collection-tab-${key}`} aria-selected={detailTab === key} aria-controls="collection-profile-content" onClick={() => setDetailTab(key)}>{label}</button>)}</div>
      <div className="collection-profile-content" key={detailTab} id="collection-profile-content" role="tabpanel" aria-labelledby={`collection-tab-${detailTab}`} tabIndex={0}>
        {detailTab === 'summary' && <>
          <div className="collection-profile-overview resource-species-overview">
            <h3>Ability</h3><div className="resource-overview-abilities"><div><strong className="collection-profile-info-name">{pokemon.ability || 'Unknown'}</strong><p>{abilityDescriptions[pokemon.abilityId ?? profile?.abilities?.[pokemon.abilitySlot ?? 0]] || 'Ability description unavailable.'}</p></div></div>
            <h3>Held item</h3><div className="resource-overview-abilities"><div><strong className="collection-profile-info-name">{heldItem}<ItemIcon name={heldItem} /></strong>{pokemon.heldItem ? <p>{itemResources[pokemon.heldItem] ? itemDescription({...itemResources[pokemon.heldItem],id:pokemon.heldItem}) : 'Item description unavailable.'}</p> : <p>No held item.</p>}</div></div>
            <dl className="collection-profile-facts"><div><dt>Origin game</dt><dd>{pokemon.originGame || 'Unknown'}</dd></div><div><dt>OT</dt><dd>{pokemon.otName || 'Unknown'}</dd></div></dl>
          </div>
          <h3>Role</h3><div className="collection-profile-roles">{ROLES.map(item => <button key={item.id} aria-pressed={role === item.id} onClick={() => onRoleChange(pokemon.companionId,item.id)}>{item.label}</button>)}</div>
        </>}
        {detailTab === 'moves' && <div className="collection-profile-moves"><h3>Moves</h3>{(pokemon.moves || []).map((move,index) => {const info=moveResources[move.id] ?? moveInfo[move.id] ?? {}; const type=info.type ?? move.type ?? 'NORMAL'; return <div className="collection-profile-move" key={`${move.id}-${index}`}><div className="collection-profile-move-heading"><strong className="collection-profile-info-name">{move.name}</strong><ResourceTypeIcons types={[type]} /><span>PP {getMoveMaxPp(info.pp ?? move.maxPp,pokemon.ppBonuses,index) ?? '—'}</span></div><p>{info.description || 'Move description unavailable.'}</p></div>})}{!pokemon.moves?.length && <p>No moves recorded.</p>}<h3>Hidden Power</h3><div className="collection-profile-move-heading collection-profile-hidden-heading"><strong className="collection-profile-info-name">{hiddenPower?.type ?? 'Unknown'}</strong><ResourceTypeIcons types={hiddenPower ? [hiddenPower.type] : []} /><span>Power {hiddenPower?.power ?? '—'}</span></div></div>}
        {detailTab === 'training' && <><table className="collection-profile-training collection-profile-stat-table"><colgroup><col className="collection-stat-label" /><col className="collection-stat-current" /><col /><col className="collection-stat-small" /><col className="collection-stat-small" /><col className="collection-stat-small" /></colgroup><thead><tr><th>Stat</th><th>Current</th><th aria-label="Base stat bar"></th><th>Base</th><th>IV</th><th>EV</th></tr></thead><tbody>{statKeys.map(([label,key]) => {const value=(key === 'hp' ? current.maxHp : current[key]); const maximum=Math.max(1,...Object.entries(pokemonMeta).filter(([,meta]) => meta.dex >= 1 && meta.dex <= 386 && meta.generation <= 3).map(([id]) => speciesInfo[id]?.baseStats?.[key] ?? 0),...Object.values(deoxysForms).map(form => form.baseStats[key])); return <tr key={key}><th>{label}</th><td className="collection-stat-current-value"><strong>{value ?? '—'}</strong></td><td><div className="collection-current-stat"><div className="resource-base-stats"><div data-stat={key}><div><i style={{width:`${Math.min(100,(base?.[key] ?? 0) / maximum * 100)}%`}} /></div></div></div></div></td><td>{base?.[key] ?? '—'}</td><td>{pokemon.ivs?.[key] ?? '—'}</td><td>{pokemon.evs?.[key] ?? '—'}</td></tr>})}</tbody><tfoot><tr><th>Total</th><td>{sumStats({...current,hp:current.maxHp}) ?? '—'}</td><td></td><td>{sumStats(base) ?? '—'}</td><td>{ivTotal ?? '—'}</td><td>{evTotal ?? '—'}</td></tr></tfoot></table><SpeciesFacts embedded mode="stats" id={pokemon.species} types={meta.types} /></>}
        {detailTab === 'details' && <div className="collection-profile-details"><h3>Experience</h3>{pokemon.experience != null ? <><div className="collection-experience-copy"><span>Current <strong>{expNow.toLocaleString()}</strong></span><span>To next level <strong>{expRemaining.toLocaleString()}</strong></span></div><div className="exp-track"><i style={{width:`${expPct}%`}} /></div></> : <p>Experience not recorded.</p>}<dl className="collection-profile-facts"><div><dt>Friendship</dt><dd>{friendshipDisplay(pokemon)}</dd></div><div><dt>Pokérus</dt><dd>{pokerusStatus}</dd></div><div><dt>Poké Ball</dt><dd>{pokemon.pokeBall || 'Unknown'}</dd></div></dl><h3>Ribbons{pokemon.ribbonsChecked === false || (pokemon.ribbonsChecked == null && pokemon.ribbons == null) ? <small className="collection-ribbon-unknown"> · Not recorded</small> : null}</h3><div className="collection-ribbon-grid">{collectionRibbonCatalog.map(ribbon => {const earned=ribbonEarned(pokemon.ribbons,ribbon);return <button type="button" className={`collection-ribbon${earned ? ' earned' : ''}`} key={ribbon.name} title={`${ribbon.name} · ${earned ? 'Earned' : 'Not earned'}`} onClick={event => {const rect=event.currentTarget.getBoundingClientRect(); setSelectedRibbon({name:ribbon.name,x:rect.left+rect.width/2,y:rect.top-5,width:Math.min(190,2*Math.min(rect.left+rect.width/2-8,window.innerWidth-(rect.left+rect.width/2)-8))})}} aria-label={`${ribbon.name}: ${earned ? 'earned' : 'not earned'}`}><img src={`${import.meta.env.BASE_URL}ribbons/${ribbon.sprite}.png`} alt="" /></button>})}</div></div>}

      </div>
      </div>
    </article>
  </div>

}

function MyPokemonPage({
  onPokemonDelete,
  onPokemonSave,
  collection,
  designations,
  onRoleChange,
}) {
  useResourceViewport()
  const [editor, setEditor] = useState(null)
  const [search, setSearch] =
    useState('')

  const [type, setType] =
    useState('all')

  const [
    generation,
    setGeneration,
  ] = useState('all')

  const [game, setGame] =
    useState('all')

  const [role, setRole] =
    useState('all')

  const [
    shininess,
    setShininess,
  ] = useState('all')

  const [
    selectedPokemon,
    setSelectedPokemon,
  ] = useState(null)

  const filteredPokemon =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return collection
        .filter(
          (pokemon) => {
            const meta =
              getMeta(pokemon)

            if (!meta) {
              return false
            }

            const pokemonRole =
              getRole(
                pokemon,
                designations
              )

            if (
              query &&
              !pokemon.speciesName
                .toLowerCase()
                .startsWith(query) &&
              !pokemon.nickname
                ?.toLowerCase()
                .startsWith(query)
            ) {
              return false
            }

            if (
              type !== 'all' &&
              !meta.types.includes(
                type
              )
            ) {
              return false
            }

            if (
              generation !==
                'all' &&
              meta.generation !==
                Number(
                  generation
                )
            ) {
              return false
            }

            if (
              game !== 'all' &&
              pokemon.originGame !== game
            ) {
              return false
            }

            if (
              role !== 'all' &&
              pokemonRole !==
                role
            ) {
              return false
            }

            if (
              shininess ===
                'shiny' &&
              !pokemon.shiny
            ) {
              return false
            }

            if (
              shininess ===
                'normal' &&
              pokemon.shiny
            ) {
              return false
            }

            return true
          }
        )
        .sort(
          (a, b) => {
            const metaA =
              getMeta(a)

            const metaB =
              getMeta(b)

            if (
              metaA.dex !==
              metaB.dex
            ) {
              return (
                metaA.dex -
                metaB.dex
              )
            }

            const roleA =
              getRole(
                a,
                designations
              )

            const roleB =
              getRole(
                b,
                designations
              )

            const roleDifference =
              ROLE_ORDER[
                roleA
              ] -
              ROLE_ORDER[
                roleB
              ]

            if (
              roleDifference !==
              0
            ) {
              return roleDifference
            }

            return (
              a.personality -
              b.personality
            )
          }
        )
    }, [
      collection,
      designations,
      search,
      type,
      generation,
      game,
      role,
      shininess,
    ])

  function clearFilters() {
    setSearch('')
    setType('all')
    setGeneration('all')
    setGame('all')
    setRole('all')
    setShininess('all')
  }

  return (
    <div className="page pokemon-page collection-database-page">
      {editor && <PokemonEditor pokemon={editor.pokemon} onDelete={pokemon => { onPokemonDelete(pokemon.companionId); setSelectedPokemon(null) }} onClose={() => setEditor(null)} onSave={pokemon => { const saved=onPokemonSave(pokemon); setSelectedPokemon(saved) }} />}
      <header className="collection-header resource-list-heading">
        <div>
          <p className="page-eyebrow">
            YOUR SAVE
          </p>

          <h2>
            My Pokémon
          </h2>

          <p>
            {
              filteredPokemon.length
            }{' '}
            of {collection.length}
          </p>
        </div>
        <button type="button" className="add-pokemon-button" onClick={() => setEditor({ pokemon: null })} aria-label="Add Pokémon" title="Add Pokémon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" /></svg>
        </button>
      </header>

      <section className="pokemon-tools">
        <input
          className="pokemon-search"
          type="search"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
          placeholder="Search name or nickname..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />

        <div className="filter-grid">
          <ResourceFilter label="Type" value={type} onChange={setType} options={emeraldTypes.map(type => ({ value:type, label:type.charAt(0) + type.slice(1).toLowerCase() }))} />

          <ResourceFilter label="Gen" value={generation} onChange={setGeneration} options={[{"value": "1", "label": "Gen I"}, {"value": "2", "label": "Gen II"}, {"value": "3", "label": "Gen III"}]} />

          <ResourceFilter label="Game" value={game} onChange={setGame} options={[{"value": "Ruby", "label": "Ruby"}, {"value": "Sapphire", "label": "Sapphire"}, {"value": "Emerald", "label": "Emerald"}, {"value": "FireRed", "label": "FireRed"}, {"value": "LeafGreen", "label": "LeafGreen"}, {"value": "Colosseum / XD", "label": "Colo / XD"}]} />

          <ResourceFilter label="Role" value={role} onChange={setRole} options={[{"value": "bf", "label": "BF Trained"}, {"value": "utility", "label": "Utility"}, {"value": "pokedex", "label": "Pokédex"}]} />

          <button
            className={`shiny-filter-toggle ${shininess === 'shiny' ? 'active' : ''}`}
            type="button"
            aria-label={shininess === 'shiny' ? 'Show all Pokémon' : 'Show shiny Pokémon only'}
            title={shininess === 'shiny' ? 'Shiny only' : 'All Pokémon'}
            onClick={() =>
              setShininess(
                shininess === 'shiny'
                  ? 'all'
                  : 'shiny'
              )
            }
          >
            {shininess === 'shiny' ? '★' : '☆'}
          </button>
        </div>

        <button
          className="clear-filters"
          onClick={
            clearFilters
          }
        >
          Clear Filters
        </button>
      </section>

      <div className="pokedex-grid collection-database-grid" tabIndex={0} aria-label="My Pokémon collection">
        {filteredPokemon.map(
          (pokemon) => (
            <PokemonTile
              key={
                pokemon.companionId
              }
              pokemon={pokemon}
              onOpen={
                setSelectedPokemon
              }
            />
          )
        )}
      </div>

      {!filteredPokemon.length && (
        <div className="empty-results">
          No results.
        </div>
      )}

      <PokemonDetail
        onDelete={pokemon => { onPokemonDelete(pokemon.companionId); setSelectedPokemon(null) }}
        onEdit={pokemon => setEditor({ pokemon })}
        key={selectedPokemon?.companionId ?? 'closed'}
        pokemon={
          selectedPokemon
        }
        role={
          selectedPokemon
            ? getRole(
                selectedPokemon,
                designations
              )
            : null
        }
        onRoleChange={
          onRoleChange
        }
        onClose={() =>
          setSelectedPokemon(
            null
          )
        }
      />
    </div>
  )
}

function App() {
  const battleLastTap=useRef(null)
  const [
    saveData,
    setSaveData,
  ] = useState(
    loadStoredSave
  )

  const [
    designations,
    setDesignations,
  ] = useState(
    loadDesignations
  )

  const [
    activePage,
    setActivePage,
  ] = useState('home')
  const [resourcesVisit, setResourcesVisit] = useState(0)

  const collection =
    useMemo(
      () =>
        buildCollection(
          saveData
        ),
      [saveData]
    )

  useEffect(() => {
    if (saveData && !saveData.designPreview) {
      localStorage.setItem(
        SAVE_STORAGE_KEY,
        JSON.stringify(
          saveData
        )
      )
    }
  }, [saveData])

  useEffect(() => {
    localStorage.setItem(
      DESIGNATION_STORAGE_KEY,
      JSON.stringify(
        designations
      )
    )
  }, [designations])

  function handleSaveLoaded(
    newSave
  ) {
    setSaveData(newSave)
  }

  function handlePokemonDelete(id) {
    const keep = pokemon => getPokemonId(pokemon) !== id
    setSaveData(current => {
      if (!current) return current
      const partyPokemon = current.party?.pokemon?.filter(keep)
      return { ...current,
        manualPokemon: (current.manualPokemon ?? []).filter(keep),
        party: current.party ? { ...current.party, pokemon: partyPokemon, count: partyPokemon?.length ?? 0 } : current.party,
        pcStorage: current.pcStorage ? { ...current.pcStorage, boxes: current.pcStorage.boxes?.map(box => ({ ...box, pokemon: box.pokemon.filter(keep) })) } : current.pcStorage,
      }
    })
    setDesignations(current => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  function handlePokemonSave(pokemon) {
    const isNew=!pokemon.companionId && !pokemon.manualId
    const id=pokemon.companionId ?? pokemon.manualId ?? createCollectionId()
    pokemon={...pokemon,companionId:id,...(!pokemon.companionId && !pokemon.manualId ? {manualId:id} : {})}
    setSaveData(current => {
      const save = current ?? {}
      const id = pokemon.companionId
      const replace = entry => getPokemonId(entry) === id ? pokemon : entry
      if (isNew) return { ...save, manualPokemon: [...(save.manualPokemon ?? []), pokemon] }
      return { ...save,
        manualPokemon: (save.manualPokemon ?? []).map(replace),
        party: save.party ? { ...save.party, pokemon: save.party.pokemon?.map(replace) } : save.party,
        pcStorage: save.pcStorage ? { ...save.pcStorage, boxes: save.pcStorage.boxes?.map(box => ({ ...box, pokemon: box.pokemon.map(replace) })) } : save.pcStorage,
      }
    })
    return pokemon
  }

  function handleRoleChange(
    pokemonId,
    newRole
  ) {
    setDesignations(
      (current) => ({
        ...current,
        [pokemonId]:
          newRole,
      })
    )
  }


  return (
    <div className="app-shell">
      <main className="app-content">
        {activePage === 'home' && (
          <HomePage
            saveData={saveData ?? {}}
            collection={collection}
            onSaveLoaded={handleSaveLoaded}
          />
        )}

        {activePage === 'pokemon' && (
          <MyPokemonPage
            onPokemonDelete={handlePokemonDelete}
            onPokemonSave={handlePokemonSave}
            collection={collection}
            designations={designations}
            onRoleChange={handleRoleChange}
          />
        )}

        {activePage === 'resources' && (
          <ResourcesPage key={resourcesVisit} collection={collection} />
        )}

        <div
          className={`persistent-page ${activePage === 'battle' ? 'active' : ''}`}
          aria-hidden={activePage !== 'battle'}
        >
          <BattleWorkbench isActive={activePage === 'battle'} collection={collection} designations={designations} getRole={getRole} saveData={saveData??{}} />
        </div>
      </main>

      {createPortal(<NavigationDiagnostics><nav className="bottom-nav home97-nav">
        <button className={activePage === 'home' ? 'active' : ''} onClick={() => setActivePage('home')}><span className="nav-icon nav-home-icon"><HomeIcon kind="home" /></span><span>Home</span></button>
        <button className={activePage === 'pokemon' ? 'active' : ''} onClick={() => setActivePage('pokemon')}><span className="nav-icon nav-pokemon-icon"><HomeIcon kind="pokemon" /></span><span>My Pokémon</span></button>
        <button className={activePage === 'battle' ? 'active' : ''} onClick={event => {setActivePage('battle');const now=event.timeStamp;if(battleLastTap.current!==null&&now-battleLastTap.current<350){battleLastTap.current=null;window.dispatchEvent(new Event('emerald-reset-battle'))}else{battleLastTap.current=now}}} onDoubleClick={event=>event.preventDefault()}><span className="nav-icon nav-battle-icon"><HomeIcon kind="battle" /></span><span>Battle</span></button>
        <button className={activePage === 'resources' ? 'active' : ''} onClick={() => { setResourcesVisit(visit => visit + 1); setActivePage('resources') }}><span className="nav-icon nav-resources-icon"><HomeIcon kind="resources" /></span><span>Resources</span></button>
      </nav></NavigationDiagnostics>, document.body)}
    </div>
  )
}

export default App
