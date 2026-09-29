import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import SaveLoader from './components/SaveLoader'
import { pokemonMeta } from './data/pokemonMeta'
import { speciesInfo, moveInfo, itemNames } from './data/emeraldData'

const SAVE_STORAGE_KEY =
  'emerald-companion-save-v1'

const DESIGNATION_STORAGE_KEY =
  'emerald-companion-designations-v1'

const TYPES = [
  'NORMAL',
  'FIRE',
  'WATER',
  'ELECTRIC',
  'GRASS',
  'ICE',
  'FIGHTING',
  'POISON',
  'GROUND',
  'FLYING',
  'PSYCHIC',
  'BUG',
  'ROCK',
  'GHOST',
  'DRAGON',
  'DARK',
  'STEEL',
]

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
  return [pokemon.personality, pokemon.otId].join('-')
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

  const collection = []

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

function formatUpdatedAt(
  timestamp
) {
  if (!timestamp) {
    return null
  }

  return new Date(
    timestamp
  ).toLocaleString()
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

function StatCard({
  label,
  value,
  detail,
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>

      <strong>{value}</strong>

      {detail && (
        <small>{detail}</small>
      )}
    </div>
  )
}

function HomePage({
  saveData,
  collection,
  onGoToPokemon,
  onSaveLoaded,
}) {
  const shinyCount =
    collection.filter(
      (pokemon) =>
        pokemon.shiny
    ).length

  return (
    <div className="page">
      <section className="trainer-hero">
        <div>
          <p className="page-eyebrow">
            TRAINER
          </p>

          <h2>
            {saveData.trainerName}
          </h2>

          <p className="trainer-id">
            ID No.{' '}
            {String(
              saveData.trainerId
            ).padStart(5, '0')}
          </p>
        </div>

        <div className="trainer-playtime">
          <span>PLAY TIME</span>

          <strong>
            {formatPlayTime(
              saveData.playTime
            )}
          </strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <StatCard
          label="MONEY"
          value={formatMoney(
            saveData.money
          )}
        />

        <StatCard
          label="BADGES"
          value={`${
            saveData.badgeData
              ?.count ?? 0
          } / 8`}
        />

        <StatCard
          label="SEEN"
          value={`${
            saveData.pokedex
              ?.seenCount ?? 0
          } / 386`}
        />

        <StatCard
          label="CAUGHT"
          value={`${
            saveData.pokedex
              ?.caughtCount ?? 0
          } / 386`}
        />

        <StatCard
          label="SHINIES"
          value={shinyCount}
        />

        <StatCard
          label="FRONTIER SYMBOLS"
          value="— / 7"
        />
      </section>

      <button
        className="collection-link"
        onClick={onGoToPokemon}
      >
        <div>
          <p className="page-eyebrow">
            COLLECTION
          </p>

          <strong>
            My Pokémon
          </strong>

          <span>
            {collection.length}{' '}
            Pokémon
          </span>
        </div>

        <span className="link-arrow">
          ›
        </span>
      </button>

      <section className="save-management">
        <div>
          <p className="page-eyebrow">
            SAVE FILE
          </p>

          <h3>Emerald Save</h3>

          {saveData.updatedAt && (
            <p>
              Last updated{' '}
              {formatUpdatedAt(
                saveData.updatedAt
              )}
            </p>
          )}
        </div>

        <SaveLoader
          compact
          onSaveLoaded={
            onSaveLoaded
          }
        />
      </section>
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
  const allTypes = Object.keys(TYPE_CHART)
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

function ItemIcon({ name }) {
  if (!name || name === 'None' || name === '—') return null
  return (
    <img
      className="held-item-icon"
      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${assetSlug(name)}.png`}
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

function PokemonDetail({
  pokemon,
  role,
  onRoleChange,
  onClose,
}) {
  const [detailTab, setDetailTab] = useState('summary')

  useEffect(() => setDetailTab('summary'), [pokemon?.companionId])

  useEffect(() => {
    if (!pokemon) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [pokemon])

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
      <div className="detail-sheet exact-sheet">
        <button className="exact-close" onClick={onClose} aria-label="Close">×</button>

        <header className="exact-hero">
          <div className="exact-pokeball" aria-hidden="true"><i /></div>
          <div className="sprite-stage">
            <img src={spritePath(pokemon)} alt={pokemon.speciesName} />
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
                    <div><b>{move.name}</b><span>PP {move.pp}{maxPp != null ? `/${maxPp}` : ''}</span></div>
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
  collection,
  designations,
  onRoleChange,
}) {
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
                .includes(
                  query
                ) &&
              !pokemon.nickname
                ?.toLowerCase()
                .includes(
                  query
                ) &&
              !String(
                meta.dex
              ).includes(query)
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
    <div className="page">
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
      </header>

      <section className="pokemon-tools">
        <input
          className="pokemon-search"
          type="search"
          placeholder="Search name, nickname or Dex #..."
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

            {TYPES.map(
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

          <SelectFilter
            label="SHINY"
            value={shininess}
            onChange={
              setShininess
            }
          >
            <option value="all">
              All
            </option>

            <option value="shiny">
              Shiny
            </option>

            <option value="normal">
              Non-Shiny
            </option>
          </SelectFilter>
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
          No Pokémon match
          these filters.
        </div>
      )}

      <PokemonDetail
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

  const collection =
    useMemo(
      () =>
        buildCollection(
          saveData
        ),
      [saveData]
    )

  useEffect(() => {
    if (saveData) {
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

  if (!saveData) {
    return (
      <div className="app-shell">
        <header className="app-topbar">
          <div>
            <p className="app-kicker">
              POKÉMON EMERALD
            </p>

            <h1>
              Emerald Companion
            </h1>
          </div>
        </header>

        <main className="app-content first-load">
          <SaveLoader
            onSaveLoaded={
              handleSaveLoaded
            }
          />
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          className="brand-button"
          onClick={() =>
            setActivePage(
              'home'
            )
          }
        >
          <span className="app-kicker">
            POKÉMON EMERALD
          </span>

          <strong>
            Emerald Companion
          </strong>
        </button>

        <div className="save-status">
          <span />
          Save Loaded
        </div>
      </header>

      <main className="app-content">
        {activePage ===
        'home' ? (
          <HomePage
            saveData={
              saveData
            }
            collection={
              collection
            }
            onGoToPokemon={() =>
              setActivePage(
                'pokemon'
              )
            }
            onSaveLoaded={
              handleSaveLoaded
            }
          />
        ) : (
          <MyPokemonPage
            collection={
              collection
            }
            designations={
              designations
            }
            onRoleChange={
              handleRoleChange
            }
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={
            activePage ===
            'home'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActivePage(
              'home'
            )
          }
        >
          <span className="nav-icon">
            ⌂
          </span>

          <span>Home</span>
        </button>

        <button
          className={
            activePage ===
            'pokemon'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActivePage(
              'pokemon'
            )
          }
        >
          <span className="nav-icon">
            ◉
          </span>

          <span>
            My Pokémon
          </span>
        </button>
      </nav>
    </div>
  )
}

export default App