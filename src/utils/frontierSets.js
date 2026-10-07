import { frontierTrainers } from '../data/frontierTrainers.js'

export const trainersBySet = new Map()
for (const trainer of frontierTrainers) {
  for (const setId of new Set(trainer.pokemonSetIds)) {
    const trainers = trainersBySet.get(setId) ?? []
    trainers.push(trainer)
    trainersBySet.set(setId, trainers)
  }
}

export function frontierTrainerSprite(trainerClass) {
  const triathlete = trainerClass.match(/^Triathlete \(([MF]) (runner|swimmer|biker)\)$/)
  if (triathlete) return `${{ runner:'running', swimmer:'swimming', biker:'cycling' }[triathlete[2]]}_triathlete_${triathlete[1].toLowerCase()}`
  return trainerClass.replace('Swimmer♂', 'Swimmer M').replace('Swimmer♀', 'Swimmer F').replace('PKMN', 'Pokemon').replace('Poké', 'Poke').replace(/[()]/g, '').toLowerCase().replace(/\s+/g, '_')
}
