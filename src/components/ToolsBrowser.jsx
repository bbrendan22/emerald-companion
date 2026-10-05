import PickupTables from './PickupTables'
import TypeChart from './TypeChart'
import NatureChart from './NatureChart'
import IVCalculator from './IVCalculator'
import { useState } from 'react'
import { calculateHiddenPower } from '../utils/hiddenPower'
const stats = [['hp', 'HP'], ['attack', 'Attack'], ['defense', 'Defense'], ['spAttack', 'Sp. Attack'], ['spDefense', 'Sp. Defense'], ['speed', 'Speed']]
const emptyIVs = Object.fromEntries(stats.map(([key]) => [key, '']))
export default function ToolsBrowser({ onBack, onItem, initialTool=null, initialLevel=1 }) {
  const [tool, setTool] = useState(initialTool)
  const [ivs, setIVs] = useState(emptyIVs)
  const result = calculateHiddenPower(ivs)
  const invalid = stats.some(([key]) => ivs[key] !== '' && (!Number.isInteger(Number(ivs[key])) || Number(ivs[key]) < 0 || Number(ivs[key]) > 31))
  return <div className="resources-page">
    <button className="resources-back" onClick={tool ? () => setTool(null) : onBack}>← Back</button>
    {tool === 'pickup' ? <PickupTables initialLevel={initialLevel} onItem={onItem} /> : tool === 'type' ? <TypeChart /> : tool === 'nature' ? <NatureChart /> : tool === 'iv' ? <IVCalculator /> : tool ? <article className="resource-species">
      <div className="resource-species-hero"><span>EMERALD · GENERATION III</span><h2>Hidden Power Calculator</h2></div>
      <section><h3>Enter IVs</h3><p className="resource-note">Enter each IV from 0 to 31. The result updates as you type.</p>
        <div className="resource-iv-inputs">{stats.map(([key, label]) => <label key={key}>{label}<input type="number" inputMode="numeric" min="0" max="31" step="1" value={ivs[key]} aria-invalid={ivs[key] !== '' && (!Number.isInteger(Number(ivs[key])) || Number(ivs[key]) < 0 || Number(ivs[key]) > 31)} onChange={event => setIVs(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}</div>
        <button className="resources-back" onClick={() => setIVs(emptyIVs)}>Clear IVs</button>
        <div className="resource-hp-result" aria-live="polite" aria-atomic="true">{result ? <><span>Hidden Power type</span><strong>{result.type}</strong><span>Base power</span><b>{result.power}</b></> : <p>{invalid ? 'Each IV must be a whole number from 0 to 31.' : 'Enter all six IVs to see the type and power.'}</p>}</div>
      </section>
      <p className="resource-note">In Emerald, Hidden Power has 30–70 base power. Its type and power depend on IVs; EVs, nature, and level do not change the result.</p>
      <p className="resource-note">Source: <a href="https://github.com/pret/pokeemerald/blob/master/src/battle_script_commands.c" target="_blank" rel="noreferrer">Emerald’s Hidden Power calculation</a>.</p>
    </article> : <><div className="resource-list-heading"><h2>Tools & Charts</h2></div><div className="resources-categories"><button onClick={() => setTool('hidden-power')}><h2>Hidden Power</h2><p>Find the type and base power from six IVs.</p><b>Open calculator →</b></button><button onClick={() => setTool('iv')}><h2>IV Calculator</h2><p>Narrow down IVs from stats, EVs, nature, and level readings.</p><b>Open calculator →</b></button><button onClick={() => setTool('nature')}><h2>Nature Chart</h2><p>Stat boosts, reductions, and neutral natures.</p><b>Open chart →</b></button><button onClick={() => setTool('type')}><h2>Type Chart</h2><p>Single and dual-type weaknesses, resistances, and immunities.</p><b>Open chart →</b></button><button onClick={() => setTool('pickup')}><h2>Pickup Tables</h2><p>Level-based items and their chances in Emerald.</p><b>Open tables →</b></button></div></>}
  </div>
}
