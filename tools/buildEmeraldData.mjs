import fs from 'node:fs/promises'

const BASE =
  'https://raw.githubusercontent.com/pret/pokeemerald/master'

const urls = {
  species:
    `${BASE}/include/constants/species.h`,
  moves:
    `${BASE}/include/constants/moves.h`,
  abilities:
    `${BASE}/include/constants/abilities.h`,
  itemConstants: `${BASE}/include/constants/items.h`,
  items:
    `${BASE}/include/constants/items.h`,
  speciesInfo:
    `${BASE}/src/data/pokemon/species_info.h`,
  pokedex:
    `${BASE}/src/data/pokemon/pokedex_entries.h`,
  battleMoves:
    `${BASE}/src/data/battle_moves.h`,
}

function displayName(constant) {
  const special = {
    NIDORAN_F: 'Nidoran♀',
    NIDORAN_M: 'Nidoran♂',
    MR_MIME: 'Mr. Mime',
    FARFETCHD: "Farfetch'd",
    HO_OH: 'Ho-Oh',
    PORYGON2: 'Porygon2',

    DOUBLE_SLAP: 'DoubleSlap',
    SONIC_BOOM: 'SonicBoom',
    THUNDER_PUNCH: 'ThunderPunch',
    SOLAR_BEAM: 'SolarBeam',
    VICE_GRIP: 'ViceGrip',
    EXTREME_SPEED: 'ExtremeSpeed',
    ANCIENT_POWER: 'AncientPower',
    DRAGON_BREATH: 'DragonBreath',
    DYNAMIC_PUNCH: 'DynamicPunch',
    GRASS_WHISTLE: 'GrassWhistle',
    FEATHER_DANCE: 'FeatherDance',
    SMELLING_SALT: 'SmellingSalt',
  }

  if (special[constant]) {
    return special[constant]
  }

  return constant
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function parseDefines(
  text,
  prefix
) {
  const result = {}

  const regex =
    new RegExp(
      `#define\\s+${prefix}([A-Z0-9_]+)\\s+(\\d+)`,
      'g'
    )

  let match

  while (
    (match = regex.exec(text)) !== null
  ) {
    const name = match[1]
    const id = Number(match[2])

    result[id] =
      displayName(name)
  }

  return result
}

function reverseDefines(
  text,
  prefix
) {
  const result = {}

  const regex =
    new RegExp(
      `#define\\s+${prefix}([A-Z0-9_]+)\\s+(\\d+)`,
      'g'
    )

  let match

  while (
    (match = regex.exec(text)) !== null
  ) {
    result[match[1]] =
      Number(match[2])
  }

  return result
}

function parseItemConstants(text) {
  const enumMatch = text.match(/enum\s*\{([\s\S]*?)\};/)
  if (!enumMatch) throw new Error('Could not find canonical item enum')

  const clean = enumMatch[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')

  const tokens = clean.split(',').map(s => s.trim()).filter(Boolean)
  const byName = {}
  const byId = {}
  let id = 0

  for (const token of tokens) {
    const name = token.match(/^(ITEM_[A-Z0-9_]+|ITEMS_COUNT)/)?.[1]
    if (!name) continue
    if (name === 'ITEMS_COUNT') break
    byName[name] = id
    byId[id] = name
    id += 1
  }

  return { byName, byId }
}

function humanizeItemConstant(constant) {
  if (!constant || constant === 'ITEM_NONE') return 'None'
  return constant
    .replace(/^ITEM_/, '')
    .split('_')
    .map(part => {
      if (/^(TM|HM)\d+$/.test(part)) return part
      if (/^[0-9A-F]{3}$/.test(part)) return `Item ${parseInt(part, 16)}`
      return part.charAt(0) + part.slice(1).toLowerCase()
    })
    .join(' ')
    .replace('Poké Ball', 'Poké Ball')
    .replace('Exp Share', 'Exp. Share')
    .replace('Up Grade', 'Up-Grade')
    .replace('Never Melt Ice', 'NeverMeltIce')
    .replace('Twisted Spoon', 'TwistedSpoon')
    .replace('Silver Powder', 'SilverPowder')
    .replace('Black Glasses', 'BlackGlasses')
}

function parseItemNames(itemsText, constants) {
  const out = {}

  // Canonical ID/name baseline from include/constants/items.h.
  for (const [idText, constant] of Object.entries(constants.byId)) {
    out[Number(idText)] = humanizeItemConstant(constant)
  }

  // Where available, replace with the exact in-game display name from gItems.
  const entryRe = /\[(ITEM_[A-Z0-9_]+)\]\s*=\s*\{([\s\S]*?)(?=\n\s*\[(?:ITEM_|ITEMS_COUNT))/g
  let match
  while ((match = entryRe.exec(itemsText))) {
    const constant = match[1]
    const id = constants.byName[constant]
    if (id == null) continue
    const nameMatch = match[2].match(/\.name\s*=\s*_\("([^"]+)"\)/)
    if (!nameMatch) continue
    const raw = nameMatch[1]
    if (raw && raw !== '????????') {
      out[id] = raw
        .replace(/POKé/g, 'Poké')
        .toLowerCase()
        .replace(/(^|[\s.-])([a-z])/g, (_, p, c) => p + c.toUpperCase())
        .replace(/\bTm(\d+)/g, 'TM$1')
        .replace(/\bHm(\d+)/g, 'HM$1')
    }
  }

  out[0] = 'None'
  return out
}


function parseSpeciesInfo(
  text,
  speciesByName,
  abilityByName
) {
  const result = {}

  const markerRegex =
    /\[SPECIES_([A-Z0-9_]+)\]\s*=/g

  const entries = []

  let match

  while (
    (
      match =
        markerRegex.exec(text)
    ) !== null
  ) {
    entries.push({
      constant: match[1],
      start: match.index,
    })
  }

  for (
    let i = 0;
    i < entries.length;
    i++
  ) {
    const entry =
      entries[i]

    const nextEntry =
      entries[i + 1]

    const block =
      text.slice(
        entry.start,
        nextEntry
          ? nextEntry.start
          : text.length
      )

    const speciesId =
      speciesByName[
        entry.constant
      ]

    if (
      speciesId === undefined
    ) {
      continue
    }

    let genderRatio = null

    if (
      block.includes(
        'MON_GENDERLESS'
      )
    ) {
      genderRatio = 255
    } else if (
      block.includes(
        '.genderRatio = MON_FEMALE'
      )
    ) {
      genderRatio = 254
    } else if (
      block.includes(
        '.genderRatio = MON_MALE'
      )
    ) {
      genderRatio = 0
    } else {
      const genderMatch =
        block.match(
          /\.genderRatio\s*=\s*PERCENT_FEMALE\((\d+(?:\.\d+)?)\)/
        )

      if (genderMatch) {
        const percent =
          Number(
            genderMatch[1]
          )

        genderRatio =
          Math.min(
            254,
            Math.floor(
              percent *
                255 /
                100
            )
          )
      }
    }

    const abilitiesMatch =
      block.match(
        /\.abilities\s*=\s*\{\s*ABILITY_([A-Z0-9_]+)\s*,\s*ABILITY_([A-Z0-9_]+)\s*\}/
      )

    const abilities = []

    if (abilitiesMatch) {
      const first =
        abilityByName[
          abilitiesMatch[1]
        ]

      const second =
        abilityByName[
          abilitiesMatch[2]
        ]

      if (
        first !== undefined &&
        first !== 0
      ) {
        abilities.push(first)
      }

      if (
        second !== undefined &&
        second !== 0
      ) {
        abilities.push(second)
      }
    }

    const stat = (field) => {
      const m = block.match(new RegExp(`\\.${field}\\s*=\\s*(\\d+)`))
      return m ? Number(m[1]) : null
    }

    const growthMatch =
      block.match(/\.growthRate\s*=\s*(GROWTH_[A-Z_]+)/)

    result[speciesId] = {
      genderRatio,
      abilities,
      growthRate:
        growthMatch
          ? growthMatch[1]
          : 'GROWTH_MEDIUM_FAST',
      baseStats: {
        hp: stat('baseHP'),
        attack: stat('baseAttack'),
        defense: stat('baseDefense'),
        speed: stat('baseSpeed'),
        spAttack: stat('baseSpAttack'),
        spDefense: stat('baseSpDefense'),
      },
    }
  }

  return result
}


function parseMoveInfo(
  text,
  moveByName
) {
  const result = {}
  const markerRegex =
    /\[MOVE_([A-Z0-9_]+)\]\s*=/g
  const entries = []
  let match

  while (
    (match =
      markerRegex.exec(text)) !== null
  ) {
    entries.push({
      constant: match[1],
      start: match.index,
    })
  }

  for (
    let i = 0;
    i < entries.length;
    i++
  ) {
    const entry = entries[i]
    const next = entries[i + 1]
    const block =
      text.slice(
        entry.start,
        next
          ? next.start
          : text.length
      )

    const id =
      moveByName[
        entry.constant
      ]

    if (
      id === undefined
    ) {
      continue
    }

    const typeMatch =
      block.match(
        /\.type\s*=\s*TYPE_([A-Z]+)/)
    const ppMatch =
      block.match(
        /\.pp\s*=\s*(\d+)/)

    result[id] = {
      type:
        typeMatch
          ? typeMatch[1]
          : 'NORMAL',
      pp:
        ppMatch
          ? Number(ppMatch[1])
          : null,
    }
  }

  return result
}

function getRealPokemonConstants(
  speciesByName
) {
  const excludedPrefixes = [
    'OLD_UNOWN_',
  ]

  const excludedNames =
    new Set([
      'NONE',
      'EGG',
    ])

  const candidates =
    Object.entries(
      speciesByName
    )
      .filter(
        ([name]) =>
          !excludedNames.has(name) &&
          !excludedPrefixes.some(
            (prefix) =>
              name.startsWith(
                prefix
              )
          )
      )
      .filter(
        ([name]) =>
          !name.startsWith(
            'UNOWN_'
          ) ||
          name === 'UNOWN'
      )

  return candidates
}

function validateSpeciesProfiles(
  speciesByName,
  speciesInfo
) {
  const realPokemon =
    getRealPokemonConstants(
      speciesByName
    )

  const missing = []

  for (
    const [
      name,
      speciesId,
    ] of realPokemon
  ) {
    if (
      !speciesInfo[
        speciesId
      ]
    ) {
      missing.push({
        name,
        speciesId,
      })
    }
  }

  return {
    realPokemon,
    missing,
  }
}

async function main() {
  console.log(
    'Downloading Emerald reference data...'
  )

  const entries =
    await Promise.all(
      Object.entries(
        urls
      ).map(
        async ([key, url]) => {
          const response =
            await fetch(url)

          if (
            !response.ok
          ) {
            throw new Error(
              `Failed to download ${key}: ${response.status}`
            )
          }

          return [
            key,
            await response.text(),
          ]
        }
      )
    )

  const source =
    Object.fromEntries(
      entries
    )

  const species =
    parseDefines(
      source.species,
      'SPECIES_'
    )

  const moves =
    parseDefines(
      source.moves,
      'MOVE_'
    )

  const abilities =
    parseDefines(
      source.abilities,
      'ABILITY_'
    )

  const itemConstants =
    parseItemConstants(
      source.itemConstants
    )

  const items =
    parseItemNames(
      source.items,
      itemConstants
    )

  const speciesByName =
    reverseDefines(
      source.species,
      'SPECIES_'
    )

  const abilityByName =
    reverseDefines(
      source.abilities,
      'ABILITY_'
    )

  const moveByName =
    reverseDefines(
      source.moves,
      'MOVE_'
    )

  const moveInfo =
    parseMoveInfo(
      source.battleMoves,
      moveByName
    )

  const speciesInfo =
    parseSpeciesInfo(
      source.speciesInfo,
      speciesByName,
      abilityByName
    )

  const validation =
    validateSpeciesProfiles(
      speciesByName,
      speciesInfo
    )

  console.log('')
  console.log(
    'Validation'
  )
  console.log(
    '----------'
  )

  console.log(
    `Real Pokémon constants found: ${validation.realPokemon.length}`
  )

  if (
    validation.missing.length
  ) {
    console.log('')
    console.log(
      'Missing species profiles:'
    )

    for (
      const mon of
      validation.missing
    ) {
      console.log(
        `- ${mon.name} (internal ID ${mon.speciesId})`
      )
    }

    throw new Error(
      `${validation.missing.length} real Pokémon are missing species profiles.`
    )
  }

  console.log(
    'Missing real Pokémon profiles: 0'
  )

  const output = `
// AUTO-GENERATED.
// Source: pret/pokeemerald
// Run: node tools/buildEmeraldData.mjs

export const speciesNames =
${JSON.stringify(
  species,
  null,
  2
)}

export const moveNames =
${JSON.stringify(
  moves,
  null,
  2
)}

export const itemNames =
${JSON.stringify(
  items,
  null,
  2
)}

export const abilityNames =
${JSON.stringify(
  abilities,
  null,
  2
)}

export const speciesInfo =
${JSON.stringify(
  speciesInfo,
  null,
  2
)}

export const moveInfo =
${JSON.stringify(
  moveInfo,
  null,
  2
)}
`.trimStart()

  await fs.mkdir(
    new URL(
      '../src/data/',
      import.meta.url
    ),
    {
      recursive: true,
    }
  )

  await fs.writeFile(
    new URL(
      '../src/data/emeraldData.js',
      import.meta.url
    ),
    output
  )

  console.log('')
  console.log(
    'Created src/data/emeraldData.js'
  )

  console.log(
    `${Object.keys(species).length} species IDs`
  )

  console.log(
    `${Object.keys(moves).length} moves`
  )

  console.log(
    `${Object.keys(items).length} items`
  )

  console.log(
    `${Object.keys(abilities).length} abilities`
  )

  console.log(
    `${Object.keys(speciesInfo).length} species profiles`
  )

  console.log(
    `${Object.keys(moveInfo).length} move profiles`
  )

  console.log('')
  console.log(
    '✓ All real Pokémon have species profiles.'
  )
}

main().catch(
  (error) => {
    console.error('')
    console.error(error.message)
    process.exit(1)
  }
)