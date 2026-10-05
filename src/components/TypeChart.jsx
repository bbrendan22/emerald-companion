import { useState } from 'react'
import { emeraldTypes, typeMultiplier } from '../utils/typeMatchups'
const name=type=>type[0]+type.slice(1).toLowerCase()
const groups=[[4,'4× weaknesses'],[2,'2× weaknesses'],[1,'Neutral'],[0.5,'½× resistances'],[0.25,'¼× resistances'],[0,'Immunities']]
export default function TypeChart(){
 const [first,setFirst]=useState('NORMAL')
 const [second,setSecond]=useState('')
 const results=emeraldTypes.map(type=>({type,multiplier:typeMultiplier(type,[first,second])}))
 return <article className="resource-species">
 <div className="resource-species-hero"><span>EMERALD · GENERATION III</span><h2>Type Chart</h2></div>
 <section><h3>Defending types</h3><div className="resource-iv-inputs"><label>Primary type<select aria-label="Primary type" value={first} onChange={e=>{setFirst(e.target.value);if(second===e.target.value)setSecond('')}}>{emeraldTypes.map(type=><option key={type} value={type}>{name(type)}</option>)}</select></label><label>Secondary type<select aria-label="Secondary type" value={second} onChange={e=>setSecond(e.target.value)}><option value="">None · Single type</option>{emeraldTypes.filter(t=>t!==first).map(type=><option key={type} value={type}>{name(type)}</option>)}</select></label></div><p className="resource-note">Choose the target’s types. Multipliers describe damage received from each attacking type. Abilities, move-specific rules, and battle effects are not included.</p></section>
 <section aria-live="polite" aria-atomic="true"><h3>{name(first)}{second?` / ${name(second)}`:''} matchups</h3>{groups.map(([multiplier,label])=>{const types=results.filter(r=>r.multiplier===multiplier);return types.length>0&&<div className="resource-type-group" key={multiplier}><h4>{label}</h4><div className="resource-types">{types.map(({type})=><span key={type}>{name(type)}</span>)}</div></div>})}</section>
 <p className="resource-note">Emerald has 17 types. Steel resists Ghost and Dark in this generation.</p>
 <p className="resource-note">Source: <a href="https://github.com/pret/pokeemerald/blob/master/src/battle_main.c" target="_blank" rel="noreferrer">Emerald type effectiveness table</a>.</p>
 </article>
}
