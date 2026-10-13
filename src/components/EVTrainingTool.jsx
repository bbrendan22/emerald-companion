import {useEffect,useState} from 'react'
import ResourceHeading from './ResourceHeading'
import PokemonSearchPicker from './PokemonSearchPicker'
import StepInput from './StatStepInput'
import {pokemonMeta} from '../data/pokemonMeta'
import {evYields} from '../data/evResources'
import {evStats,emptyEVs,totalEVs,gainBattleEVs,trainingSpots} from '../utils/evTracker'
const options=Object.entries(pokemonMeta).filter(([,meta])=>meta.dex>=1&&meta.dex<=386).map(([value,meta])=>({value,label:meta.name})).sort((a,b)=>a.label.localeCompare(b.label))
const initial=()=>({species:'',target:'',evs:emptyEVs(),brace:false,pokerus:false,count:0,history:[],stat:'hp'})
function load(){try{return {...initial(),...JSON.parse(localStorage.getItem('emerald-ev-tracker'))}}catch{return initial()}}
export default function EVTrainingTool({onBack}){
 const [state,setState]=useState(load)
 useEffect(()=>{try{localStorage.setItem('emerald-ev-tracker',JSON.stringify(state))}catch{/* Tracker remains available in memory. */}},[state])
 const update=patch=>setState(old=>({...old,...patch}))
 const multiplier=(state.brace?2:1)*(state.pokerus?2:1)
 const target=pokemonMeta[state.target]
 const yieldText=id=>evStats.filter(([key])=>evYields[id]?.[key]>0).map(([key,label])=>`${evYields[id][key]*multiplier} ${label}`).join(' · ')
 function defeated(){setState(old=>{if(!old.target)return old;return {...old,evs:gainBattleEVs(old.evs,old.target,old.brace,old.pokerus),count:old.count+1,history:[...old.history,{evs:old.evs,count:old.count}].slice(-100)}})}
 function undo(){setState(old=>{const last=old.history.at(-1);return last?{...old,...last,history:old.history.slice(0,-1)}:old})}
 function editEV(key,value){setState(old=>{const other=totalEVs(old.evs)-Number(old.evs[key]||0);return {...old,evs:{...old.evs,[key]:value===''?'':Math.min(Number(value),255,510-other)},history:[]}})}
 return <div className="resources-page resource-scroll-database-page resource-ev-tool">
 <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><ResourceHeading>EV Training</ResourceHeading><button className="resource-stats-reset" onClick={()=>setState(initial())}>Reset</button></div>
 <div className="ev-tracker-fixed"><PokemonSearchPicker label="Training Pokémon" value={state.species} options={options} onChange={species=>update({species})}/>
 <div className="ev-tracker-values">{evStats.map(([key,label])=><label key={key}>{label}<StepInput label={`${label} EVs`} value={state.evs[key]} max={255} onChange={value=>editEV(key,value)}/></label>)}</div>
 <div className="ev-tracker-total"><strong>Total {totalEVs(state.evs)} / 510</strong><span>Defeated: {state.count}</span></div>
 <div className="ev-tracker-modifiers"><label><input type="checkbox" checked={state.brace} onChange={event=>update({brace:event.target.checked})}/>Macho Brace</label><label><input type="checkbox" checked={state.pokerus} onChange={event=>update({pokerus:event.target.checked})}/>Pokérus</label><span>{multiplier}×</span></div>
 <PokemonSearchPicker label="Defeated Pokémon" value={state.target} options={options} onChange={target=>update({target})}/>
 <div className="ev-tracker-target">{target&&<img src={`${import.meta.env.BASE_URL}sprites/emerald/${target.dex}.png`} alt=""/>}<span>{target ? `+${yieldText(state.target)} EVs` : 'Choose a target or tap a training spot.'}</span></div>
 <div className="ev-tracker-actions"><button disabled={!target} onClick={defeated}>+ Defeated</button><button disabled={!state.history.length} onClick={undo}>Undo</button></div></div>
 <div className="ev-training-spots"><h3>Emerald Training Spots</h3><div className="ev-stat-tabs">{evStats.map(([key,label])=><button key={key} aria-pressed={state.stat===key} onClick={()=>update({stat:key})}>{label}</button>)}</div>{trainingSpots(state.stat).map(spot=><section key={spot.name+spot.method}><h4>{spot.name}</h4><p>{spot.method}</p><div>{spot.targets.map(mon=><button key={mon.species} onClick={()=>update({target:String(mon.species)})}><img src={`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[mon.species].dex}.png`} alt=""/><span><strong>{pokemonMeta[mon.species].name}</strong><small>{yieldText(mon.species)} EVs · Lv. {mon.min}{mon.max!==mon.min ? `–${mon.max}` : ''} · {mon.rate}% encounters</small></span></button>)}</div></section>)}</div>
 </div>
}
