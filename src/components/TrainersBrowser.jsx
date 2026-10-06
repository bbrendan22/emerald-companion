import { useState } from 'react'
import { trainerLocations } from '../data/trainerResources'
import { pokemonMeta } from '../data/pokemonMeta'
import { speciesDetails } from '../data/speciesDetails'
import { itemNames, moveNames } from '../data/emeraldData'
import ResourceTypeIcons from './ResourceTypeIcons'

function trainerLocation(name) {
 const match=name.match(/^(Route \d+|.+? (?:City|Town)|Abandoned Ship|Aqua Hideout|Magma Hideout|Meteor Falls|Mt Pyre|Ss Tidal|Seafloor Cavern|Victory Road)\s+(.+)$/)
 return match?{parent:match[1],specific:match[2]}:{parent:name,specific:null}
}

const trainers = trainerLocations.flatMap(location => location.trainers.map(trainer => ({ ...trainer, location:trainerLocation(location.name).parent, specific:trainerLocation(location.name).specific, key:`${location.id}:${trainer.id}` }))).sort((a,b) => a.name.localeCompare(b.name) || a.location.localeCompare(b.location))
const classes = [...new Set(trainers.map(trainer => trainer.class))].sort()
const locations = [...new Set(trainers.map(trainer => trainer.location))].sort((a,b) => a.localeCompare(b,undefined,{numeric:true}))

function TrainerFilter({label,value,options,onChange}) {
 const [open,setOpen]=useState(false)
 const text=value==='all'?label:value||label
 const textSize=text.length>23?10:text.length>16?11:text.length>10?12:14
 return <div className="resource-trainer-filter" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}} onKeyDown={event=>{if(event.key==='Escape')setOpen(false)}}>
  <button type="button" aria-label={label} aria-expanded={open} title={text} onClick={()=>setOpen(!open)}><span style={{fontSize:textSize}}>{text}</span><span className="resource-trainer-filter-arrow" aria-hidden="true"/></button>
  {open&&<div className="resource-trainer-filter-options">{['all',...options].map(option=><button type="button" key={option} aria-pressed={value===option} onClick={()=>{onChange(option);setOpen(false)}}>{option==='all'?'All':option}</button>)}</div>}
 </div>
}

function TrainerTeam({team}) {
 return <div className="resource-trainer-team">{team.map((mon,index)=>{const meta=pokemonMeta[mon.species];return <div className="resource-trainer-mon" key={index}>
        <div className="resource-trainer-portrait"><div className="resource-trainer-species"><img loading="lazy" src={`${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`} alt=""/></div></div>
        <div className="resource-trainer-mon-info"><div className="resource-trainer-mon-meta"><strong className="resource-trainer-name">{meta.name}</strong><span>Lv. {mon.level}</span></div><div className="resource-trainer-type-exp"><ResourceTypeIcons types={meta.types}/><span title="EXP for one participant, without EXP Share, Lucky Egg, or traded Pokémon bonuses">{Math.floor(Math.floor(speciesDetails[mon.species].expYield*mon.level/7)*1.5)} EXP</span></div>{mon.heldItem>0&&<small className="resource-trainer-held"><span><img src={`${import.meta.env.BASE_URL}items/${mon.heldItem}.png`} alt=""/>{itemNames[mon.heldItem]}</span></small>}</div><div className="resource-trainer-moves">{Array.from({length:4},(_,slot)=><span key={slot}>{moveNames[mon.moves[slot]]||'-'}</span>)}</div>
      </div>})}</div>
}

export default function TrainersBrowser({ onBack }) {
  const [search,setSearch] = useState('')
  const [trainerClass,setTrainerClass] = useState('')
  const [location,setLocation] = useState('')
  const query = search.trim().toLowerCase()
  const matches = trainers.filter(trainer => [trainer.name,trainer.class,trainer.location,trainer.specific].some(value=>value?.toLowerCase().includes(query)) && (!trainerClass || trainerClass==='all' || trainer.class===trainerClass) && (!location || location==='all' || trainer.location===location))
  return <div className="resources-page">
    <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><h2>Trainers</h2><span>{matches.length} entries</span></div>
    <div className="resource-database-controls resource-trainers-controls">
      <label className="resources-search"><input type="search" aria-label="Search trainers" placeholder="Search" value={search} onChange={event=>setSearch(event.target.value)}/></label>
      <TrainerFilter label="Class" value={trainerClass} options={classes} onChange={setTrainerClass}/>
      <TrainerFilter label="Location" value={location} options={locations} onChange={setLocation}/>
    </div>
    <div className="resource-trainer-list resource-trainers-table"><div className="resource-trainers-columns" aria-hidden="true"><span>Trainer</span><span>Location</span><span>Team</span><span>Prize Money</span></div>{matches.map(trainer=><details className="resource-trainer-card" key={trainer.key}>
      <summary><div className="resource-trainer-identity"><img loading="lazy" src={`${import.meta.env.BASE_URL}trainers/${trainer.sprite}.png`} alt=""/><div><strong>{trainer.name}</strong><small>{trainer.class}</small></div></div><span>{trainer.location}<small>{trainer.battleType??(trainer.double?'Double':'Single')}</small></span><span>{trainer.team.length}<small>Lv. {Math.min(...trainer.team.map(mon=>mon.level))}{Math.min(...trainer.team.map(mon=>mon.level))!==Math.max(...trainer.team.map(mon=>mon.level))?`–${Math.max(...trainer.team.map(mon=>mon.level))}`:''}</small></span><b>₽{trainer.prize.toLocaleString()}</b></summary>
      {trainer.variant&&<p className="resource-trainer-room">{trainer.variant}</p>}
      {trainer.specific&&<p className="resource-trainer-room">{trainer.specific}</p>}
      <TrainerTeam team={trainer.team}/>
      {trainer.rematches?.map((rematch,index)=><details className="resource-trainer-rematch" key={rematch.id}><summary><strong>{rematch.label??`Rematch ${index+1}`}</strong><span>{rematch.double?'Double':'Single'} · ₽{rematch.prize.toLocaleString()}</span></summary><TrainerTeam team={rematch.team}/></details>)}
    </details>)}</div>
    {!matches.length&&<p className="resource-empty">No results.</p>}
  </div>
}
