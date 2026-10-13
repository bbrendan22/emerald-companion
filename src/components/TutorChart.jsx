import {useState} from 'react'
import ResourceHeading from './ResourceHeading'
import FitSelect from './FitSelect'
import {moveNames} from '../data/emeraldData'
import {tutorChartGames,xdMewTutors} from '../data/tutorChart'
export default function TutorChart({onBack}){
 const [game,setGame]=useState('Emerald')
 const entries=[...tutorChartGames[game]].sort((a,b)=>moveNames[a.moveId].localeCompare(moveNames[b.moveId]))
 return <div className="resources-page resource-scroll-database-page resource-tutor-chart">
 <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><ResourceHeading>Move Tutors</ResourceHeading></div>
 <label className="resource-pickup-level">Game<FitSelect aria-label="Tutor game" value={game} onChange={event=>setGame(event.target.value)}>{Object.keys(tutorChartGames).map(name=><option key={name}>{name}</option>)}</FitSelect></label>
 <div className="tutor-chart-list">{entries.length ? <><div className="tutor-chart-columns"><span>Move / Location</span><span>Price</span></div>{entries.map(entry=><div className="tutor-chart-row" key={entry.moveId}><div><strong>{moveNames[entry.moveId]}</strong><small>{entry.location}{entry.side ? ` · ${entry.side}` : ''}</small><small>{entry.repeatable?'Repeatable':'Once per save'}{entry.requirement?` · ${(entry.requirement.includes(': ') ? entry.requirement.split(': ')[1] : entry.requirement)}`:''}</small></div><span>{entry.cost?`${entry.cost} BP`:'Free'}</span></div>)}</> : <p className="resource-note">Ruby and Sapphire have no move tutors. The Move Reminder in Fallarbor Town relearns level-up moves for one Heart Scale.</p>}{game==='XD'&&<><h3 className="tutor-chart-section">Mew Tutor</h3><p className="resource-note">Mew only · after the main story. 5,000 Poké Coupons buys a four-move set chosen through a questionnaire.</p>{[...xdMewTutors].sort((a,b)=>moveNames[a.moveId].localeCompare(moveNames[b.moveId])).map(entry=><div className="tutor-chart-row" key={`mew-${entry.moveId}`}><div><strong>{moveNames[entry.moveId]}</strong><small>{entry.location} · Repeatable</small></div><span>5,000<br/>Coupons</span></div>)}</>}</div>
 </div>
}
