import { useState } from 'react'
import { ivNatures } from '../utils/ivCalculator'
const stats = ['Attack', 'Defense', 'Speed', 'Sp. Attack', 'Sp. Defense']
const natures = ivNatures.map((name, index) => {
  const up = Math.floor(index / 5), down = index % 5
  return { name, raised: up === down ? null : stats[up], lowered: up === down ? null : stats[down] }
})
export default function NatureChart() {
  const [raised, setRaised] = useState('all')
  const [lowered, setLowered] = useState('all')
  const matches = natures.filter(n => (raised === 'all' || (raised === 'neutral' ? !n.raised : n.raised === raised)) && (lowered === 'all' || n.lowered === lowered))
  return <article className="resource-species">
    <div className="resource-species-hero"><span>EMERALD · GENERATION III</span><h2>Nature Chart</h2></div>
    <section><p className="resource-note">A non-neutral nature raises one stat by 10% and lowers another by 10%. HP is never affected. Neutral natures leave all stats unchanged.</p>
      <div className="resource-move-filters"><label className="resource-type-filter">Raises<select value={raised} onChange={e => setRaised(e.target.value)}><option value="all">Any / all natures</option><option value="neutral">Neutral only</option>{stats.map(stat => <option key={stat}>{stat}</option>)}</select></label><label className="resource-type-filter">Lowers<select value={lowered} onChange={e => setLowered(e.target.value)}><option value="all">Any stat</option>{stats.map(stat => <option key={stat}>{stat}</option>)}</select></label></div>
      <p className="resource-note" aria-live="polite">{matches.length} {matches.length === 1 ? 'nature' : 'natures'}</p>
      <table className="resource-nature-table"><caption>Nature stat modifiers</caption><thead><tr><th scope="col">Nature</th><th scope="col">Raises +10%</th><th scope="col">Lowers −10%</th></tr></thead><tbody>{matches.map(n => <tr key={n.name}><th scope="row">{n.name}</th>{n.raised ? <><td className="resource-nature-up">{n.raised}</td><td className="resource-nature-down">{n.lowered}</td></> : <td colSpan="2" className="resource-nature-neutral">Neutral · No stat changes</td>}</tr>)}</tbody></table>
      {!matches.length && <p className="resource-empty">No results.</p>}
    </section><p className="resource-note">Source: <a href="https://github.com/pret/pokeemerald/blob/master/src/pokemon.c" target="_blank" rel="noreferrer">Emerald nature stat table</a>.</p>
  </article>
}
