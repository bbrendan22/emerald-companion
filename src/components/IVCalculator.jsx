import { useState } from 'react'
import { pokemonMeta } from '../data/pokemonMeta'
import { speciesInfo } from '../data/emeraldData'
import { calculateIVRanges, ivStats, ivNatures } from '../utils/ivCalculator'
const species=Object.entries(pokemonMeta).filter(([,m])=>m.dex>=1&&m.dex<=386).sort((a,b)=>a[1].dex-b[1].dex)
const newReading=()=>({level:'',stats:Object.fromEntries(ivStats.map(([key])=>[key,''])),evs:Object.fromEntries(ivStats.map(([key])=>[key,'0']))})
export default function IVCalculator(){
 const [speciesId,setSpecies]=useState('')
 const [nature,setNature]=useState('Hardy')
 const [readings,setReadings]=useState([newReading()])
 const meta=pokemonMeta[speciesId]
 const result=calculateIVRanges(speciesInfo[speciesId]?.baseStats,nature,readings,meta?.dex===292)
 const update=(index,group,key,value)=>setReadings(previous=>previous.map((r,i)=>i!==index?r:group?{...r,[group]:{...r[group],[key]:value}}:{...r,[key]:value}))
 return <article className="resource-species">
 <div className="resource-species-hero"><span>EMERALD · GENERATION III</span><h2>IV Calculator</h2></div>
 <section><div className="resource-iv-inputs"><label>Species<select value={speciesId} onChange={e=>setSpecies(e.target.value)}><option value="">Choose Pokémon…</option>{species.map(([id,m])=><option key={id} value={id}>#{String(m.dex).padStart(3,'0')} {m.name}</option>)}</select></label><label>Nature<select value={nature} onChange={e=>setNature(e.target.value)}>{ivNatures.map(n=><option key={n}>{n}</option>)}</select></label></div>
 <p className="resource-note">Use the stats from the Pokémon’s summary screen, including maximum HP. EVs start at 0 here: use that only for an untrained Pokémon, or enter its known EVs. Leave any unknown stat blank.</p>
 {readings.map((reading,index)=><fieldset className="resource-iv-reading" key={index}><legend>Reading {index+1}</legend><label className="resource-iv-level">Level<input aria-label={`Reading ${index+1} level`} type="number" inputMode="numeric" min="1" max="100" value={reading.level} onChange={e=>update(index,null,'level',e.target.value)}/></label><div className="resource-iv-table"><span>Stat</span><span>Value</span><span>EVs</span>{ivStats.map(([key,label])=><div className="resource-iv-stat-row" key={key}><strong>{label}</strong><input aria-label={`Reading ${index+1} ${label} stat`} type="number" inputMode="numeric" min="1" max="999" value={reading.stats[key]} onChange={e=>update(index,'stats',key,e.target.value)}/><input aria-label={`Reading ${index+1} ${label} EVs`} type="number" inputMode="numeric" min="0" max="255" value={reading.evs[key]} onChange={e=>update(index,'evs',key,e.target.value)}/></div>)}</div>{readings.length>1&&<button className="resources-back" onClick={()=>setReadings(previous=>previous.filter((_,i)=>i!==index))}>Remove reading {index+1}</button>}</fieldset>)}
 <button className="resources-back" onClick={()=>setReadings(previous=>[...previous,newReading()])}>Add level reading</button>
 <p className="resource-note">Additional readings must be for the same Pokémon and species. Update EVs if it gained training between readings. Recalculate its stats by leveling up or depositing and withdrawing it first.</p>
 <div className="resource-hp-result" aria-live="polite">{result.error?<p>{result.error}</p>:<><h3>Possible IVs</h3><dl className="resource-iv-ranges">{ivStats.map(([key,label])=>{const values=result.ranges[key];return <div key={key}><dt>{label}</dt><dd>{values===null?'Enter stat':values.length===0?'No match':values.length===1?`${values[0]} · Exact`:`${values[0]}–${values.at(-1)}`}</dd></div>})}</dl>{Object.values(result.ranges).some(v=>v?.length===0)&&<p>Check the species, nature, level, stats, and EVs for the readings that disagree.</p>}</>}</div>
 {meta?.dex===292&&<p className="resource-note">Shedinja always has 1 HP, so its HP stat cannot reveal its HP IV.</p>}
 </section><p className="resource-note">Source: <a href="https://github.com/pret/pokeemerald/blob/master/src/pokemon.c" target="_blank" rel="noreferrer">Emerald stat and nature calculations</a>.</p>
 </article>
}
