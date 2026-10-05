import { pokemonMeta } from '../data/pokemonMeta.js'
import { mergedLevelLearnset, gameTutorSources } from '../utils/gameLearnsets.js'
import { crossGameLearnset } from '../utils/crossGameLearnset.js'
import { machineResources } from '../data/itemResources.js'
import { tutorResources } from '../data/tutorResources.js'
import { eggMoves } from '../data/eggMoveResources.js'
import { descendants } from '../utils/eggMoveFathers.js'

const cache = new Map()
function learners(move) {
  if (cache.has(move)) return cache.get(move)
  const groups = { 'Level-up':[], 'TMs / HMs':[], 'Move tutors':[], 'Egg moves':[], 'Special moves':[] }
  const eggs = new Set(Object.entries(eggMoves).filter(([,moves]) => moves.includes(move)).flatMap(([id]) => descendants(id)))
  const machines = new Set(machineResources.filter(entry => entry.moveId === move).flatMap(entry => entry.species.map(String)))
  const tutors = new Set(tutorResources.filter(entry => entry.moveId === move).flatMap(entry => entry.species.map(String)))
  for (const [id,meta] of Object.entries(pokemonMeta).sort((a,b) => a[1].dex-b[1].dex)) {
    const entry = [id,meta]
    if (mergedLevelLearnset(id).some(row => row.move === move)) groups['Level-up'].push(entry)
    if (machines.has(id)) groups['TMs / HMs'].push(entry)
    if (tutors.has(id) || gameTutorSources(id).some(source => source.move === move)) groups['Move tutors'].push(entry)
    if (eggs.has(id) || (move === 344 && [172,25,26].includes(meta.dex))) groups['Egg moves'].push(entry)
    if (crossGameLearnset(id).some(row => row.move === move && row.sources.some(source => ['Purification','Gift Egg','Mt. Battle reward'].includes(source.method)))) groups['Special moves'].push(entry)
  }
  cache.set(move,groups)
  return groups
}

export default function MoveLearners({ move, onPokemon }) {
  return <section className="resource-move-learners"><h3>Pokémon that can learn this move</h3>
    {Object.entries(learners(Number(move))).filter(([,entries]) => entries.length).map(([method,entries]) => <details key={method} open><summary>{method} · {entries.length}</summary><div className="resource-move-learner-grid">{entries.map(([id,meta]) => <button key={id} onClick={() => onPokemon([id,meta])}><img loading="lazy" src={`${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`} alt="" /><span>{meta.name}</span></button>)}</div></details>)}
  </section>
}
