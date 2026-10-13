import {speciesGenders,partnerGenders} from '../utils/breeding'
import {previousEvolutions} from '../utils/evolutions'
import {useMemo,useState} from 'react'
import ResourceHeading from './ResourceHeading'
import PokemonSearchPicker from './PokemonSearchPicker'
import FitSelect from './FitSelect'
import {eggMoves} from '../data/eggMoveResources'
import {pokemonMeta} from '../data/pokemonMeta'
import {moveNames} from '../data/emeraldData'
import {eggMoveMothers,eggRequirements,findEggMoveFathers} from '../utils/eggMoveFathers'
const options=Object.entries(pokemonMeta).filter(([,meta])=>meta.dex>=1&&meta.dex<=386).map(([value,meta])=>({value,label:meta.name})).sort((a,b)=>a.label.localeCompare(b.label))
const name=id=>pokemonMeta[id].name
function eggSpecies(id){let current=id;for(let i=0;i<5;i++){const earlier=previousEvolutions(current)[0];if(!earlier)break;current=String(earlier.from)}return current}
export default function EggMoveTool({onBack}){
 const [id,setId]=useState('')
 const [move,setMove]=useState('')
 const [gender,setGender]=useState('')
 function choose(id){setId(id);setMove('');setGender(id?speciesGenders(id)[0]:'')}
 const eggId=id ? eggSpecies(id) : ''
 const partners=id ? options.map(option=>({...option,genders:partnerGenders(id,gender,option.value)})).filter(option=>option.genders.length>0) : []
 const fathers=useMemo(()=>id&&move ? findEggMoveFathers(eggId,Number(move)) : [],[id,eggId,move])
 const mothers=id ? eggMoveMothers(eggId) : []
 const requirements=id ? eggRequirements(eggId) : {}
 return <div className="resources-page resource-scroll-database-page resource-egg-tool">
 <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><ResourceHeading>Breeding</ResourceHeading><button className="resource-stats-reset" onClick={()=>choose('')}>Reset</button></div>
 <div className="egg-tool-controls"><PokemonSearchPicker label="Pokémon" value={id} options={options} onChange={choose}/><label>Gender<FitSelect aria-label="Parent gender" value={gender} disabled={!id || Boolean(move)} onChange={event=>setGender(event.target.value)}>{!id&&<option value="">Gender</option>}{id&&speciesGenders(id).map(g=><option key={g}>{g}</option>)}</FitSelect></label><label>Egg move<FitSelect aria-label="Egg move" value={move} disabled={!id || !eggMoves[eggId]?.length} onChange={event=>setMove(event.target.value)}><option value="">All partners</option>{id&&[...(eggMoves[eggId]??[])].sort((a,b)=>moveNames[a].localeCompare(moveNames[b])).map(m=><option key={m} value={String(m)}>{moveNames[m]}</option>)}</FitSelect></label></div>
 {id&&move&&<div className="egg-tool-mother"><span>Female parent:</span> {mothers.map(name).join(' / ') || '—'}{requirements.incense&&<small>Either parent needs {requirements.incense}.</small>}{requirements.randomOffspring&&<small>Eggs can hatch either {pokemonMeta[eggId].dex===29||pokemonMeta[eggId].dex===32?'Nidoran♀ or Nidoran♂':'Illumise or Volbeat'}.</small>}</div>}
 <div className="egg-tool-results">{!move ? !id ? <p className="resource-note">Choose a Pokémon to see compatible partners.</p> : <section><h3>Compatible Partners <span>{partners.length}</span></h3>{partners.map(partner=><div key={partner.value} className="egg-tool-partner"><img src={`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[partner.value].dex}.png`} alt=""/><div><strong>{partner.label}</strong><small>{partner.genders.join(' / ')}</small></div></div>)}{!partners.length&&<p className="resource-note">This Pokémon cannot breed.</p>}</section> :<>{[true,false].map(direct=>{const group=fathers.filter(f=>f.direct===direct);return group.length>0&&<section key={String(direct)}><h3>{direct?'Direct Fathers':'Breeding Chains'} <span>{group.length}</span></h3>{group.map(f=><details key={f.id} className="egg-tool-father"><summary><img src={`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[f.id].dex}.png`} alt=""/><div><strong>{name(f.id)}</strong><small>{direct ? `${f.method}${f.learner!==f.id ? ` · as ${name(f.learner)}` : ''}` : `${f.steps.length} intermediate step${f.steps.length===1?'':'s'}`}</small></div><span aria-hidden="true">⌄</span></summary><div className="egg-tool-route"><p>Start with {name(f.learner)} knowing {moveNames[move]} via {f.method}.{String(f.learner)!==String(f.steps[0]?.father??f.id)?` Evolve into ${name(f.steps[0]?.father??f.id)} while keeping the move.`:''}</p>{f.steps.map((step,index)=><p key={index}>{index+1}. Male {name(step.father)} + female {name(step.mother)} → hatch male {name(step.hatch)}{String(step.hatch)!==String(step.evolveTo)?`, then evolve into ${name(step.evolveTo)}`:''}.{step.incense?` Either parent needs ${step.incense}.`:''}{step.randomOffspring?` Keep hatching for ${name(step.hatch)}.`:''} Keep {moveNames[move]}.</p>)}<p>Male {name(f.id)} + female {f.mothers.map(name).join(' / ')} → {name(eggId)} with {moveNames[move]}.{requirements.incense?` Either parent needs ${requirements.incense}.`:''}</p></div></details>)}</section>})}{!fathers.length&&<p className="resource-note">No compatible fathers found.</p>}</>}</div>
 </div>
}
