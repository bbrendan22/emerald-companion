import {useEffect,useState} from 'react'
import {pokemonMeta} from '../data/pokemonMeta'
import {BattleStill} from './BattleArtwork'

const names=new Map(Object.values(pokemonMeta).map(mon=>[mon.dex,mon.name]))
export default function BattleArtworkAudit(){
 const [open,setOpen]=useState(false)
 const [rows,setRows]=useState([])
 const [query,setQuery]=useState('')
 const [flagged,setFlagged]=useState(false)
 const [error,setError]=useState('')
 useEffect(()=>{
  if(!open)return
  const controller=new AbortController()
  fetch(`${import.meta.env.BASE_URL}__bdsp-sizing.json`,{signal:controller.signal}).then(response=>{if(!response.ok)throw new Error('Sizing report unavailable');return response.json()}).then(setRows).catch(error=>{if(error.name!=='AbortError')setError(error.message)})
  return()=>controller.abort()
 },[open])
 const filtered=rows.filter(row=>(!flagged||row.review)&&`${row.dex} ${names.get(row.dex)}`.toLowerCase().includes(query.toLowerCase()))
 return <details className="matchup-size-review matchup-full-audit" onToggle={event=>setOpen(event.currentTarget.open)}><summary>Full collection sizing review · all 386 Pokémon</summary>{open&&<>
  <p>Size targets visual bulk. Entire wings, tails, and horns remain visible. Flying and floating poses have a separate baseline. Amber entries hit a silhouette limit and remain visibly smaller.</p>
  <div className="matchup-audit-controls"><input type="search" aria-label="Find Pokémon in sizing review" placeholder="Name or Pokédex number" value={query} onChange={event=>setQuery(event.target.value)}/><label><input type="checkbox" checked={flagged} onChange={event=>setFlagged(event.target.checked)}/> Show shape exceptions ({rows.filter(row=>row.review).length})</label></div>
  <p role="status">{error||`${filtered.length} Pokémon · original / balanced / shiny`}</p>
  {filtered.map(row=><section key={row.dex} data-review={row.review}><strong>#{row.dex} {names.get(row.dex)}</strong><small className="matchup-audit-note">{row.airborne?'Flying / floating pose':'Grounded pose'}{row.review?' · size limited to keep the whole silhouette':row.limited?' · fit constrained':''}</small><div className="matchup-size-samples">{[[false,false,'Original'],[true,false,'Balanced'],[true,true,'Shiny']].map(([normalized,shiny,label])=><figure key={label}><BattleStill dex={row.dex} normalized={normalized} shiny={shiny} loading="lazy" name={`${names.get(row.dex)} ${label}`}/><figcaption>{label}</figcaption></figure>)}</div></section>)}
 </>}</details>
}
