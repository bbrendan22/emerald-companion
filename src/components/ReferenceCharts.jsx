import { useState } from 'react'
import ResourceHeading from './ResourceHeading'
import { ivNatures } from '../utils/ivCalculator'
import { emeraldTypes, typeMultiplier } from '../utils/typeMatchups'
const natureOrder=['attack','defense','speed','spAttack','spDefense']
const natureStats=[['attack','Atk'],['defense','Def'],['spAttack','SpA'],['spDefense','SpD'],['speed','Spe']]
export function BasicNatureChart({onBack}) {
 return <div className="resources-page resource-scroll-database-page resource-reference-page">
  <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><ResourceHeading>Nature Chart</ResourceHeading></div>
  <div className="resource-nature-legend"><span className="nature-increased">Rows: +10%</span><span className="nature-decreased">Columns: −10%</span><span>Gray: Neutral</span></div>
  <div className="resource-reference-content"><table className="resource-nature-matrix"><thead><tr><th scope="col">+ / −</th>{natureStats.map(([key,label])=><th scope="col" key={key} className="nature-decreased">{label}</th>)}</tr></thead><tbody>{natureStats.map(([up,label])=><tr key={up}><th scope="row" className="nature-increased">{label}</th>{natureStats.map(([down])=>{const neutral=up===down;const name=ivNatures[natureOrder.indexOf(up)*5+natureOrder.indexOf(down)];return <td key={down} className={neutral?'resource-nature-cell-neutral':undefined} aria-label={`${name}: ${neutral ? 'neutral' : `${label} increased 10%, ${natureStats.find(([key])=>key===down)[1]} decreased 10%`}`}>{name}</td>})}</tr>)}</tbody></table></div>
 </div>
}
export function BasicTypeChart({onBack}) {
 const [selectedAttack,setAttack]=useState(null)
 const [selectedDefense,setDefense]=useState(null)
 return <div className="resources-page resource-scroll-database-page resource-reference-page">
  <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><ResourceHeading>Type Chart</ResourceHeading></div>
  <div className="resource-type-matrix-legend"><span>Rows: Attack · Columns: Defense</span><span><b className="type-matrix-strong">2×</b> <b className="type-matrix-resisted">½×</b> <b className="type-matrix-immune">0×</b> Blank: 1×</span></div>
  <div className="resource-reference-content resource-type-matrix-scroll" tabIndex={0} aria-label="Gen III type chart"><table className="resource-type-matrix"><thead><tr><th scope="col">↓ / →</th>{emeraldTypes.map(type=><th key={type} scope="col" className={selectedDefense===type ? 'resource-type-selected-heading' : undefined}><button aria-label={`Select ${type.toLowerCase()} defense column`} aria-pressed={selectedDefense===type} onClick={()=>setDefense(current=>current===type ? null : type)}><img src={`${import.meta.env.BASE_URL}type-icons/${type.toLowerCase()}.png`} alt="" /></button></th>)}</tr></thead><tbody>{emeraldTypes.map(attack=><tr key={attack}><th scope="row" className={selectedAttack===attack ? 'resource-type-selected-heading' : undefined}><button aria-label={`Select ${attack.toLowerCase()} attack row`} aria-pressed={selectedAttack===attack} onClick={()=>setAttack(current=>current===attack ? null : attack)}><img src={`${import.meta.env.BASE_URL}type-icons/${attack.toLowerCase()}.png`} alt="" /></button></th>{emeraldTypes.map(defense=>{const multiplier=typeMultiplier(attack,[defense]);return <td key={defense} className={[multiplier===2?'type-matrix-strong':multiplier===0.5?'type-matrix-resisted':multiplier===0?'type-matrix-immune':'',selectedAttack===attack || selectedDefense===defense ? 'resource-type-highlight' : '',selectedAttack===attack && selectedDefense===defense ? 'resource-type-intersection' : ''].filter(Boolean).join(' ')} aria-label={`${attack} against ${defense}: ${multiplier}×`}>{multiplier===1 ? '' : multiplier===0.5 ? '½' : multiplier}</td>})}</tr>)}</tbody></table></div>
 </div>
}
