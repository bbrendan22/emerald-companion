import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { emeraldTypes } from './utils/typeMatchups'
import ResourcesPage from './components/ResourcesPage'
import PokemonEditor from './components/PokemonEditor'
import HomeSaveDialog from './components/HomeSaveDialog'
import { Pokeball, FrontierEmblem, HomeIcon, TrainerStatIcon } from './components/HomeArtwork'
import { pokemonMeta } from './data/pokemonMeta'
import { speciesInfo, moveInfo, moveNames, itemNames } from './data/emeraldData'
import { frontierTrainers } from './data/frontierTrainers'
import { frontierPokemon } from './data/frontierPokemon'

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

  const type1 =
    meta.types[0]
      .toLowerCase()

  const type2 =
    meta.types[1]
      ?.toLowerCase()

  const style = {
    '--type-1':
      `var(--type-${type1})`,

    '--type-2':
      `var(--type-${
        type2 ?? type1
      })`,
  }

  return (
    <button
      className={
        pokemon.shiny
          ? 'pokemon-tile shiny-tile'
          : 'pokemon-tile'
      }
      style={style}
      onClick={() =>
        onOpen(pokemon)
      }
    >
      {pokemon.shiny && (
        <span className="tile-shiny">
          ★
        </span>
      )}

      <div className="sprite-wrap">
        <img
          src={spritePath(
            pokemon
          )}
          alt={
            pokemon.speciesName
          }
          draggable="false"
        />
      </div>

      <span className="dex-number">
        #
        {String(
          meta.dex
        ).padStart(3, '0')}
      </span>
    </button>
  )
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

function getPokerusStatus(pokemon) {
  const pokerus =
    Number(pokemon.pokerus ?? 0)

  if (!pokerus) {
    return 'None'
  }

  return (pokerus & 0x0f) > 0
    ? 'Infected'
    : 'Cured'
}

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

const TYPE_CHART = {
  NORMAL: { ROCK: .5, GHOST: 0, STEEL: .5 },
  FIRE: { FIRE: .5, WATER: .5, GRASS: 2, ICE: 2, BUG: 2, ROCK: .5, DRAGON: .5, STEEL: 2 },
  WATER: { FIRE: 2, WATER: .5, GRASS: .5, GROUND: 2, ROCK: 2, DRAGON: .5 },
  ELECTRIC: { WATER: 2, ELECTRIC: .5, GRASS: .5, GROUND: 0, FLYING: 2, DRAGON: .5 },
  GRASS: { FIRE: .5, WATER: 2, GRASS: .5, POISON: .5, GROUND: 2, FLYING: .5, BUG: .5, ROCK: 2, DRAGON: .5, STEEL: .5 },
  ICE: { FIRE: .5, WATER: .5, GRASS: 2, ICE: .5, GROUND: 2, FLYING: 2, DRAGON: 2, STEEL: .5 },
  FIGHTING: { NORMAL: 2, ICE: 2, POISON: .5, FLYING: .5, PSYCHIC: .5, BUG: .5, ROCK: 2, GHOST: 0, DARK: 2, STEEL: 2 },
  POISON: { GRASS: 2, POISON: .5, GROUND: .5, ROCK: .5, GHOST: .5, STEEL: 0 },
  GROUND: { FIRE: 2, ELECTRIC: 2, GRASS: .5, POISON: 2, FLYING: 0, BUG: .5, ROCK: 2, STEEL: 2 },
  FLYING: { ELECTRIC: .5, GRASS: 2, FIGHTING: 2, BUG: 2, ROCK: .5, STEEL: .5 },
  PSYCHIC: { FIGHTING: 2, POISON: 2, PSYCHIC: .5, DARK: 0, STEEL: .5 },
  BUG: { FIRE: .5, GRASS: 2, FIGHTING: .5, POISON: .5, FLYING: .5, PSYCHIC: 2, GHOST: .5, DARK: 2, STEEL: .5 },
  ROCK: { FIRE: 2, ICE: 2, FIGHTING: .5, GROUND: .5, FLYING: 2, BUG: 2, STEEL: .5 },
  GHOST: { NORMAL: 0, PSYCHIC: 2, GHOST: 2, DARK: .5, STEEL: .5 },
  DRAGON: { DRAGON: 2, STEEL: .5 },
  DARK: { FIGHTING: .5, PSYCHIC: 2, GHOST: 2, DARK: .5, STEEL: .5 },
  STEEL: { FIRE: .5, WATER: .5, ELECTRIC: .5, ICE: 2, ROCK: 2, STEEL: .5 },
}

function expForLevel(level, growthRate) {
  const n = level
  switch (growthRate) {
    case 'GROWTH_ERRATIC':
      if (n <= 50) return Math.floor(n ** 3 * (100 - n) / 50)
      if (n <= 68) return Math.floor(n ** 3 * (150 - n) / 100)
      if (n <= 98) return Math.floor(n ** 3 * Math.floor((1911 - 10 * n) / 3) / 500)
      return Math.floor(n ** 3 * (160 - n) / 100)
    case 'GROWTH_FAST':
      return Math.floor(4 * n ** 3 / 5)
    case 'GROWTH_MEDIUM_SLOW':
      return Math.floor(6 * n ** 3 / 5 - 15 * n ** 2 + 100 * n - 140)
    case 'GROWTH_SLOW':
      return Math.floor(5 * n ** 3 / 4)
    case 'GROWTH_FLUCTUATING':
      if (n <= 15) return Math.floor(n ** 3 * (Math.floor((n + 1) / 3) + 24) / 50)
      if (n <= 36) return Math.floor(n ** 3 * (n + 14) / 50)
      return Math.floor(n ** 3 * (Math.floor(n / 2) + 32) / 50)
    default:
      return n ** 3
  }
}

function levelFromExperience(experience, growthRate) {
  if (experience == null) return null
  const exp = Number(experience)
  let level = 1
  for (let candidate = 2; candidate <= 100; candidate++) {
    if (exp >= expForLevel(candidate, growthRate)) level = candidate
    else break
  }
  return level
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

function getTypeMatchups(types) {
  const allTypes = emeraldTypes
  const defense = []
  for (const attacking of allTypes) {
    let mult = 1
    for (const defending of types) mult *= TYPE_CHART[attacking]?.[defending] ?? 1
    if (mult !== 1) defense.push({ type: attacking, multiplier: mult })
  }
  return {
    weak: defense.filter((x) => x.multiplier > 1).sort((a, b) => b.multiplier - a.multiplier),
    advantage: defense.filter((x) => x.multiplier < 1).sort((a, b) => a.multiplier - b.multiplier),
  }
}

function getMoveMaxPp(basePp, ppBonuses, slot) {
  if (basePp == null) return null
  const ups = ppBonuses == null ? 0 : (Number(ppBonuses) >> (slot * 2)) & 0x3
  return Math.floor(Number(basePp) * (5 + ups) / 5)
}

function TypeIcon({ type, compact = false }) {
  const key = String(type || 'NORMAL').toUpperCase()
  const slug = key.toLowerCase()
  return (
    <img
      className={`type-symbol-img ${compact ? 'compact' : ''}`}
      src={`${import.meta.env.BASE_URL}type-icons/${slug}.png`}
      alt={`${key} type`}
    />
  )
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

function RibbonIcon({ ribbon }) {
  const slug=assetSlug(ribbon)
  return <span className="ribbon-icon-wrap" title={ribbon}>
    <img className="official-ribbon-icon"
      src={`https://raw.githubusercontent.com/msikma/pokesprite/master/misc/ribbon/${slug}.png`}
      alt="" onError={(e)=>{e.currentTarget.style.display='none';e.currentTarget.nextElementSibling.style.display='grid'}} />
    <span className="ribbon-fallback">★</span>
  </span>
}

function DeletePokemonConfirmation({ pokemon, onConfirm, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} className="pokemon-editor pokemon-delete-confirm" aria-labelledby="delete-pokemon-title" onCancel={onClose}>
    <h2 id="delete-pokemon-title">Delete {pokemon.nickname || pokemon.speciesName}?</h2>
    <p>This removes the Pokémon from your tracked collection and cannot be undone. Your original save file and Pokédex caught count stay unchanged.</p>
    <footer><button onClick={onClose} autoFocus>Cancel</button><button className="pokemon-delete-button" onClick={onConfirm}>Delete</button></footer>
  </dialog>
}

function PokemonDetail({
  onDelete,
  onEdit,
  pokemon,
  role,
  onRoleChange,
  onClose,
}) {
  const [detailTab, setDetailTab] = useState('summary')
  const [confirmDelete, setConfirmDelete] = useState(false)

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
  const nickname = pokemon.nickname && pokemon.nickname !== pokemon.speciesName ? pokemon.nickname : null
  const hiddenPower = getHiddenPower(pokemon.ivs)
  const ivTotal = sumStats(pokemon.ivs)
  const evTotal = sumStats(pokemon.evs)
  const matchups = getTypeMatchups(meta.types)
  const genderMark = pokemon.gender === 'Male' ? '♂' : pokemon.gender === 'Female' ? '♀' : ''
  const genderClass = pokemon.gender === 'Male' ? 'male' : pokemon.gender === 'Female' ? 'female' : ''
  const heldItem = !pokemon.heldItem ? 'None' : (itemNames?.[pokemon.heldItem] || pokemon.heldItemName || `Item ${pokemon.heldItem}`)
  const pokerusStatus = getPokerusStatus(pokemon)

  const statRows = [
    ['HP', current.maxHp != null ? `${current.hp ?? current.maxHp}` : current.hp, 'hp'],
    ['Attack', current.attack, 'attack'],
    ['Defense', current.defense, 'defense'],
    ['Sp. Atk', current.spAttack, 'spattack'],
    ['Sp. Def', current.spDefense, 'spdefense'],
    ['Speed', current.speed, 'speed'],
  ]
  const statKeysForBars = [
    ['hp','hp'],['attack','attack'],['defense','defense'],
    ['spattack','spAttack'],['spdefense','spDefense'],['speed','speed'],
  ]
  const allSpeciesBaseMax = Object.fromEntries(statKeysForBars.map(([barKey,statKey]) => {
    const vals = Object.values(speciesInfo || {}).map(s => Number(s?.baseStats?.[statKey] ?? 0))
    return [barKey, Math.max(1,...vals)]
  }))
  const currentBaseForBar = {
    hp:Number(base?.hp ?? 0), attack:Number(base?.attack ?? 0), defense:Number(base?.defense ?? 0),
    spattack:Number(base?.spAttack ?? 0), spdefense:Number(base?.spDefense ?? 0), speed:Number(base?.speed ?? 0),
  }
  const statKeys = [['HP','hp'],['Atk','attack'],['Def','defense'],['SpA','spAttack'],['SpD','spDefense'],['Spe','speed']]

  const expNow = Number(pokemon.experience ?? 0)
  const nextLevelExp = level && level < 100 ? expForLevel(level + 1, profile?.growthRate) : expNow
  const thisLevelExp = level ? expForLevel(level, profile?.growthRate) : 0
  const expRemaining = Math.max(0, nextLevelExp - expNow)
  const expPct = nextLevelExp > thisLevelExp ? Math.max(0, Math.min(100, ((expNow - thisLevelExp) / (nextLevelExp - thisLevelExp)) * 100)) : 100

  const resists = matchups.advantage.filter(x => x.multiplier > 0)
  const immune = matchups.advantage.filter(x => x.multiplier === 0)

  return (
    <div className="detail-overlay exact-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      {confirmDelete && <DeletePokemonConfirmation pokemon={pokemon} onClose={() => setConfirmDelete(false)} onConfirm={() => onDelete(pokemon)} />}
      <div className="detail-sheet exact-sheet">
        <div className="pokemon-detail-actions">
          <button className="pokemon-edit-button" onClick={() => onEdit(pokemon)}>Edit</button>
          <button className="pokemon-edit-button pokemon-delete-button" onClick={() => setConfirmDelete(true)}>Delete</button>
        </div>
        <button className="exact-close" onClick={onClose} aria-label="Close">×</button>

        <header className="exact-hero">
          <div className="exact-pokeball" aria-hidden="true"><i /></div>
          <div className="sprite-stage">
            <img src={artworkSpritePath(pokemon)} alt={pokemon.speciesName} />
            {pokemon.pokeBall && (
              <img
                className="capture-ball-corner"
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${pokemon.pokeBall === 'Poké Ball' ? 'poke-ball' : assetSlug(pokemon.pokeBall)}.png`}
                alt=""
                title={pokemon.pokeBall}
              />
            )}
            {pokemon.shiny && <span className="shiny-star">★</span>}
          </div>
          <div className="exact-name-line">
            <h2>{pokemon.speciesName}</h2>
            {genderMark && <span className={`gender-mark ${genderClass}`}>{genderMark}</span>}
          </div>
          {nickname && <div className="exact-nickname">“{nickname}”</div>}
          <div className="exact-dex">#{String(meta.dex).padStart(3,'0')}
          {pokemon.otName && (
            <div className="exact-ot-name">
              OT {pokemon.otName}{pokemon.originGame && pokemon.originGame !== 'Unknown' ? ` · ${pokemon.originGame.toUpperCase()}` : ''}
            </div>
          )}</div>
          <div className="exact-types">
            {meta.types.map(type => <span className={`exact-type type-${type.toLowerCase()}`} key={type}><TypeIcon type={type} compact />{type}</span>)}
          </div>
        </header>

        <div className="exact-tabs">
          <button className={detailTab === 'summary' ? 'active' : ''} onClick={() => setDetailTab('summary')}>Summary</button>
          <button className={detailTab === 'advanced' ? 'active' : ''} onClick={() => setDetailTab('advanced')}>Advanced</button>
        </div>

        {detailTab === 'summary' ? (
          <div className="exact-page summary-page">
            <div className="summary-top">
              <section className="exact-card info-card">
                <h3>Pokémon Info</h3>
                <div className="exact-info-row"><span>Level</span><b>{level ?? '—'}</b></div>
                <div className="exact-info-row"><span>Nature</span><b>{pokemon.nature || '—'}</b></div>
                <div className="exact-info-row"><span>Ability</span><b>{pokemon.ability || '—'}</b></div>
                <div className="exact-info-row"><span>Held Item</span><b>{heldItem}<ItemIcon name={heldItem} /></b></div>
              </section>
              <section className="exact-card role-card">
                <h3>Role</h3>
                <div className="exact-role-buttons">
                  {ROLES.map(item => <button key={item.id} className={role === item.id ? 'active' : ''} onClick={() => onRoleChange(pokemon.companionId,item.id)}>{item.label}</button>)}
                </div>
              </section>
            </div>

            <section className="exact-card stats-card">
              <h3>Current Stats</h3>
              <div className="exact-stats">
                {statRows.map(([label,value,key]) => <div className="exact-stat-row" key={key}>
                  <span>{label}</span><b>{value ?? '—'}</b>
                  <div className="exact-stat-track"><i className={`exact-stat-fill ${key}`} style={{width:`${Math.max(8,Math.min(100,(currentBaseForBar[key]/(allSpeciesBaseMax[key] || 1))*100))}%`}} /></div>
                </div>)}
              </div>
            </section>

            <section className="exact-card moves-card">
              <h3>Moves</h3>
              <div className="exact-moves">
                {(pokemon.moves || []).map((move,index) => {
                  const info = moveInfo?.[move.id] ?? {}
                  const type = info.type ?? move.type ?? 'NORMAL'
                  const maxPp = getMoveMaxPp(info.pp ?? move.maxPp, pokemon.ppBonuses, index)
                  return <div className={`exact-move type-border-${String(type).toLowerCase()}`} key={`${move.id}-${index}`}>
                    <TypeIcon type={type} />
                    <div><b>{move.name}</b><span>PP {maxPp ?? '—'}</span></div>
                  </div>
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="exact-page advanced-page">
            <div className="advanced-top-row">
              <section className="exact-card advanced-stat-card">
                <h3>IVs</h3>
                <div className="exact-six">{statKeys.map(([label,key]) => {
                  const v=pokemon.ivs?.[key]
                  return <div key={key}><span>{label}</span><b className={v===31?'perfect':v===30?'near-perfect':''}>{v ?? '—'}</b></div>
                })}</div>
                <div className="exact-total">Total: <b>{ivTotal ?? '—'} / 186</b></div>
              </section>
              <section className="exact-card advanced-stat-card">
                <h3>EVs</h3>
                <div className="exact-six">{statKeys.map(([label,key]) => <div key={key}><span>{label}</span><b>{pokemon.evs?.[key] ?? '—'}</b></div>)}</div>
                <div className="exact-total">Total: <b>{evTotal ?? '—'} / 510</b></div>
              </section>
            </div>

            <div className="advanced-second-row">
              <section className="exact-card base-card">
                <h3>Base Stats (Species)</h3>
                <div className="exact-six">{statKeys.map(([label,key]) => <div key={key}><span>{label}</span><b>{base?.[key] ?? '—'}</b></div>)}</div>
              </section>
              <section className="exact-card hidden-card">
                <h3>Hidden Power</h3>
                <div className={`hidden-type type-${String(hiddenPower?.type || 'normal').toLowerCase()}`}><TypeIcon type={hiddenPower?.type || 'NORMAL'} compact />{hiddenPower?.type || '—'}</div>
                <div>Power: <b>{hiddenPower?.power ?? '—'}</b></div>
              </section>
            </div>

            <div className="advanced-third-row">
              <section className="exact-card experience-card">
                <h3>Experience</h3>
                <div className="exp-copy"><span>Current: <b>{expNow.toLocaleString()}</b><br/>Next Lv.: <b>{expRemaining.toLocaleString()}</b></span><b>Lv. {level ?? '—'}</b></div>
                <div className="exp-track"><i style={{width:`${expPct}%`}} /></div>
              </section>
              <section className="exact-card friendship-card"><h3>Friendship</h3><svg className="friendship-heart" viewBox="0 0 24 24" aria-label="Friendship" role="img">
  <path d="M12 21s-8-4.7-8-11a4.8 4.8 0 0 1 8-3.6A4.8 4.8 0 0 1 20 10c0 6.3-8 11-8 11Z" />
</svg><b>{pokemon.friendship ?? '—'}</b></section>
              <section className="exact-card pokerus-card"><h3>Pokérus</h3><span className="pkrs-badge">PkRS</span><b>{pokerusStatus}</b></section>
            </div>

            <section className="exact-card matchups-card">
              <h3>Type Matchups (Defensive)</h3>
              <div className="matchup-three matchup-fixed">
                {[
                  ['Weak to', matchups.weak, 4],
                  ['Resists', resists, 6],
                  ['Immune', immune, 2],
                ].map(([label, items, maxCols]) => {
                  const cols = Math.max(1, items.length <= maxCols ? (items.length || 1) : Math.ceil(items.length / 2))
                  const rows = Math.max(1, Math.ceil(items.length / maxCols))
                  return <div key={label} className="matchup-group">
                    <b>{label}</b>
                    <div
                      className="matchup-icons matchup-icons-fixed"
                      style={{
                        '--match-cols': cols,
                        '--match-rows': rows,
                      }}
                    >
                      {items.length ? items.map(x =>
                        <span key={x.type}>
                          <TypeIcon type={x.type}/>
                          <small>{label === 'Immune' ? '0' : x.multiplier === 0.5 ? '1/2' : x.multiplier === 0.25 ? '1/4' : x.multiplier}×</small>
                        </span>
                      ) : <em>—</em>}
                    </div>
                  </div>
                })}
              </div>
            </section>

            <section className="exact-card exact-ribbons">
              <h3>Ribbons</h3>
              <div className={`ribbon-list ribbon-count-${pokemon.ribbons?.length || 0}`}>{pokemon.ribbons?.length ? pokemon.ribbons.map((r,index)=><RibbonIcon ribbon={r} key={`${r}-${index}`} />) : <small>No ribbons yet</small>}</div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function SelectFilter({
  label,
  value,
  onChange,
  children,
}) {
  return (
    <label className="filter-select">
      <span>{label}</span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        {children}
      </select>
    </label>
  )
}

function MyPokemonPage({
  onPokemonDelete,
  onPokemonSave,
  collection,
  designations,
  onRoleChange,
}) {
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
    <div className="page pokemon-page">
      {editor && <PokemonEditor pokemon={editor.pokemon} onClose={() => setEditor(null)} onSave={pokemon => { onPokemonSave(pokemon); if (editor.pokemon) setSelectedPokemon(null) }} />}
      <header className="collection-header">
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
          <SelectFilter
            label="TYPE"
            value={type}
            onChange={
              setType
            }
          >
            <option value="all">
              All Types
            </option>

            {emeraldTypes.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </SelectFilter>

          <SelectFilter
            label="GENERATION"
            value={
              generation
            }
            onChange={
              setGeneration
            }
          >
            <option value="all">
              All Generations
            </option>

            <option value="1">
              Gen I
            </option>

            <option value="2">
              Gen II
            </option>

            <option value="3">
              Gen III
            </option>
          </SelectFilter>

          <SelectFilter
            label="GAME"
            value={game}
            onChange={setGame}
          >
            <option value="all">All Games</option>
            <option value="Ruby">Ruby</option>
            <option value="Sapphire">Sapphire</option>
            <option value="Emerald">Emerald</option>
            <option value="FireRed">FireRed</option>
            <option value="LeafGreen">LeafGreen</option>
            <option value="Colosseum / XD">Colosseum / XD</option>
          </SelectFilter>

          <SelectFilter
            label="ROLE"
            value={role}
            onChange={
              setRole
            }
          >
            <option value="all">
              All Roles
            </option>

            <option value="bf">
              BF Trained
            </option>

            <option value="utility">
              Utility
            </option>

            <option value="pokedex">
              Pokédex
            </option>
          </SelectFilter>

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

      <div className="pokedex-grid">
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

const DUPLICATE_MOVE_CLASSES = [
  'duplicate-move-1',
  'duplicate-move-2',
  'duplicate-move-3',
  'duplicate-move-4',
  'duplicate-move-5',
  'duplicate-move-6',
]

function getDuplicateMoveColors(pokemonSets) {
  const moveCounts = new Map()

  pokemonSets.forEach((pokemon) => {
    pokemon.moves.forEach((move) => {
      moveCounts.set(move, (moveCounts.get(move) || 0) + 1)
    })
  })

  const duplicateMoves = new Map()
  let duplicateIndex = 0

  moveCounts.forEach((count, move) => {
    if (count > 1) {
      duplicateMoves.set(
        move,
        DUPLICATE_MOVE_CLASSES[
          duplicateIndex % DUPLICATE_MOVE_CLASSES.length
        ]
      )
      duplicateIndex += 1
    }
  })

  return duplicateMoves
}

const BATTLE_SETTINGS_KEY = 'emerald-companion-battle-settings-v1'

function loadBattleSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(BATTLE_SETTINGS_KEY) || '{}')
    return {
      level: saved.level === 100 ? 100 : 50,
      facility: saved.facility === 'Dome' ? 'Dome' : 'Tower',
      format: saved.format === 'Doubles' ? 'Doubles' : 'Singles',
      streak: 0,
    }
  } catch {
    return { level: 50, facility: 'Tower', format: 'Singles', streak: 0 }
  }
}

function formatMatchupEvs(evs, frontier = false) {
  if (!evs) return '0 EVs'

  const rows = frontier
    ? [
        ['HP', 'hp'], ['Atk', 'atk'], ['Def', 'def'],
        ['SpA', 'spa'], ['SpD', 'spd'], ['Spe', 'spe'],
      ]
    : [
        ['HP', 'hp'], ['Atk', 'attack'], ['Def', 'defense'],
        ['SpA', 'spAttack'], ['SpD', 'spDefense'], ['Spe', 'speed'],
      ]

  const active = rows
    .map(([label, key]) => [label, Number(evs[key] ?? 0)])
    .filter(([, value]) => value > 0)

  if (!active.length) return '0 EVs'
  return active.map(([label, value]) => `${label} ${value}`).join(' · ')
}

function getBattleTypeMatchupRows(types) {
  if (!types?.length) return []
  const matchups = getTypeMatchups(types)
  const rows = new Map()

  ;[...matchups.weak, ...matchups.advantage].forEach(({ type, multiplier }) => {
    if (!rows.has(multiplier)) rows.set(multiplier, [])
    rows.get(multiplier).push(type)
  })

  return [4, 2, 0.5, 0.25, 0]
    .filter((multiplier) => rows.has(multiplier))
    .map((multiplier) => ({ multiplier, types: rows.get(multiplier) }))
}

function formatBattleMultiplier(multiplier) {
  if (multiplier === 0.5) return '½×'
  if (multiplier === 0.25) return '¼×'
  return `${multiplier}×`
}

function MatchupTypeAdvantages({ types }) {
  const rows = getBattleTypeMatchupRows(types)
  if (!rows.length) return null

  return (
    <div className="matchup-type-advantages">
      {rows.map(({ multiplier, types: rowTypes }) => (
        <div className="matchup-type-advantage-row" key={multiplier}>
          <span className={`matchup-multiplier matchup-multiplier-${String(multiplier).replace('.', '-')}`}>
            {formatBattleMultiplier(multiplier)}
          </span>
          <div className="matchup-advantage-icons">
            {rowTypes.map((type) => (
              <TypeIcon type={type} compact key={`${multiplier}-${type}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function getFrontierMoveInfo(moveName) {
  const normalize = (value) =>
    String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  const wanted = normalize(moveName)
  const moveId = Object.entries(moveNames || {}).find(
    ([, name]) => normalize(name) === wanted
  )?.[0]

  return moveId != null ? moveInfo?.[moveId] ?? null : null
}

function getMatchupCurrentStats(pokemon) {
  if (!pokemon) return null
  const profile = speciesInfo?.[pokemon.species] ?? null
  const level =
    pokemon.level ??
    levelFromExperience(pokemon.experience, profile?.growthRate)
  const calculated = calculateStats(pokemon, profile, level)
  const live = getCurrentStats(pokemon)

  return {
    hp: live.maxHp ?? calculated?.maxHp ?? live.hp ?? calculated?.hp ?? null,
    attack: live.attack ?? calculated?.attack ?? null,
    defense: live.defense ?? calculated?.defense ?? null,
    spAttack: live.spAttack ?? calculated?.spAttack ?? null,
    spDefense: live.spDefense ?? calculated?.spDefense ?? null,
    speed: live.speed ?? calculated?.speed ?? null,
  }
}

function calculateFrontierMatchupStats(pokemon, level, iv) {
  if (!pokemon) return null

  const metaEntry = Object.entries(pokemonMeta).find(
    ([, entry]) =>
      entry.name.toLowerCase() === pokemon.species.toLowerCase()
  )
  const speciesId = metaEntry?.[0]
  const profile = speciesId ? speciesInfo?.[speciesId] : null
  const base = profile?.baseStats
  if (!base) return null

  const evs = pokemon.evs || {}
  const frontierEv = (key) => Number(evs[key] ?? 0)
  const core = (baseStat, evKey) =>
    Math.floor(
      ((2 * Number(baseStat ?? 0) +
        Number(iv) +
        Math.floor(frontierEv(evKey) / 4)) *
        Number(level)) /
        100
    )

  const hp =
    pokemon.species === 'Shedinja'
      ? 1
      : core(base.hp, 'hp') + Number(level) + 10

  const stat = (baseStat, evKey, natureKey) =>
    Math.floor(
      (core(baseStat, evKey) + 5) *
        natureMultiplier(pokemon.nature, natureKey)
    )

  return {
    hp,
    attack: stat(base.attack, 'atk', 'attack'),
    defense: stat(base.defense, 'def', 'defense'),
    spAttack: stat(base.spAttack, 'spa', 'spAttack'),
    spDefense: stat(base.spDefense, 'spd', 'spDefense'),
    speed: stat(base.speed, 'spe', 'speed'),
  }
}

function BattlePage({ collection, designations }) {
  const [battleSettings, setBattleSettings] = useState(loadBattleSettings)
  const [trainerSearch, setTrainerSearch] = useState('')
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [opponentSearch, setOpponentSearch] = useState('')
  const [hiddenOpponentSetIds, setHiddenOpponentSetIds] = useState(new Set())
  const [myTeam, setMyTeam] = useState([])
  const [opponentTeam, setOpponentTeam] = useState([])
  const [activeMySlot, setActiveMySlot] = useState(null)
  const [activeOpponentSlot, setActiveOpponentSlot] = useState(null)
  const [matchupMyPokemon, setMatchupMyPokemon] = useState(null)
  const [matchupOpponentPokemon, setMatchupOpponentPokemon] = useState(null)

  const teamSize = battleSettings.format === 'Doubles' ? 4 : 3

  const battleFrontierPokemon = useMemo(() => {
    const selectedSpecies = new Set(
      myTeam
        .filter(Boolean)
        .map((pokemon) => pokemon.species)
    )

    return collection
      .filter(
        (pokemon) =>
          getRole(pokemon, designations) === 'bf' &&
          !selectedSpecies.has(pokemon.species)
      )
      .sort((a, b) => {
        const aDex = pokemonMeta[a.species]?.dex ?? 999
        const bDex = pokemonMeta[b.species]?.dex ?? 999
        return aDex - bDex
      })
  }, [collection, designations, myTeam])

  function frontierSpritePath(pokemon) {
    const meta = Object.values(pokemonMeta).find(
      (entry) => entry.name.toLowerCase() === pokemon.species.toLowerCase()
    )
    return meta
      ? `${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`
      : ''
  }

  function frontierArtworkSpritePath(pokemon) {
    const meta = Object.values(pokemonMeta).find(
      (entry) => entry.name.toLowerCase() === pokemon.species.toLowerCase()
    )
    return meta
      ? `${import.meta.env.BASE_URL}sprites/artwork/normal/${meta.dex}.png`
      : ''
  }

  const trainerMatches = useMemo(() => {
    const query = trainerSearch.trim().toLowerCase()

    if (!query) {
      return []
    }

    return frontierTrainers.filter((trainer) =>
      trainer.name.toLowerCase().startsWith(query)
    )
  }, [trainerSearch])

  const availableOpponentSets = useMemo(() => {
    if (!selectedTrainer) {
      return frontierPokemon
    }

    const allowedSetIds = new Set(selectedTrainer.pokemonSetIds)

    return frontierPokemon.filter((pokemon) =>
      allowedSetIds.has(pokemon.id)
    )
  }, [selectedTrainer])

  const opponentMatches = useMemo(() => {
    const query = opponentSearch.trim().toLowerCase()

    if (!query) {
      return []
    }

    const selectedSpecies = new Set(
      opponentTeam
        .filter(Boolean)
        .map((pokemon) => pokemon.species.toLowerCase())
    )

    return availableOpponentSets.filter((pokemon) =>
      pokemon.species.toLowerCase().startsWith(query) &&
      !selectedSpecies.has(pokemon.species.toLowerCase()) &&
      !hiddenOpponentSetIds.has(pokemon.id)
    )
  }, [
    availableOpponentSets,
    opponentSearch,
    hiddenOpponentSetIds,
    opponentTeam,
  ])

  const duplicateMoveColors = useMemo(
    () => getDuplicateMoveColors(opponentMatches),
    [opponentMatches]
  )

  function chooseTrainer(trainer) {
    setSelectedTrainer(trainer)
    setTrainerSearch(trainer.name)
    setOpponentSearch('')
    setHiddenOpponentSetIds(new Set())
  }

  function clearTrainer() {
    setSelectedTrainer(null)
    setTrainerSearch('')
    setOpponentSearch('')
    setHiddenOpponentSetIds(new Set())
  }

  function chooseOpponent(pokemon) {
    if (activeOpponentSlot === null) return

    setOpponentTeam((current) => {
      const next = [...current]
      next[activeOpponentSlot] = pokemon
      return next
    })
    setOpponentSearch('')
    setHiddenOpponentSetIds(new Set())
    setActiveOpponentSlot(null)
  }

  function chooseMyPokemon(pokemon) {
    if (activeMySlot === null) return

    setMyTeam((current) => {
      const next = [...current]
      next[activeMySlot] = pokemon
      return next
    })
    setActiveMySlot(null)
  }

  function removeMyPokemon(index) {
    setMyTeam((current) => {
      const removed = current[index]
      const next = [...current]
      next[index] = null

      if (
        removed &&
        matchupMyPokemon &&
        removed.companionId === matchupMyPokemon.companionId
      ) {
        setMatchupMyPokemon(null)
      }

      return next
    })
  }

  function removeOpponentPokemon(index) {
    setOpponentTeam((current) => {
      const removed = current[index]
      const next = [...current]
      next[index] = null

      if (
        removed &&
        matchupOpponentPokemon &&
        removed.id === matchupOpponentPokemon.id
      ) {
        setMatchupOpponentPokemon(null)
      }

      return next
    })
  }

  function closeOpponentPicker() {
    setActiveOpponentSlot(null)
    setOpponentSearch('')
    setHiddenOpponentSetIds(new Set())
  }

  function hideOpponentSet(event, pokemonId) {
    event.stopPropagation()
    setHiddenOpponentSetIds((current) => {
      const next = new Set(current)
      next.add(pokemonId)
      return next
    })
  }

  useEffect(() => {
    const { level, facility, format } = battleSettings
    const persistentSettings = { level, facility, format }
    localStorage.setItem(
      BATTLE_SETTINGS_KEY,
      JSON.stringify(persistentSettings)
    )
  }, [battleSettings])

  function updateBattleSetting(key, value) {
    if (key === 'format' && value !== battleSettings.format) {
      const nextTeamSize = value === 'Doubles' ? 4 : 3
      setMyTeam((current) => current.slice(0, nextTeamSize))
      setOpponentTeam((current) => current.slice(0, nextTeamSize))
      setActiveMySlot(null)
      setActiveOpponentSlot(null)
    }

    setBattleSettings((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function changeStreak(amount) {
    setBattleSettings((current) => ({
      ...current,
      streak: Math.max(0, current.streak + amount),
    }))
  }

  const matchupMyStats = getMatchupCurrentStats(matchupMyPokemon)
  const matchupMyLevel = matchupMyPokemon
    ? matchupMyPokemon.level ??
      levelFromExperience(
        matchupMyPokemon.experience,
        speciesInfo?.[matchupMyPokemon.species]?.growthRate
      )
    : null
  const opponentIv =
    battleSettings.facility === 'Dome'
      ? 3
      : selectedTrainer
        ? Number(selectedTrainer.ivs ?? 31)
        : 31
  const matchupOpponentStats = calculateFrontierMatchupStats(
    matchupOpponentPokemon,
    battleSettings.level,
    opponentIv
  )
  const matchupMyTypes = matchupMyPokemon
    ? getMeta(matchupMyPokemon)?.types || []
    : []
  const matchupOpponentTypes = matchupOpponentPokemon
    ? Object.values(pokemonMeta).find(
        (entry) =>
          entry.name.toLowerCase() ===
          matchupOpponentPokemon.species.toLowerCase()
      )?.types || []
    : []

  const matchupSpeedWinner =
    matchupMyStats?.speed != null && matchupOpponentStats?.speed != null
      ? matchupMyStats.speed > matchupOpponentStats.speed
        ? 'my'
        : matchupOpponentStats.speed > matchupMyStats.speed
          ? 'opponent'
          : null
      : null

  return (
    <div className="page battle-page">
      <section className="battle-control-row">
        <div className="battle-toggle-group">
          <button
            className={`battle-toggle ${battleSettings.level === 50 ? 'active' : ''}`}
            type="button"
            onClick={() => updateBattleSetting('level', 50)}
          >
            Lvl 50
          </button>
          <button
            className={`battle-toggle ${battleSettings.level === 100 ? 'active' : ''}`}
            type="button"
            onClick={() => updateBattleSetting('level', 100)}
          >
            Lvl 100
          </button>
        </div>

        <div className="battle-toggle-group">
          <button
            className={`battle-toggle ${battleSettings.facility === 'Tower' ? 'active' : ''}`}
            type="button"
            onClick={() => updateBattleSetting('facility', 'Tower')}
          >
            Tower
          </button>
          <button
            className={`battle-toggle ${battleSettings.facility === 'Dome' ? 'active' : ''}`}
            type="button"
            onClick={() => updateBattleSetting('facility', 'Dome')}
          >
            Dome
          </button>
        </div>

        <div className="battle-toggle-group">
          <button
            className={`battle-toggle ${battleSettings.format === 'Singles' ? 'active' : ''}`}
            type="button"
            onClick={() => updateBattleSetting('format', 'Singles')}
          >
            Singles
          </button>
          <button
            className={`battle-toggle ${battleSettings.format === 'Doubles' ? 'active' : ''}`}
            type="button"
            onClick={() => updateBattleSetting('format', 'Doubles')}
          >
            Doubles
          </button>
        </div>

        <div className="streak-control">
          <span className="streak-label">Current Streak</span>
          <div className="streak-stepper">
            <button
              type="button"
              aria-label="Decrease current streak"
              onClick={() => changeStreak(-1)}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={battleSettings.streak}
              onChange={(event) => {
                const value = Math.max(
                  0,
                  Math.floor(Number(event.target.value) || 0)
                )
                updateBattleSetting('streak', value)
              }}
            />
            <button
              type="button"
              aria-label="Increase current streak"
              onClick={() => changeStreak(1)}
            >
              +
            </button>
          </div>
        </div>
      </section>

      <section className="battle-searches">
        <div className="trainer-search-wrap">
          <input
            className="pokemon-search trainer-search battle-search-input"
            type="search"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            placeholder="Trainer"
            value={trainerSearch}
            autoComplete="off"
            onChange={(event) => {
              setTrainerSearch(event.target.value)
              setSelectedTrainer(null)
              setOpponentSearch('')
            }}
          />

          {selectedTrainer && (
            <button
              className="battle-search-clear"
              type="button"
              aria-label="Clear selected trainer"
              onClick={clearTrainer}
            >
              ×
            </button>
          )}

          {trainerSearch.trim() && !selectedTrainer && (
            <div className="trainer-search-popup">
              {trainerMatches.length ? (
                trainerMatches.map((trainer) => (
                  <button
                    className="trainer-search-result"
                    type="button"
                    key={`${trainer.name}-${trainer.trainerClass}`}
                    onClick={() => chooseTrainer(trainer)}
                  >
                    <span className="trainer-result-main">
                      <strong>{trainer.name}</strong>
                      <span>{trainer.trainerClass}</span>
                    </span>

                    <span className="trainer-result-count">
                      {trainer.pokemonSetIds.length} Pokémon
                    </span>
                  </button>
                ))
              ) : (
                <div className="trainer-search-empty">
                  No results.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="battle-team-row">
          <div className="battle-team-side">
            <span className="battle-team-label">My Team</span>
            <div className="battle-team-slots">
              {Array.from({ length: teamSize }).map((_, index) => {
                const pokemon = myTeam[index]

                return (
                  <div className="battle-slot-wrap" key={`my-${index}`}>
                    <button
                      className={`battle-pokemon-slot ${pokemon ? 'filled' : ''}`}
                      type="button"
                      aria-label={pokemon ? pokemon.speciesName : `Add my Pokémon ${index + 1}`}
                      onClick={() => {
                        if (pokemon) {
                          setMatchupMyPokemon(pokemon)
                        } else {
                          setActiveMySlot(index)
                        }
                      }}
                      onDoubleClick={(event) => {
                        if (!pokemon) return
                        event.preventDefault()
                        removeMyPokemon(index)
                      }}
                    >
                      {pokemon ? (
                        <img src={spritePath(pokemon)} alt={pokemon.speciesName} />
                      ) : (
                        '+'
                      )}
                    </button>

                  </div>
                )
              })}
            </div>
          </div>

          <div className="battle-team-divider" />

          <div className="battle-team-side">
            <span className="battle-team-label">Opponent</span>
            <div className="battle-team-slots">
              {Array.from({ length: teamSize }).map((_, index) => {
                const pokemon = opponentTeam[index]

                return (
                  <div className="battle-slot-wrap" key={`opponent-${index}`}>
                    <button
                      className={`battle-pokemon-slot ${pokemon ? 'filled' : ''}`}
                      type="button"
                      aria-label={pokemon ? `${pokemon.species} ${pokemon.instance}` : `Add opponent Pokémon ${index + 1}`}
                      onClick={() => {
                        if (pokemon) {
                          setMatchupOpponentPokemon(pokemon)
                        } else {
                          setActiveOpponentSlot(index)
                          setOpponentSearch('')
                          setHiddenOpponentSetIds(new Set())
                        }
                      }}
                      onDoubleClick={(event) => {
                        if (!pokemon) return
                        event.preventDefault()
                        removeOpponentPokemon(index)
                      }}
                    >
                      {pokemon ? (
                        <img src={frontierSpritePath(pokemon)} alt={pokemon.species} />
                      ) : (
                        '+'
                      )}
                    </button>

                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {activeMySlot !== null && (
          <div className="battle-picker-backdrop" onClick={() => setActiveMySlot(null)}>
            <div className="battle-picker my-pokemon-picker" onClick={(event) => event.stopPropagation()}>
              <div className="battle-picker-title">
                <strong>My Battle Frontier Pokémon</strong>
                <button type="button" onClick={() => setActiveMySlot(null)}>×</button>
              </div>

              <div className="my-picker-grid">
                {battleFrontierPokemon.length ? (
                  battleFrontierPokemon.map((pokemon) => (
                    <button
                      className="my-picker-pokemon"
                      type="button"
                      key={pokemon.companionId}
                      onClick={() => chooseMyPokemon(pokemon)}
                    >
                      <img src={spritePath(pokemon)} alt={pokemon.speciesName} />
                      <span>{pokemon.nickname || pokemon.speciesName}</span>
                    </button>
                  ))
                ) : (
                  <div className="trainer-search-empty">No BF Trained Pokémon</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeOpponentSlot !== null && (
          <div className="battle-picker-backdrop" onClick={closeOpponentPicker}>
            <div className="battle-picker opponent-picker" onClick={(event) => event.stopPropagation()}>
              <div className="battle-picker-title">
                <strong>Opponent Pokémon</strong>
                <button type="button" onClick={closeOpponentPicker}>×</button>
              </div>

              <div className="opponent-search-wrap picker-search-wrap">
                <input
                  className="pokemon-search opponent-search battle-search-input"
                  type="search"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
                  placeholder={
                    selectedTrainer
                      ? `Search ${selectedTrainer.name}'s Pokémon...`
                      : 'Search all Frontier Pokémon...'
                  }
                  value={opponentSearch}
                  autoComplete="off"
                  autoFocus
                  onChange={(event) => {
                    setOpponentSearch(event.target.value)
                    setHiddenOpponentSetIds(new Set())
                  }}
                />

                {opponentSearch.trim() && (
                  <div className="opponent-search-popup picker-results">
                    {opponentMatches.length ? (
                      opponentMatches.map((pokemon) => (
                        <div
                          className="opponent-search-result"
                          role="button"
                          tabIndex="0"
                          key={pokemon.id}
                          onClick={() => chooseOpponent(pokemon)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') chooseOpponent(pokemon)
                          }}
                        >
                          <span className="opponent-result-name">
                            {pokemon.species} {pokemon.instance}
                          </span>

                          <span className="opponent-result-item">
                            {pokemon.item || 'No Item'}
                          </span>

                          <span className="opponent-result-moves">
                            {pokemon.moves.map((move, moveIndex) => {
                              const duplicateClass =
                                duplicateMoveColors.get(move) || ''

                              return (
                                <span
                                  className={`opponent-move ${duplicateClass}`}
                                  key={`${pokemon.id}-${move}-${moveIndex}`}
                                >
                                  {move}
                                </span>
                              )
                            })}
                          </span>

                          <button
                            className="opponent-result-dismiss"
                            type="button"
                            aria-label={`Temporarily hide ${pokemon.species} ${pokemon.instance}`}
                            onClick={(event) => hideOpponentSet(event, pokemon.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="trainer-search-empty">No results.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <h3 className="matchup-header">Matchup</h3>

      <section className="matchup-section">
        <div className="matchup-side matchup-my-side">
          {matchupMyPokemon ? (
            <>
              <img
                className="matchup-sprite"
                src={artworkSpritePath(matchupMyPokemon)}
                alt={matchupMyPokemon.speciesName}
                onDoubleClick={() => setMatchupMyPokemon(null)}
              />
              <strong className="matchup-pokemon-name">
                {matchupMyPokemon.nickname || matchupMyPokemon.speciesName}
              </strong>
              <div className="matchup-types">
                {(pokemonMeta[matchupMyPokemon.species]?.types || []).map((type) => (
                  <span className="matchup-type-icon-only" key={type}>
                    <TypeIcon type={type} compact />
                  </span>
                ))}
              </div>
              <div className="matchup-info matchup-ring-section">
                <div><span>Level</span><b>{matchupMyLevel ?? '—'}</b></div>
                <div><span>Nature</span><b>{matchupMyPokemon.nature || '—'}</b></div>
                <div><span>Ability</span><b>{matchupMyPokemon.ability || '—'}</b></div>
                <div>
                  <span>Held Item</span>
                  <b className="matchup-held-item">
                    <ItemIcon
                      name={
                        !matchupMyPokemon.heldItem
                          ? 'None'
                          : (itemNames?.[matchupMyPokemon.heldItem] ||
                             matchupMyPokemon.heldItemName ||
                             `Item ${matchupMyPokemon.heldItem}`)
                      }
                    />
                    <span>
                      {!matchupMyPokemon.heldItem
                        ? 'None'
                        : (itemNames?.[matchupMyPokemon.heldItem] ||
                           matchupMyPokemon.heldItemName ||
                           `Item ${matchupMyPokemon.heldItem}`)}
                    </span>
                  </b>
                </div>
              </div>
              {matchupMyStats && (
                <>
                  <h4 className="matchup-section-heading">Stats</h4>
                  <div className="matchup-stats-section matchup-ring-section">
                    <div className="matchup-stats">
                    {[
                      ['HP', 'hp'], ['Atk', 'attack'], ['Def', 'defense'],
                      ['SpA', 'spAttack'], ['SpD', 'spDefense'], ['Spe', 'speed'],
                    ].map(([label, key]) => (
                      <div className="matchup-stat" key={key}>
                        <span>{label}</span>
                        <b className={key === 'speed' && matchupSpeedWinner === 'my' ? 'speed-winner' : ''}>
                          {matchupMyStats[key] ?? '—'}
                        </b>
                      </div>
                    ))}
                    </div>
                    <div className="matchup-stats-evs">
                      <span>EVs</span>
                      <b>{formatMatchupEvs(matchupMyPokemon.evs)}</b>
                    </div>
                  </div>
                </>
              )}
              <h4 className="matchup-section-heading">Moves</h4>
              <div className="matchup-moves matchup-ring-section">
                {(matchupMyPokemon.moves || []).slice(0, 4).map((move, index) => {
                  const info = moveInfo?.[move.id] ?? {}
                  const type = info.type ?? move.type ?? 'NORMAL'
                  const maxPp = getMoveMaxPp(
                    info.pp ?? move.maxPp,
                    matchupMyPokemon.ppBonuses,
                    index
                  )
                  return (
                    <div className="matchup-move" key={`${move.id}-${index}`}>
                      <TypeIcon type={type} compact />
                      <b>{move.name}</b>
                      <span>PP {maxPp ?? '—'}</span>
                    </div>
                  )
                })}
              </div>
              <h4 className="matchup-section-heading">Type Matchups</h4>
              <MatchupTypeAdvantages types={matchupMyTypes} />
            </>
          ) : null}
        </div>

        <div className="matchup-vs">VS</div>

        <div className="matchup-side matchup-opponent-side">
          {matchupOpponentPokemon ? (
            <>
              <img
                className="matchup-sprite"
                src={frontierArtworkSpritePath(matchupOpponentPokemon)}
                alt={`${matchupOpponentPokemon.species} ${matchupOpponentPokemon.instance}`}
                onDoubleClick={() => setMatchupOpponentPokemon(null)}
              />
              <strong className="matchup-pokemon-name">
                {matchupOpponentPokemon.species} {matchupOpponentPokemon.instance}
              </strong>
              <div className="matchup-types">
                {(Object.values(pokemonMeta).find(
                  (entry) =>
                    entry.name.toLowerCase() ===
                    matchupOpponentPokemon.species.toLowerCase()
                )?.types || []).map((type) => (
                  <span className="matchup-type-icon-only" key={type}>
                    <TypeIcon type={type} compact />
                  </span>
                ))}
              </div>
              <div className="matchup-info matchup-ring-section">
                <div><span>Level</span><b>{battleSettings.level}</b></div>
                <div><span>Nature</span><b>{matchupOpponentPokemon.nature || '—'}</b></div>
                <div><span>Ability</span><b>{matchupOpponentPokemon.possibleAbility || '—'}</b></div>
                <div>
                  <span>Held Item</span>
                  <b className="matchup-held-item">
                    {matchupOpponentPokemon.item && (
                      <ItemIcon name={matchupOpponentPokemon.item} />
                    )}
                    <span>{matchupOpponentPokemon.item || 'None'}</span>
                  </b>
                </div>
              </div>
              {matchupOpponentStats && (
                <>
                  <h4 className="matchup-section-heading">Stats</h4>
                  <div className="matchup-stats-section matchup-ring-section">
                    <div className="matchup-stats">
                    {[
                      ['HP', 'hp'], ['Atk', 'attack'], ['Def', 'defense'],
                      ['SpA', 'spAttack'], ['SpD', 'spDefense'], ['Spe', 'speed'],
                    ].map(([label, key]) => (
                      <div className="matchup-stat" key={key}>
                        <span>{label}</span>
                        <b className={key === 'speed' && matchupSpeedWinner === 'opponent' ? 'speed-winner' : ''}>
                          {matchupOpponentStats[key] ?? '—'}
                        </b>
                      </div>
                    ))}
                    </div>
                    <div className="matchup-stats-evs">
                      <span>EVs</span>
                      <b>{formatMatchupEvs(matchupOpponentPokemon.evs, true)}</b>
                    </div>
                  </div>
                </>
              )}
              <h4 className="matchup-section-heading">Moves</h4>
              <div className="matchup-moves matchup-ring-section">
                {(matchupOpponentPokemon.moves || []).slice(0, 4).map((move, index) => {
                  const info = getFrontierMoveInfo(move) || {}
                  return (
                    <div className="matchup-move" key={`${move}-${index}`}>
                      <TypeIcon type={info.type ?? 'NORMAL'} compact />
                      <b>{move}</b>
                      <span>PP {info.pp ?? '—'}</span>
                    </div>
                  )
                })}
              </div>
              <h4 className="matchup-section-heading">Type Matchups</h4>
              <MatchupTypeAdvantages types={matchupOpponentTypes} />
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function App() {
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
    if (pokemon.experience == null) pokemon = { ...pokemon, experience: expForLevel(pokemon.level, speciesInfo[pokemon.species]?.growthRate) }
    setSaveData(current => {
      const save = current ?? {}
      const id = pokemon.companionId
      const replace = entry => getPokemonId(entry) === id ? pokemon : entry
      if (!id) return { ...save, manualPokemon: [...(save.manualPokemon ?? []), { ...pokemon, manualId: crypto.randomUUID() }] }
      return { ...save,
        manualPokemon: (save.manualPokemon ?? []).map(replace),
        party: save.party ? { ...save.party, pokemon: save.party.pokemon?.map(replace) } : save.party,
        pcStorage: save.pcStorage ? { ...save.pcStorage, boxes: save.pcStorage.boxes?.map(box => ({ ...box, pokemon: box.pokemon.map(replace) })) } : save.pcStorage,
      }
    })
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
          <ResourcesPage key={resourcesVisit} />
        )}

        <div
          className={`persistent-page ${activePage === 'battle' ? 'active' : ''}`}
          aria-hidden={activePage !== 'battle'}
        >
          <BattlePage collection={collection} designations={designations} />
        </div>
      </main>

      <nav className="bottom-nav home97-nav">
        <button className={activePage === 'home' ? 'active' : ''} onClick={() => setActivePage('home')}><span className="nav-icon nav-home-icon"><HomeIcon kind="home" /></span><span>Home</span></button>
        <button className={activePage === 'pokemon' ? 'active' : ''} onClick={() => setActivePage('pokemon')}><span className="nav-icon nav-pokemon-icon"><HomeIcon kind="pokemon" /></span><span>My Pokémon</span></button>
        <button className={activePage === 'battle' ? 'active' : ''} onClick={() => setActivePage('battle')}><span className="nav-icon nav-battle-icon"><HomeIcon kind="battle" /></span><span>Battle</span></button>
        <button className={activePage === 'resources' ? 'active' : ''} onClick={() => { setResourcesVisit(visit => visit + 1); setActivePage('resources') }}><span className="nav-icon nav-resources-icon"><HomeIcon kind="resources" /></span><span>Resources</span></button>
      </nav>
    </div>
  )
}

export default App
