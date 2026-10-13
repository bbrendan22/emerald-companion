import { calculatorPokemonOptions } from '../utils/calculatorPokemonOptions'
import { useEffect, useRef, useState } from 'react'
import ResourceHeading from './ResourceHeading'
import PokemonSearchPicker from './PokemonSearchPicker'
import FitSelect from './FitSelect'
import StepInput from './StatStepInput'
import { pokemonMeta } from '../data/pokemonMeta'
import { speciesInfo } from '../data/emeraldData'
import { deoxysForms } from '../data/deoxysForms'
import { calculateIVRanges, emeraldStat, ivNatures, natureStatEffect } from '../utils/ivCalculator'

const stats=[['hp','HP'],['attack','Atk'],['defense','Def'],['spAttack','SpA'],['spDefense','SpD'],['speed','Spe']]
const spread=value=>Object.fromEntries(stats.map(([key])=>[key,value]))

let sessionDraft=null
export default function IVCalculatorTool({onBack}) {
 const pageRef=useRef(null)
 const [speciesId,setSpecies]=useState(sessionDraft?.speciesId ?? '')
 const [nature,setNature]=useState(sessionDraft?.nature ?? '')
 const [level,setLevel]=useState(sessionDraft?.level ?? '')
 const [observed,setObserved]=useState(sessionDraft?.observed ?? spread(''))
 const [evs,setEVs]=useState(sessionDraft?.evs ?? spread(0))
 const [form,setForm]=useState(sessionDraft?.form ?? 'speed')
 useEffect(()=>{sessionDraft={speciesId,nature,level,observed,evs,form}},[speciesId,nature,level,observed,evs,form])
 useEffect(()=>{pageRef.current.style.setProperty('--stats-fixed-height',`${window.visualViewport?.height ?? window.innerHeight}px`)},[])
 function focusWithoutPanning(event){const input=event.target;if(event.pointerType!=='touch' || !(input instanceof HTMLInputElement))return;event.preventDefault();input.style.opacity='0';input.focus({preventScroll:true});requestAnimationFrame(()=>requestAnimationFrame(()=>{input.style.opacity=''}))}
 function reset(){setSpecies('');setNature('');setLevel('');setObserved(spread(''));setEVs(spread(0));setForm('speed')}
 const meta=pokemonMeta[speciesId]
 const base=meta?.dex===386 ? deoxysForms[form].baseStats : speciesInfo[speciesId]?.baseStats
 const calculationNature=nature || 'Hardy'
 const normalizedEVs=Object.fromEntries(stats.map(([key])=>[key,evs[key]==='' ? 0 : Number(evs[key])]))
 const used=Object.values(normalizedEVs).reduce((a,b)=>a+b,0)
 const ready=base && level!=='' && Number.isInteger(Number(level)) && level>=1 && level<=100
 const result=ready ? calculateIVRanges(base,calculationNature,[{level,stats:observed,evs:normalizedEVs}],meta.dex===292) : null
 function range(key){if(!ready || used>510)return '—';const min=emeraldStat(base[key],key,0,normalizedEVs[key],Number(level),calculationNature,meta.dex===292);const max=emeraldStat(base[key],key,31,normalizedEVs[key],Number(level),calculationNature,meta.dex===292);return min===max ? String(min) : `${min}–${max}`}
 function ivRange(key){if(!result || result.error)return '—';const values=result.ranges[key];if(values===null)return '—';if(!values.length)return 'No match';return values.length===1 ? String(values[0]) : `${values[0]}–${values.at(-1)}`}
 return <div ref={pageRef} onPointerDownCapture={focusWithoutPanning} className="resources-page resource-scroll-database-page resource-stats-tool resource-iv-tool">
  <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><ResourceHeading>IV Calculator</ResourceHeading><button className="resource-stats-reset" onClick={reset}>Reset</button></div>
  <div className="resource-stats-controls"><div className="resource-stats-fields"><PokemonSearchPicker label="Pokémon" value={meta?.dex===386 ? `${speciesId}:${form}` : speciesId} options={calculatorPokemonOptions} onChange={value=>{const [id,form]=value.split(':');setSpecies(id);if(form)setForm(form)}}/><label>Nature<FitSelect value={nature} onChange={event=>setNature(event.target.value)}><option value="">Choose nature</option>{ivNatures.map(name=><option key={name}>{name}</option>)}</FitSelect></label></div><div className="resource-stats-fields"><label>Level<StepInput label="Level" value={level} min={1} max={100} allowBlank onChange={setLevel}/></label></div></div>
  <div className="resource-stats-results"><table className="resource-stats-calculator-table resource-iv-calculator-table"><colgroup><col style={{width:'30px'}}/><col/><col/><col style={{width:'30px'}}/><col style={{width:'58px'}}/><col style={{width:'48px'}}/></colgroup><thead><tr><th>Stat</th><th>Current</th><th>EV</th><th>Base</th><th>Range</th><th>IV</th></tr></thead><tbody>{stats.map(([key,label],index)=><tr key={key}><th className={natureStatEffect(nature,key)>0?'nature-increased':natureStatEffect(nature,key)<0?'nature-decreased':undefined}>{label}</th><td><StepInput min={1} allowBlank label={`${label} current stat`} value={observed[key]} max={999} tabOrder={index+1} onChange={value=>setObserved(current=>({...current,[key]:value}))}/></td><td><StepInput label={`${label} EV`} value={evs[key]} max={255} tabOrder={index+7} onChange={value=>setEVs(current=>({...current,[key]:value}))}/></td><td>{base?.[key] ?? '—'}</td><td>{range(key)}</td><td className={result?.ranges?.[key]?.length===0 ? 'resource-iv-no-match' : undefined}><strong>{ivRange(key)}</strong></td></tr>)}</tbody><tfoot><tr><th>Total</th><td>—</td><td>{used}</td><td>{base ? Object.values(base).reduce((a,b)=>a+b,0) : '—'}</td><td colSpan="2">EVs / 510</td></tr></tfoot></table>
   <div className="resource-stats-validation" role="status">{result?.error || (level!=='' && !ready && base ? 'Level must be 1–100.' : '')}</div>
  </div>
 </div>
}
