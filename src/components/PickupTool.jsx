import { useState } from 'react'
import ResourceHeading from './ResourceHeading'
import FitSelect from './FitSelect'
import { pyramidPickup } from '../data/pyramidPickup'
import { pickupGames } from '../data/pickupResources'
import { itemNames, moveNames } from '../data/emeraldData'
import { machineResources } from '../data/itemResources'
export default function PickupTool({onBack}) {
 const [game,setGame]=useState('Emerald')
 const [selected,setSelected]=useState('0')
 const pyramid=game==='Emerald · Battle Pyramid'
 const bands=pyramid ? pyramidPickup : pickupGames[game]
 const band=bands[Number(selected)] ?? bands[0]
 return <div className="resources-page resource-scroll-database-page resource-pickup-tool">
 <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><ResourceHeading>Pickup Tables</ResourceHeading></div>
 <div className="resource-pickup-filters"><label className="resource-pickup-level">Game<FitSelect value={game} onChange={event=>{setGame(event.target.value);setSelected('0')}}>{[...Object.keys(pickupGames),'Emerald · Battle Pyramid'].map(name=><option key={name} value={name}>{name==='Emerald · Battle Pyramid' ? 'Battle Pyramid' : name}</option>)}</FitSelect></label>
 {bands.length>1 && <label className="resource-pickup-level">{pyramid ? 'Round' : 'Level range'}<FitSelect value={selected} onChange={event=>setSelected(event.target.value)}>{bands.map((entry,index)=><option key={entry.round ?? entry.min} value={String(index)}>{pyramid ? (entry.round===20 ? '20+' : entry.round) : `${entry.min}–${entry.max}`}</option>)}</FitSelect></label>}</div>
 <p className="resource-pickup-note">10% chance after a win, while holding no item.</p>
 <div className="resource-pickup-list" tabIndex={0} aria-label="Pickup items"><div className="resource-pickup-columns"><span>Item</span><span>On Pickup</span><span>Per battle</span></div>{band.items.map(found=>{const machine=found.code ? machineResources.find(entry=>entry.code===found.code) : null;const name=machine ? `${found.code} · ${moveNames[machine.moveId]}` : itemNames[found.item];return <div className="resource-pickup-row" key={found.item}><div><img loading="lazy" src={`${import.meta.env.BASE_URL}items/${found.item}.png`} alt=""/><strong>{name}</strong></div><span>{found.chance}%</span><span>{Number((found.chance/10).toFixed(1))}%</span></div>})}</div>
 </div>
}
