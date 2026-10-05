import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

const SPECIES_URL =
  'https://raw.githubusercontent.com/pret/pokeemerald/master/include/constants/species.h'

const SPECIES_INFO_URL =
  'https://raw.githubusercontent.com/pret/pokeemerald/master/src/data/pokemon/species_info.h'

const POKEDEX_URL =
  'https://raw.githubusercontent.com/pret/pokeemerald/master/include/constants/pokedex.h'

const outputPath = path.join(
  ROOT,
  'src',
  'data',
  'pokemonMeta.js'
)

async function getText(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Failed to download ${url}: ${response.status}`
    )
  }

  return response.text()
}

function normalizeName(name) {
  return name
    .replace(/^SPECIES_/, '')
    .replace(/^NATIONAL_DEX_/, '')
}

function prettyName(name) {
  const special = {
    NIDORAN_F: 'Nidoran♀',
    NIDORAN_M: 'Nidoran♂',
    MR_MIME: 'Mr. Mime',
    FARFETCHD: "Farfetch'd",
    HO_OH: 'Ho-Oh',
  }

  if (special[name]) {
    return special[name]
  }

  return name
    .toLowerCase()
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(' ')
}

function parseSpeciesConstants(text) {
  const result = {}

  const regex =
    /#define\s+SPECIES_([A-Z0-9_]+)\s+(\d+)/g

  let match

  while ((match = regex.exec(text))) {
    result[match[1]] =
      Number(match[2])
  }

  return result
}

function parseNationalDex(text) {
  const result = {}
  let dex = 0

  const enumMatch =
    text.match(
      /enum\s*\{([\s\S]*?)\};/
    )

  if (!enumMatch) {
    throw new Error(
      'Could not find National Dex enum.'
    )
  }

  const regex =
    /NATIONAL_DEX_([A-Z0-9_]+)/g

  let match

  while (
    (match =
      regex.exec(enumMatch[1]))
  ) {
    const name = match[1]

    if (name === 'NONE') {
      continue
    }

    dex++

    if (dex <= 386) {
      result[name] = dex
    }
  }

  return result
}

function parseTypes(text) {
  const result = {}

  const entryRegex =
    /^\s*\[SPECIES_([A-Z0-9_]+)\]\s*=\s*\{([\s\S]*?)(?=^\s*\[SPECIES_|^\};)/gm

  let match

  while (
    (match =
      entryRegex.exec(text))
  ) {
    const name = match[1]
    const body = match[2]

    const typesMatch =
      body.match(
        /\.types\s*=\s*\{\s*TYPE_([A-Z]+)\s*,\s*TYPE_([A-Z]+)\s*\}/
      )

    if (typesMatch) {
      result[name] = [
        typesMatch[1],
        typesMatch[2],
      ]
    }
  }

  return result
}

function generationForDex(dex) {
  if (dex <= 151) {
    return 1
  }

  if (dex <= 251) {
    return 2
  }

  return 3
}

const [
  speciesText,
  speciesInfoText,
  pokedexText,
] = await Promise.all([
  getText(SPECIES_URL),
  getText(SPECIES_INFO_URL),
  getText(POKEDEX_URL),
])

const speciesConstants =
  parseSpeciesConstants(
    speciesText
  )

const nationalDex =
  parseNationalDex(
    pokedexText
  )

const types =
  parseTypes(
    speciesInfoText
  )

const metadata = {}

for (
  const [name, internalId]
  of Object.entries(
    speciesConstants
  )
) {
  const dex =
    nationalDex[name]

  if (
    !dex ||
    dex < 1 ||
    dex > 386
  ) {
    continue
  }

  const pokemonTypes =
    types[name] ?? [
      'NORMAL',
      'NORMAL',
    ]

  metadata[internalId] = {
    dex,
    name: prettyName(name),
    generation:
      generationForDex(dex),
    types:
      pokemonTypes[0] ===
      pokemonTypes[1]
        ? [pokemonTypes[0]]
        : pokemonTypes,
  }
}

const output =
`// AUTO-GENERATED FILE
// Run: node tools/buildPokemonMeta.mjs

export const pokemonMeta =
${JSON.stringify(
  metadata,
  null,
  2
)}
`

fs.mkdirSync(
  path.dirname(outputPath),
  {
    recursive: true,
  }
)

fs.writeFileSync(
  outputPath,
  output
)

console.log('')
console.log(
  'Created src/data/pokemonMeta.js'
)

console.log(
  `${
    Object.keys(metadata).length
  } Pokémon mapped`
)

const missing = []

for (
  let dex = 1;
  dex <= 386;
  dex++
) {
  const found =
    Object.values(
      metadata
    ).some(
      (entry) =>
        entry.dex === dex
    )

  if (!found) {
    missing.push(dex)
  }
}

console.log(
  `Missing National Dex entries: ${
    missing.length
  }`
)

if (missing.length) {
  console.log(missing)
} else {
  console.log(
    '✓ All 386 Pokémon mapped.'
  )
}