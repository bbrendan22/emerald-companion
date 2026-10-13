import HiddenPowerManual from './HiddenPowerManual'
import FitSelect from './FitSelect'
import { hiddenPowerTypes, highestHiddenPowerIVs } from '../utils/hiddenPowerGuide'
import { useEffect, useRef, useState } from 'react'
import ResourceHeading from './ResourceHeading'
import StepInput from './StatStepInput'
import { calculateHiddenPower } from '../utils/hiddenPower'
const stats=[['hp','HP'],['attack','Atk'],['defense','Def'],['spAttack','SpA'],['spDefense','SpD'],['speed','Spe']]
const empty=()=>Object.fromEntries(stats.map(([key])=>[key,0]))
let sessionDraft=null
export default function HiddenPowerTool({onBack}) {
 const pageRef=useRef(null)
 const [ivs,setIVs]=useState(sessionDraft?.ivs ?? empty())
 const [resetCount,setResetCount]=useState(0)
 const [desiredType,setDesiredType]=useState(sessionDraft?.desiredType ?? '')
 useEffect(()=>{sessionDraft={ivs,desiredType}},[ivs,desiredType])
 useEffect(()=>{pageRef.current.style.setProperty('--stats-fixed-height',`${window.visualViewport?.height ?? window.innerHeight}px`)},[])
 function focusWithoutPanning(event){const input=event.target;if(event.pointerType!=='touch' || !(input instanceof HTMLInputElement))return;event.preventDefault();input.style.opacity='0';input.focus({preventScroll:true});requestAnimationFrame(()=>requestAnimationFrame(()=>{input.style.opacity=''}))}
 const normalized=Object.fromEntries(stats.map(([key])=>[key,ivs[key]==='' ? 0 : Number(ivs[key])]))
 const result=calculateHiddenPower(normalized)
 return <div ref={pageRef} onPointerDownCapture={focusWithoutPanning} className="resources-page resource-scroll-database-page resource-stats-tool resource-hidden-power-tool">
 <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><ResourceHeading>Hidden Power Calculator</ResourceHeading><button className="resource-stats-reset" onClick={()=>{setIVs(empty());setDesiredType('');setResetCount(count=>count+1)}}>Reset</button></div>
 <div className="resource-stats-results">
 <div className="resource-hp-iv-grid">{stats.map(([key,label],index)=><label key={key}>{label}<StepInput label={`${label} IV`} max={31} tabOrder={index+1} value={ivs[key]} onChange={value=>setIVs(current=>({...current,[key]:value}))}/></label>)}</div>
 <div className="resource-hidden-power-result" aria-live="polite">{result && <><div><span>Type</span><strong><img src={`${import.meta.env.BASE_URL}type-icons/${result.type.toLowerCase()}.png`} alt="" />{result.type}</strong></div><div><span>Power</span><strong>{result.power}</strong></div></>}</div>
 <div className="resource-hp-max-spread"><div className="resource-hp-section-heading"><h3>Highest IVs · Power 70</h3><FitSelect value={desiredType} onChange={event=>setDesiredType(event.target.value)}><option value="">Type</option>{hiddenPowerTypes.map(type=><option key={type}>{type}</option>)}</FitSelect></div>{desiredType && <div className="resource-hp-spread-values">{stats.map(([key,label])=><div key={key}><span>{label}</span><strong>{highestHiddenPowerIVs(desiredType)[key]}</strong></div>)}</div>}</div>
 <HiddenPowerManual key={resetCount} />
 </div></div>
}
