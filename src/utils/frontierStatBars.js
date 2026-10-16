import {frontierPokemon} from '../data/frontierPokemon.js'
import {frontierBrainPokemon} from '../data/frontierBrains.js'
import {pokemonMeta} from '../data/pokemonMeta.js'
import {speciesInfo} from '../data/emeraldData.js'
import {emeraldStat} from './ivCalculator.js'

const keys = {hp:'hp',attack:'atk',defense:'def',spAttack:'spa',spDefense:'spd',speed:'spe'}
const species = new Map(Object.entries(pokemonMeta).map(([id,mon])=>[mon.name,Number(id)]))
const sets = [...frontierPokemon,...frontierBrainPokemon.filter(set=>!set.brainSet.startsWith('Noland'))]
const cache = new Map()

// The reference stays independent of the selected trainer. Ordinary sets use
// 31 IVs; Brain sets retain their fixed IVs. Cache only six maxima per level.
export function frontierStatMaximums(level) {
  if (cache.has(level)) return cache.get(level)
  const maximums = Object.fromEntries(Object.keys(keys).map(key => [key, 0]))
  for (const set of sets) {
    const base = speciesInfo[species.get(set.species)]?.baseStats
    if (!base) continue
    for (const [key, short] of Object.entries(keys)) {
      const value = emeraldStat(base[key], key, set.fixedIVs ?? 31, set.evs?.[short] ?? 0, level, set.nature)
      maximums[key] = Math.max(maximums[key], value)
    }
  }
  const result = Object.freeze(maximums)
  cache.set(level, result)
  return result
}

export function frontierStatBar(value, key, level) {
  const maximum = frontierStatMaximums(level)[key] ?? 0
  const numeric = Number(value)
  const ratio = maximum > 0 && Number.isFinite(numeric)
    ? Math.max(0, Math.min(1, numeric / maximum)) : 0
  return {maximum, width: Math.max(5, ratio * 100)}
}
