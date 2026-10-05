import SpeciesPanel from './SpeciesPanel'
import { evolutions } from '../data/evolutionResources.js'
import { pokemonMeta } from '../data/pokemonMeta.js'
import { gen3EvolutionMethods, previousEvolutions, evolutionFamily } from '../utils/evolutions.js'

export default function EvolutionSection({ id, onPokemon, embedded = false }) {
  const family = evolutionFamily(id)
  if (family.length === 1) return null
  const roots = family.filter(species => !previousEvolutions(species).length)
  const ordered = []
  const visit = species => { if (ordered.includes(species)) return; ordered.push(species); for (const entry of evolutions[species] ?? []) visit(String(entry.target)) }
  roots.forEach(visit)
  const link = species => <button className="resource-ability-link" aria-current={String(species)===String(id)?'true':undefined} onClick={() => onPokemon([String(species), pokemonMeta[species]])}><img loading="lazy" src={`${import.meta.env.BASE_URL}sprites/artwork/normal/${pokemonMeta[species].dex}.png`} alt="" /><strong>{pokemonMeta[species].name}</strong></button>
  return <SpeciesPanel embedded={embedded} anchor="evolutions" title="Full Evolution Chain">
    <div className="resource-family-members">{ordered.map(species=><div key={species}>{link(species)}{previousEvolutions(species).map(entry=><div key={entry.from}>{gen3EvolutionMethods(entry).map((rule,index)=><p className="resource-evolution-method" key={index}>{index===0 && `${pokemonMeta[entry.from]?.name} → `}{rule.games && <strong>{rule.games}: </strong>}{rule.method}</p>)}</div>)}</div>)}</div>
  </SpeciesPanel>
}
