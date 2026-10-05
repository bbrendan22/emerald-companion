import { encounterSummary } from '../utils/encounterSummary.js'

function splitLocation(name) {
  const match = name.match(/^(Abandoned Ship|Granite Cave|Mt\.? Pyre|Victory Road|Safari Zone|Meteor Falls|New Mauville|Seafloor Cavern|Cave Of Origin|Shoal Cave|Sky Pillar|Magma Hideout|Mirage Tower|Artisan Cave|Rock Tunnel|Mt\.? Moon|Seafoam Islands|Cerulean Cave|Pokemon Mansion|Pokémon Mansion|Pokemon Tower|Pokémon Tower|Mt\.? Ember|Icefall Cave|Lost Cave|Tanoby Ruins)\s+(.+)$/i)
  return match ? { parent: match[1], name: match[2] } : { parent: null, name }
}

export default function SpeciesLocationEntries({ locations, onLocation }) {
  const groups = new Map()
  for (const entry of locations) {
    const label = splitLocation(entry.location.name)
    const key = label.parent ?? entry.location.name
    if (!groups.has(key)) groups.set(key, { parent: label.parent, entries: [] })
    groups.get(key).entries.push({ ...entry, label: label.name })
  }
  return [...groups].map(([key, group]) => <div key={key} className={group.parent ? 'resource-location-family' : undefined}>
    {group.parent && <h4>{group.parent}</h4>}
    {group.entries.map(({ location, methods, requirements = [], label }) => <div className="resource-availability-row" key={location.id}>
      {onLocation ? <button className="resource-ability-link" onClick={() => onLocation(location)}>{label} →</button> : <strong>{label}</strong>}
      <div className="resource-location-rates">{methods.map(method => <p key={method.name}><strong>{method.name}</strong> · {encounterSummary(method.encounters)}</p>)}</div>
      {requirements.length > 0 && <details><summary>Requirements</summary>{requirements.map(note => <p key={note}>{note}</p>)}</details>}
    </div>)}
  </div>)
}
