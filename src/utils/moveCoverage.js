import { pokemonMeta } from '../data/pokemonMeta.js'
import { evolutions } from '../data/evolutionResources.js'
import { frontierPokemon } from '../data/frontierPokemon.js'
import { typeMultiplier } from './typeMatchups.js'

export const coverageMultipliers=[0,0.25,0.5,1,2,4]
const frontierSpecies=new Set(frontierPokemon.map(set=>set.species.toLowerCase()))
export const coveragePokemon=Object.entries(pokemonMeta).filter(([,meta])=>meta.dex>=1 && meta.dex<=386 && meta.generation<=3).map(([id,meta])=>({id,...meta})).sort((a,b)=>a.dex-b.dex)
export function coverageRoster(mode) {
  return coveragePokemon.filter(pokemon=>mode==='fully' ? !(evolutions[pokemon.id]?.length) : mode==='frontier' ? frontierSpecies.has(pokemon.name.toLowerCase()) : true)
}
export function groupMoveCoverage(types,mode='all') {
  const groups=new Map(coverageMultipliers.map(multiplier=>[multiplier,[]]))
  if(!types.length) return groups
  for(const pokemon of coverageRoster(mode)) {
    const best=Math.max(...types.map(type=>typeMultiplier(type,pokemon.types)))
    groups.get(best).push(pokemon)
  }
  return groups
}
