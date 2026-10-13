import { previousEvolutions } from './evolutions.js'
import { levelMoves, eggMoves } from '../data/eggMoveResources.js'
import { crossGameMoves } from '../data/crossGameMoves.js'
import { machineResources } from '../data/itemResources.js'
import { tutorResources } from '../data/tutorResources.js'
import { pokemonMeta } from '../data/pokemonMeta.js'
import { moveNames } from '../data/emeraldData.js'
const namedOptions = names => Object.entries(names).filter(([id,name])=>Number(id)>0 && !/^(Item \d|Unused)/.test(name)).sort((a,b)=>a[1].localeCompare(b[1]))

export function speciesMoveOptions(id) {
  const family=new Set([String(id)])
  for(const species of family) for(const entry of previousEvolutions(species)) family.add(String(entry.from))
  const allowed=new Set()
  for(const species of family) {
    for(const entry of levelMoves[species] ?? []) allowed.add(entry.move)
    for(const move of eggMoves[species] ?? []) allowed.add(move)
    for(const entry of crossGameMoves[species] ?? []) allowed.add(entry.move)
    for(const entry of machineResources) if(entry.species.includes(Number(species))) allowed.add(entry.moveId)
    for(const entry of tutorResources) if(entry.species.includes(Number(species))) allowed.add(entry.moveId ?? entry.move)
  }
  // Sketch allows Smeargle to retain any Gen III move except Struggle.
  if(pokemonMeta[id]?.dex === 235) for(const [move,name] of namedOptions(moveNames)) if(name !== 'Struggle') allowed.add(Number(move))
  return namedOptions(moveNames).filter(([move]) => allowed.has(Number(move)))
}

