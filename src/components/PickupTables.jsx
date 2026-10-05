import { useState } from 'react'
import { pickupBands } from '../data/pickupResources'
import { itemResources, machineResources } from '../data/itemResources'
import { itemNames, moveNames } from '../data/emeraldData'
export default function PickupTables({ initialLevel=1, onItem }){
 const [level,setLevel]=useState(String(initialLevel))
 const valid=level!==''&&Number.isInteger(Number(level))&&Number(level)>=1&&Number(level)<=100
 const band=valid?pickupBands[Math.floor((Number(level)-1)/10)]:null
 return <article className="resource-species">
 <div className="resource-species-hero"><span>EMERALD · GENERATION III</span><h2>Pickup Tables</h2></div>
 <section><label className="resources-search">Pokémon level<input aria-label="Pokémon level" type="number" inputMode="numeric" min="1" max="100" step="1" value={level} aria-invalid={!valid} onChange={e=>setLevel(e.target.value)}/></label>
 <p className="resource-note">A party Pokémon with Pickup and no held item has a 10% chance to find an item after an eligible battle. Take its item before it can pick up another.</p>
 <p className="resource-note">“If Pickup activates” shows the item distribution. “Per battle” includes the 10% activation chance for one eligible Pokémon.</p>
 {band?<><h3 aria-live="polite">Level {band.min}–{band.max}</h3><div className="resource-move-list">{band.items.map(found=>{const machine=found.code?machineResources.find(m=>m.code===found.code):null;const entry=machine?{...machine,machine:true,name:moveNames[machine.moveId]}:{...itemResources[found.item],id:String(found.item),name:itemNames[found.item]??itemResources[found.item].name};return <button key={found.item} onClick={()=>onItem(entry,Number(level))}><div><strong>{machine?`${entry.code} · ${entry.name}`:entry.name}</strong><small>If Pickup activates: {found.chance}%<br/>Per battle: {Number((found.chance/10).toFixed(1))}%</small></div><b aria-hidden="true">›</b></button>})}</div></>:<p role="status" className="resource-empty">Enter a whole-number level from 1 to 100.</p>}
 </section><p className="resource-note">These are the standard Emerald tables. Battle Pyramid uses a separate item pool; Pickup is disabled in Battle Pike.</p><p className="resource-note">Source: <a href="https://github.com/pret/pokeemerald/blob/master/src/battle_script_commands.c" target="_blank" rel="noreferrer">Emerald Pickup tables and activation logic</a>.</p>
 </article>
}
