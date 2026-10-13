import { useState } from 'react'
import { hiddenPowerTypes, hiddenPowerTestTargets, nextHiddenPowerTest, testEffectiveness } from '../utils/hiddenPowerGuide'
export default function HiddenPowerManual() {
 const [method,setMethod]=useState('')
 const [steps,setSteps]=useState([])
 let candidates=[...hiddenPowerTypes]
 for(const step of steps)candidates=candidates.filter(type=>testEffectiveness(type,step.target)===step.result)
 const target=steps.length ? nextHiddenPowerTest(candidates) : hiddenPowerTestTargets[0]
 function reset(){setMethod('');setSteps([])}
 const found=candidates.length===1 ? candidates[0] : ''
 return <div className="resource-hp-manual"><div className="resource-hp-section-heading"><h3>In-game type test</h3>{method && <button onClick={reset}>Start over</button>}</div>
 {!method ? <><p>Kecleon reveals Hidden Power’s type with Color Change. Or test on a pure Psychic-type Pokémon like Abra.</p><div className="resource-hp-test-actions"><button onClick={()=>setMethod('psychic')}>Start type test</button></div></> : found ? null : <><p>Use Hidden Power on <strong>{target.name}</strong> (pure {target.type[0]+target.type.slice(1).toLowerCase()}). What happens?</p><div className="resource-hp-test-actions">{[0,0.5,1,2].filter(value=>candidates.some(type=>testEffectiveness(type,target)===value)).map(value=><button key={value} onClick={()=>setSteps(current=>[...current,{target,result:value}])}>{value===0 ? 'No effect' : value===0.5 ? 'Not very effective' : value===1 ? 'Normal damage' : 'Super effective'}</button>)}</div><span className="resource-hp-remaining">{candidates.length} possible types</span></>}
 {found && <div className="resource-hp-test-result"><img src={`${import.meta.env.BASE_URL}type-icons/${found.toLowerCase()}.png`} alt="" /><strong>{found}</strong><span>Power requires IVs.</span></div>}
 {steps.length>0 && <button className="resource-hp-test-back" onClick={()=>setSteps(current=>current.slice(0,-1))}>← Previous test</button>}
 </div>
}
