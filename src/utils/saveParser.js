import {
  speciesNames,
  moveNames,
  itemNames,
  abilityNames,
  speciesInfo,
} from '../data/emeraldData'

const SECTION_SIZE = 0x1000
const SECTION_DATA_SIZE = 0xF80
const SECTIONS_PER_SLOT = 14
const SLOT_SIZE =
  SECTION_SIZE * SECTIONS_PER_SLOT

const FLAGS_OFFSET = 0x1270

const POKEDEX_OFFSET = 0x18
const POKEDEX_OWNED_OFFSET = 0x10
const POKEDEX_SEEN_OFFSET = 0x44
const NATIONAL_DEX_COUNT = 386

const PARTY_COUNT_OFFSET = 0x234
const PARTY_OFFSET = 0x238
const PARTY_POKEMON_SIZE = 100

const STORAGE_FIRST_SECTION = 5
const STORAGE_LAST_SECTION = 13
const STORAGE_SECTION_COUNT = 9

const TOTAL_BOXES = 14
const BOX_SLOTS = 30
const BOX_POKEMON_SIZE = 80

const STORAGE_BOXES_OFFSET = 0x0004
const STORAGE_BOX_NAMES_OFFSET = 0x8344
const BOX_NAME_LENGTH = 9

const BADGE_FLAGS = [
  0x867,
  0x868,
  0x869,
  0x86A,
  0x86B,
  0x86C,
  0x86D,
  0x86E,
]

const natures = [
  'Hardy',
  'Lonely',
  'Brave',
  'Adamant',
  'Naughty',
  'Bold',
  'Docile',
  'Relaxed',
  'Impish',
  'Lax',
  'Timid',
  'Hasty',
  'Serious',
  'Jolly',
  'Naive',
  'Modest',
  'Mild',
  'Quiet',
  'Bashful',
  'Rash',
  'Calm',
  'Gentle',
  'Sassy',
  'Careful',
  'Quirky',
]

const substructureOrders = [
  'GAEM',
  'GAME',
  'GEAM',
  'GEMA',
  'GMAE',
  'GMEA',
  'AGEM',
  'AGME',
  'AEGM',
  'AEMG',
  'AMGE',
  'AMEG',
  'EGAM',
  'EGMA',
  'EAGM',
  'EAMG',
  'EMGA',
  'EMAG',
  'MGAE',
  'MGEA',
  'MAGE',
  'MAEG',
  'MEGA',
  'MEAG',
]

const pokemonCharacters = {
  0x00: ' ',
  0xA1: '0',
  0xA2: '1',
  0xA3: '2',
  0xA4: '3',
  0xA5: '4',
  0xA6: '5',
  0xA7: '6',
  0xA8: '7',
  0xA9: '8',
  0xAA: '9',
  0xAB: '!',
  0xAC: '?',
  0xAD: '.',
  0xAE: '-',
  0xB4: "'",
  0xB5: '♂',
  0xB6: '♀',
  0xB8: ',',
  0xBB: 'A',
  0xBC: 'B',
  0xBD: 'C',
  0xBE: 'D',
  0xBF: 'E',
  0xC0: 'F',
  0xC1: 'G',
  0xC2: 'H',
  0xC3: 'I',
  0xC4: 'J',
  0xC5: 'K',
  0xC6: 'L',
  0xC7: 'M',
  0xC8: 'N',
  0xC9: 'O',
  0xCA: 'P',
  0xCB: 'Q',
  0xCC: 'R',
  0xCD: 'S',
  0xCE: 'T',
  0xCF: 'U',
  0xD0: 'V',
  0xD1: 'W',
  0xD2: 'X',
  0xD3: 'Y',
  0xD4: 'Z',
  0xD5: 'a',
  0xD6: 'b',
  0xD7: 'c',
  0xD8: 'd',
  0xD9: 'e',
  0xDA: 'f',
  0xDB: 'g',
  0xDC: 'h',
  0xDD: 'i',
  0xDE: 'j',
  0xDF: 'k',
  0xE0: 'l',
  0xE1: 'm',
  0xE2: 'n',
  0xE3: 'o',
  0xE4: 'p',
  0xE5: 'q',
  0xE6: 'r',
  0xE7: 's',
  0xE8: 't',
  0xE9: 'u',
  0xEA: 'v',
  0xEB: 'w',
  0xEC: 'x',
  0xED: 'y',
  0xEE: 'z',
}

function read16(bytes, offset) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8)
  )
}

function read32(bytes, offset) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0
}

function getSlotSaveIndex(bytes, slot) {
  return read32(
    bytes,
    slot * SLOT_SIZE + 0xFFC
  )
}

function getNewestSlot(bytes) {
  return getSlotSaveIndex(bytes, 1) >
    getSlotSaveIndex(bytes, 0)
    ? 1
    : 0
}

function findSection(
  bytes,
  slot,
  wantedSectionId
) {
  const slotStart =
    slot * SLOT_SIZE

  for (
    let i = 0;
    i < SECTIONS_PER_SLOT;
    i++
  ) {
    const sectionStart =
      slotStart +
      i * SECTION_SIZE

    if (
      read16(
        bytes,
        sectionStart + 0xFF4
      ) === wantedSectionId
    ) {
      return sectionStart
    }
  }

  return null
}

function decodePokemonText(
  bytes,
  offset,
  maxLength
) {
  let text = ''

  for (
    let i = 0;
    i < maxLength;
    i++
  ) {
    const character =
      bytes[offset + i]

    if (character === 0xFF) {
      break
    }

    text +=
      pokemonCharacters[
        character
      ] ?? '?'
  }

  return text.trim()
}

function getSaveBlock2(bytes) {
  const slot =
    getNewestSlot(bytes)

  const section =
    findSection(bytes, slot, 0)

  if (section === null) {
    return null
  }

  return bytes.slice(
    section,
    section +
      SECTION_DATA_SIZE
  )
}

function getSaveBlock1(bytes) {
  const slot =
    getNewestSlot(bytes)

  const result =
    new Uint8Array(
      SECTION_DATA_SIZE * 4
    )

  for (
    let id = 1;
    id <= 4;
    id++
  ) {
    const section =
      findSection(
        bytes,
        slot,
        id
      )

    if (section === null) {
      return null
    }

    result.set(
      bytes.slice(
        section,
        section +
          SECTION_DATA_SIZE
      ),
      (id - 1) *
        SECTION_DATA_SIZE
    )
  }

  return result
}

function getPokemonStorage(bytes) {
  const slot =
    getNewestSlot(bytes)

  const storage =
    new Uint8Array(
      SECTION_DATA_SIZE *
        STORAGE_SECTION_COUNT
    )

  for (
    let id =
      STORAGE_FIRST_SECTION;
    id <=
      STORAGE_LAST_SECTION;
    id++
  ) {
    const section =
      findSection(
        bytes,
        slot,
        id
      )

    if (section === null) {
      return null
    }

    storage.set(
      bytes.slice(
        section,
        section +
          SECTION_DATA_SIZE
      ),
      (id -
        STORAGE_FIRST_SECTION) *
        SECTION_DATA_SIZE
    )
  }

  return storage
}

function readFlag(
  saveBlock1,
  flagId
) {
  const byteOffset =
    FLAGS_OFFSET +
    Math.floor(flagId / 8)

  return (
    saveBlock1[byteOffset] &
    (1 << (flagId % 8))
  ) !== 0
}

function readDexFlags(
  saveBlock2,
  offset
) {
  const result = []

  for (
    let dex = 1;
    dex <= NATIONAL_DEX_COUNT;
    dex++
  ) {
    const bit =
      dex - 1

    result.push(
      (
        saveBlock2[
          offset +
            Math.floor(bit / 8)
        ] &
        (1 << (bit % 8))
      ) !== 0
    )
  }

  return result
}

function decryptPokemonData(mon) {
  const personality =
    read32(mon, 0)

  const otId =
    read32(mon, 4)

  const key =
    (
      personality ^
      otId
    ) >>> 0

  const decrypted =
    new Uint8Array(48)

  for (
    let offset = 0;
    offset < 48;
    offset += 4
  ) {
    const value =
      (
        read32(
          mon,
          32 + offset
        ) ^ key
      ) >>> 0

    decrypted[offset] =
      value & 0xFF

    decrypted[offset + 1] =
      (value >>> 8) & 0xFF

    decrypted[offset + 2] =
      (value >>> 16) & 0xFF

    decrypted[offset + 3] =
      (value >>> 24) & 0xFF
  }

  return decrypted
}

function getPokemonSubstructures(
  decrypted,
  personality
) {
  const order =
    substructureOrders[
      personality % 24
    ]

  const result = {}

  for (
    let i = 0;
    i < 4;
    i++
  ) {
    result[order[i]] =
      decrypted.slice(
        i * 12,
        i * 12 + 12
      )
  }

  return result
}

function calculatePokemonChecksum(
  decrypted
) {
  let checksum = 0

  for (
    let offset = 0;
    offset < 48;
    offset += 2
  ) {
    checksum =
      (
        checksum +
        read16(
          decrypted,
          offset
        )
      ) & 0xFFFF
  }

  return checksum
}

function getShinyStatus(
  personality,
  otId
) {
  return (
    (
      (personality & 0xFFFF) ^
      (personality >>> 16) ^
      (otId & 0xFFFF) ^
      (otId >>> 16)
    ) < 8
  )
}

function getGender(
  species,
  personality
) {
  const info =
    speciesInfo[species]

  if (
    !info ||
    info.genderRatio === null ||
    info.genderRatio === undefined
  ) {
    return null
  }

  if (
    info.genderRatio === 255
  ) {
    return 'Genderless'
  }

  return (
    (personality & 0xFF) <
    info.genderRatio
  )
    ? 'Female'
    : 'Male'
}

function readIVs(misc) {
  const value =
    read32(misc, 4)

  return {
    hp: value & 0x1F,
    attack:
      (value >>> 5) & 0x1F,
    defense:
      (value >>> 10) & 0x1F,
    speed:
      (value >>> 15) & 0x1F,
    spAttack:
      (value >>> 20) & 0x1F,
    spDefense:
      (value >>> 25) & 0x1F,
  }
}

function readEVs(evs) {
  return {
    hp: evs[0],
    attack: evs[1],
    defense: evs[2],
    speed: evs[3],
    spAttack: evs[4],
    spDefense: evs[5],
  }
}

function readContestStats(evs) {
  return {
    cool: evs[6],
    beauty: evs[7],
    cute: evs[8],
    smart: evs[9],
    tough: evs[10],
    sheen: evs[11],
  }
}

function readMoves(attacks) {
  const moves = []

  for (
    let i = 0;
    i < 4;
    i++
  ) {
    const id =
      read16(
        attacks,
        i * 2
      )

    if (id === 0) {
      continue
    }

    moves.push({
      id,
      name:
        moveNames[id] ??
        `Move ${id}`,
      pp:
        attacks[8 + i],
    })
  }

  return moves
}

function readRibbons(misc) {
  const value =
    read32(misc, 8)

  const ribbons = []

  const contestRibbons = [
    [
      value & 0x7,
      'Cool',
    ],
    [
      (value >>> 3) & 0x7,
      'Beauty',
    ],
    [
      (value >>> 6) & 0x7,
      'Cute',
    ],
    [
      (value >>> 9) & 0x7,
      'Smart',
    ],
    [
      (value >>> 12) & 0x7,
      'Tough',
    ],
  ]

  contestRibbons.forEach(
    ([rank, name]) => {
      if (rank) {
        ribbons.push(
          `${name} Rank ${rank}`
        )
      }
    }
  )

  const flags = [
    [15, 'Champion Ribbon'],
    [16, 'Winning Ribbon'],
    [17, 'Victory Ribbon'],
    [18, 'Artist Ribbon'],
    [19, 'Effort Ribbon'],
    [20, 'Marine Ribbon'],
    [21, 'Land Ribbon'],
    [22, 'Sky Ribbon'],
    [23, 'Country Ribbon'],
    [24, 'National Ribbon'],
    [25, 'Earth Ribbon'],
    [26, 'World Ribbon'],
  ]

  flags.forEach(
    ([bit, name]) => {
      if (
        (
          value &
          (1 << bit)
        ) !== 0
      ) {
        ribbons.push(name)
      }
    }
  )

  return ribbons
}

function getAbility(
  species,
  misc
) {
  const slot =
    (
      read32(misc, 4) >>>
      31
    ) & 1

  const info =
    speciesInfo[species]

  let id =
    info?.abilities?.[slot]

  if (
    id === undefined
  ) {
    id =
      info?.abilities?.[0]
  }

  return {
    slot: slot + 1,
    id: id ?? null,
    name:
      abilityNames[id] ??
      `Ability Slot ${slot + 1}`,
  }
}

function parseBoxPokemon(mon) {
  const personality =
    read32(mon, 0)

  const otId =
    read32(mon, 4)

  const storedChecksum =
    read16(mon, 28)

  const decrypted =
    decryptPokemonData(mon)

  const substructures =
    getPokemonSubstructures(
      decrypted,
      personality
    )

  const growth =
    substructures.G

  const attacks =
    substructures.A

  const evs =
    substructures.E

  const misc =
    substructures.M

  const species =
    read16(growth, 0)

  if (
    species === 0 ||
    !speciesNames[species]
  ) {
    return null
  }

  const heldItem =
    read16(growth, 2)

  const ability =
    getAbility(
      species,
      misc
    )

  const pokerus =
    misc[0]

  const origins = read16(misc, 2)
  const metGame = (origins >> 7) & 0x0f
  const pokeBall = (origins >> 11) & 0x0f

  const originGameNames = {
    1: 'Sapphire', 2: 'Ruby', 3: 'Emerald',
    4: 'FireRed', 5: 'LeafGreen', 15: 'Colosseum / XD',
  }
  const pokeBallNames = {
    1: 'Master Ball', 2: 'Ultra Ball', 3: 'Great Ball',
    4: 'Poké Ball', 5: 'Safari Ball', 6: 'Net Ball',
    7: 'Dive Ball', 8: 'Nest Ball', 9: 'Repeat Ball',
    10: 'Timer Ball', 11: 'Luxury Ball', 12: 'Premier Ball',
  }

  return {
    species,
    speciesName:
      speciesNames[species] ??
      `Species ${species}`,

    nickname:
      decodePokemonText(
        mon,
        8,
        10
      ),

    otName:
      decodePokemonText(
        mon,
        20,
        7
      ),

    originGame: originGameNames[metGame] ?? 'Unknown',
    originGameId: metGame,
    pokeBall: pokeBallNames[pokeBall] ?? 'Poké Ball',
    pokeBallId: pokeBall,

    nature:
      natures[
        personality % 25
      ],

    gender:
      getGender(
        species,
        personality
      ),

    shiny:
      getShinyStatus(
        personality,
        otId
      ),

    heldItem,

    heldItemName:
      itemNames[heldItem] ??
      (
        heldItem === 0
          ? 'None'
          : `Item ${heldItem}`
      ),

    experience:
      read32(growth, 4),

    friendship:
      growth[9],

    ppBonuses:
      growth[8],

    ability:
      ability.name,

    abilityId:
      ability.id,

    abilitySlot:
      ability.slot,

    moves:
      readMoves(attacks),

    ivs:
      readIVs(misc),

    evs:
      readEVs(evs),

    contest:
      readContestStats(
        evs
      ),

    pokerus,

    hasPokerus:
      pokerus !== 0,

    ribbons:
      readRibbons(misc),

    personality,

    otId,

    checksumValid:
      storedChecksum ===
      calculatePokemonChecksum(
        decrypted
      ),
  }
}

function parsePartyPokemon(
  saveBlock1,
  slot
) {
  const offset =
    PARTY_OFFSET +
    slot *
      PARTY_POKEMON_SIZE

  const mon =
    saveBlock1.slice(
      offset,
      offset +
        PARTY_POKEMON_SIZE
    )

  const pokemon =
    parseBoxPokemon(
      mon.slice(0, 80)
    )

  if (!pokemon) {
    return null
  }

  return {
    ...pokemon,

    slot,

    level:
      mon[84],

    stats: {
      currentHP:
        read16(mon, 86),

      maxHP:
        read16(mon, 88),

      attack:
        read16(mon, 90),

      defense:
        read16(mon, 92),

      speed:
        read16(mon, 94),

      spAttack:
        read16(mon, 96),

      spDefense:
        read16(mon, 98),
    },
  }
}

export function inspectSaveSections(
  bytes
) {
  for (
    let slot = 0;
    slot < 2;
    slot++
  ) {
    console.log(
      `SAVE SLOT ${slot}`
    )

    for (
      let i = 0;
      i <
        SECTIONS_PER_SLOT;
      i++
    ) {
      const start =
        slot * SLOT_SIZE +
        i * SECTION_SIZE

      console.log(
        `Physical section ${i}: ID ${read16(
          bytes,
          start + 0xFF4
        )}, Save Index ${read32(
          bytes,
          start + 0xFFC
        )}`
      )
    }
  }
}

export function readTrainerId(
  bytes
) {
  const block =
    getSaveBlock2(bytes)

  return block
    ? read16(block, 0x0A)
    : null
}

export function readTrainerName(
  bytes
) {
  const block =
    getSaveBlock2(bytes)

  return block
    ? decodePokemonText(
        block,
        0,
        7
      )
    : ''
}

export function readPlayTime(
  bytes
) {
  const block =
    getSaveBlock2(bytes)

  if (!block) {
    return null
  }

  return {
    hours:
      read16(
        block,
        0x0E
      ),
    minutes:
      block[0x10],
    seconds:
      block[0x11],
  }
}

export function readMoney(bytes) {
  const block2 =
    getSaveBlock2(bytes)

  const block1 =
    getSaveBlock1(bytes)

  if (
    !block2 ||
    !block1
  ) {
    return null
  }

  return (
    read32(
      block1,
      0x490
    ) ^
    read32(
      block2,
      0xAC
    )
  ) >>> 0
}

export function readBadges(
  bytes
) {
  const block =
    getSaveBlock1(bytes)

  if (!block) {
    return null
  }

  const badges =
    BADGE_FLAGS.map(
      (flag) =>
        readFlag(
          block,
          flag
        )
    )

  return {
    badges,
    count:
      badges.filter(
        Boolean
      ).length,
  }
}

export function readPokedex(
  bytes
) {
  const block =
    getSaveBlock2(bytes)

  if (!block) {
    return null
  }

  const caught =
    readDexFlags(
      block,
      POKEDEX_OFFSET +
        POKEDEX_OWNED_OFFSET
    )

  const seen =
    readDexFlags(
      block,
      POKEDEX_OFFSET +
        POKEDEX_SEEN_OFFSET
    )

  return {
    caught,
    seen,
    caughtCount:
      caught.filter(
        Boolean
      ).length,
    seenCount:
      seen.filter(
        Boolean
      ).length,
    total:
      NATIONAL_DEX_COUNT,
  }
}

export function readParty(bytes) {
  const block =
    getSaveBlock1(bytes)

  if (!block) {
    return null
  }

  const count =
    Math.min(
      block[
        PARTY_COUNT_OFFSET
      ],
      6
    )

  const pokemon = []

  for (
    let slot = 0;
    slot < count;
    slot++
  ) {
    const mon =
      parsePartyPokemon(
        block,
        slot
      )

    if (mon) {
      pokemon.push(mon)
    }
  }

  return {
    count:
      pokemon.length,
    pokemon,
  }
}

export function readPCStorage(
  bytes
) {
  const storage =
    getPokemonStorage(bytes)

  if (!storage) {
    return null
  }

  const currentBox =
    storage[0]

  const boxes = []

  let totalPokemon = 0
  let shinyCount = 0

  for (
    let boxIndex = 0;
    boxIndex < TOTAL_BOXES;
    boxIndex++
  ) {
    const nameOffset =
      STORAGE_BOX_NAMES_OFFSET +
      boxIndex *
        BOX_NAME_LENGTH

    const decodedName =
      decodePokemonText(
        storage,
        nameOffset,
        BOX_NAME_LENGTH
      )

    const box = {
      index: boxIndex,
      number: boxIndex + 1,
      name:
        decodedName ||
        `BOX ${boxIndex + 1}`,
      pokemon: [],
      occupied: 0,
    }

    for (
      let slot = 0;
      slot < BOX_SLOTS;
      slot++
    ) {
      const offset =
        STORAGE_BOXES_OFFSET +
        (
          boxIndex *
            BOX_SLOTS +
          slot
        ) *
          BOX_POKEMON_SIZE

      const raw =
        storage.slice(
          offset,
          offset +
            BOX_POKEMON_SIZE
        )

      const mon =
        parseBoxPokemon(raw)

      if (mon) {
        const pokemon = {
          ...mon,
          boxIndex,
          boxNumber:
            boxIndex + 1,
          boxName:
            box.name,
          slot,
          position:
            slot + 1,
        }

        box.pokemon.push(
          pokemon
        )

        box.occupied++
        totalPokemon++

        if (pokemon.shiny) {
          shinyCount++
        }
      }
    }

    boxes.push(box)
  }

  return {
    currentBox,
    currentBoxNumber:
      currentBox + 1,
    boxes,
    totalPokemon,
    shinyCount,
    capacity:
      TOTAL_BOXES *
      BOX_SLOTS,
  }
}