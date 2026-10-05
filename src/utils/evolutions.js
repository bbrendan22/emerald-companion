import { evolutions } from '../data/evolutionResources.js'
import { itemNames } from '../data/emeraldData.js'

export function evolutionMethod({ method, param }) {
  const level = `Level ${param}`
  switch (method) {
    case 'LEVEL': case 'LEVEL_NINJASK': return level
    case 'ITEM': return `Use ${itemNames[param]}`
    case 'TRADE': return 'Trade to another game'
    case 'TRADE_ITEM': return `Trade while holding ${itemNames[param]}`
    case 'FRIENDSHIP': return 'Level up · High friendship'
    case 'FRIENDSHIP_DAY': return 'Level up with friendship of 220 or higher, noon–11:59 PM (in-game clock)'
    case 'FRIENDSHIP_NIGHT': return 'Level up with friendship of 220 or higher, midnight–11:59 AM (in-game clock)'
    case 'LEVEL_ATK_GT_DEF': return `${level}, with Attack greater than Defense`
    case 'LEVEL_ATK_EQ_DEF': return `${level}, with Attack equal to Defense`
    case 'LEVEL_ATK_LT_DEF': return `${level}, with Attack lower than Defense`
    case 'LEVEL_SILCOON': return `${level} · Fixed personality`
    case 'LEVEL_CASCOON': return `${level} · Fixed personality`
    case 'LEVEL_SHEDINJA': return `Appears when Nincada evolves into Ninjask at level ${param} or higher, with an empty party slot`
    case 'BEAUTY': return `Level up with Beauty of ${param} or higher (raise Beauty with Pokéblocks)`
    default: throw new Error(`Unknown evolution method: ${method}`)
  }
}

// Game-specific exceptions; ordinary Gen III evolution methods stay shared.
export function gen3EvolutionMethods(entry) {
  if (entry.method === 'FRIENDSHIP_DAY' || entry.method === 'FRIENDSHIP_NIGHT') {
    const day = entry.method === 'FRIENDSHIP_DAY'
    return [{ games: null, method: `Level up · High friendship · ${day ? 'Day' : 'Night'}` }]
  }
  if (entry.method === 'BEAUTY') return [{ games: null, method: `Level up · Beauty ${entry.param}+` }]
  if (entry.method === 'LEVEL_SHEDINJA') return [{ games: null, method: `Nincada evolves at Level ${entry.param}+ · Empty party slot` }]
  return [{ games: null, method: evolutionMethod(entry) }]
}

export function previousEvolutions(id) {
  return Object.entries(evolutions).flatMap(([from, entries]) => entries.filter(entry => String(entry.target) === String(id)).map(entry => ({ ...entry, from })))
}

export function evolutionFamily(id) {
  const family = new Set([String(id)])
  for (const species of family) {
    for (const entry of evolutions[species] ?? []) family.add(String(entry.target))
    for (const entry of previousEvolutions(species)) family.add(entry.from)
  }
  return [...family]
}
