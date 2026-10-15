import {battleMoveEffectiveness} from '../utils/battleMoveEffectiveness'
import {actualBattleStats} from '../utils/battleStats'
import {moveResources} from '../data/moveResources'
import {useEffect,useRef,useState} from 'react'
import ResourceHeading from './ResourceHeading'
import FitSelect from './FitSelect'
import PokemonSearchPicker from './PokemonSearchPicker'
import ResourceTypeIcons from './ResourceTypeIcons'
import {pokemonMeta} from '../data/pokemonMeta'
import {speciesInfo,moveNames,itemNames} from '../data/emeraldData'
import {frontierPokemon} from '../data/frontierPokemon'
import {frontierTrainers} from '../data/frontierTrainers'
import {frontierBrainPokemon} from '../data/frontierBrains'
import {frontierTrainerSprite} from '../utils/frontierSets'
import {emeraldStat} from '../utils/ivCalculator'
import {emeraldTypes,typeMultiplier} from '../utils/typeMatchups'
import useResourceViewport from './useResourceViewport'
import './BattleWorkbench.css'
const stats=[['hp','HP','hp'],['attack','Atk','atk'],['defense','Def','def'],['spAttack','SpA','spa'],['spDefense','SpD','spd'],['speed','Spe','spe']]
const metadata=new Map(Object.entries(pokemonMeta).map(([id,meta])=>[meta.name.toLowerCase(),{...meta,id}]))
const brainClasses={Anabel:'Salon Maiden',Tucker:'Dome Ace',Spenser:'Palace Maven',Greta:'Arena Tycoon',Noland:'Factory Head',Lucy:'Pike Queen',Brandon:'Pyramid King'}
const brainSprites={Anabel:'salon_maiden_anabel',Tucker:'dome_ace_tucker',Spenser:'palace_maven_spenser',Greta:'arena_tycoon_greta',Noland:'factory_head_noland',Lucy:'pike_queen_lucy',Brandon:'pyramid_king_brandon'}
const brains=Object.entries(brainClasses).map(([name,trainerClass])=>({name,trainerClass,brain:true}))
const allSets=[...frontierPokemon.map(set=>({...set,key:set.id})),...frontierBrainPokemon.filter(set=>!set.brainSet.startsWith('Noland')).map((set,i)=>({...set,key:`brain-${i}`}))]
const bySet=new Map(allSets.map(set=>[set.key,set]))
const trainers=frontierTrainers.map((trainer,i)=>({...trainer,key:`trainer-${i}`,sprite:frontierTrainerSprite(trainer.trainerClass)}))
const title=name=>name.toLowerCase().replace(/(^|\s)\S/g,letter=>letter.toUpperCase())
const heldItemIds=new Map(Object.entries(itemNames).filter(([id])=>Number(id)>0).map(([id,name])=>[name.toLowerCase().replace(/[^a-z0-9]/g,''),id]))
const moveIds=new Map(Object.entries(moveNames).map(([id,name])=>[name,Number(id)]))
function moveData(move,index=0,bonuses=0){const id=typeof move==='object'?Number(move.id??move.move):moveIds.get(move)??Number(move);const data=moveResources[id];return {name:moveNames[id]||'—',type:data?.type,power:data?.power,effect:data?.effect,pp:data ? Math.floor(data.pp*(5+((Number(bonuses)>> (index*2))&3))/5) : null}}
const facilityBrains={Tower:'Anabel',Dome:'Tucker',Palace:'Spenser',Arena:'Greta',Factory:'Noland',Pike:'Lucy',Pyramid:'Brandon'}
const storageKey='emerald-battle-workbench-v1'
const initial=()=>({tab:'matchup',format:'Singles',level:50,facility:'Tower',iv:31,team:[],active:'',opponents:[],enemy:'',trainer:'',mode:'trainers',presets:[]})
function load(){try{const saved={...initial(),...JSON.parse(localStorage.getItem(storageKey))};saved.opponents=[...new Set(saved.opponents)].filter(key=>bySet.has(key)).slice(0,saved.format==='Doubles'?4:3);if(!saved.opponents.includes(saved.enemy))saved.enemy=saved.opponents[0]??'';return saved}catch{return initial()}}
function myView(mon){if(!mon)return null;const meta=pokemonMeta[mon.species];if(!meta)return null;const actual=actualBattleStats(mon);return {...meta,ivs:mon.ivs,nature:mon.nature||'Hardy',item:typeof mon.heldItem==='string'&&!/^\d+$/.test(mon.heldItem)?mon.heldItem:itemNames[mon.heldItem]||'None',ability:mon.ability||'Unknown',moves:(mon.moves??[]).map((move,index)=>moveData(move,index,mon.ppBonuses)),stats:actual.stats,level:actual.level}}
function enemyView(set,level,iv){if(!set)return null;const meta=metadata.get(set.species.toLowerCase());return {...meta,ivs:Object.fromEntries(stats.map(([key])=>[key,set.fixedIVs??iv])),name:`${meta.name}${set.instance?` ${set.instance}`:''}`,nature:set.nature,item:set.item||'None',ability:set.possibleAbility,moves:set.moves.map(move=>moveData(move)),level,stats:Object.fromEntries(stats.map(([key,,short])=>[key,emeraldStat(speciesInfo[meta.id].baseStats[key],key,set.fixedIVs??iv,set.evs[short]??0,level,set.nature,meta.dex===292)]))}}
function MatchupPanel({title,mon,other}){
 return <section aria-label={title} className="battle-matchup-panel battle-analysis-panel">{!mon?<p className="battle-empty">Select a Pokémon above.</p>:<>
 <div className="battle-summary"><img src={`${import.meta.env.BASE_URL}sprites/emerald/${mon.dex}.png`} alt=""/><div><strong>{mon.name}</strong><ResourceTypeIcons types={mon.types}/></div><div className="battle-summary-extra"><span>{mon.ability}</span><span className="battle-held-item">{heldItemIds.has(mon.item.toLowerCase().replace(/[^a-z0-9]/g,''))&&<img src={`${import.meta.env.BASE_URL}items/${heldItemIds.get(mon.item.toLowerCase().replace(/[^a-z0-9]/g,''))}.png`} alt=""/>}{mon.item}</span></div></div>
 <div className="battle-analysis-moves">{[0,1,2,3].map(i=>{const move=mon.moves[i];const result=battleMoveEffectiveness(move,other,mon.ivs);return <div key={`${mon.name}-${i}`}><ResourceTypeIcons types={result.type?[result.type]:[]}/><span className="battle-analysis-move-name">{move?.name||'—'}</span><small>{move?.pp!=null?`PP ${move.pp}`:''}</small><MoveEffectiveness result={result} name={move?.name}/></div>})}</div>
 <details className="battle-type-details"><summary>Stats & type matchups</summary><div className="battle-stat-line">{stats.map(([key,label])=><div key={key}><small>{label}</small><strong>{mon.stats[key]}</strong></div>)}</div><div className="battle-type-groups">{[4,2,1,0.5,0.25,0].map(mult=>{const types=emeraldTypes.filter(type=>typeMultiplier(type,mon.types)===mult);return types.length>0&&<div key={mult}><b>{mult}×</b><ResourceTypeIcons types={types}/></div>})}</div></details></>}</section>
}
function MoveEffectiveness({result,name}){
 const [open,setOpen]=useState(false)
 const ref=useRef(null)
 useEffect(()=>{if(!open)return;const dismiss=event=>{if(!ref.current?.contains(event.target))setOpen(false)};const escape=event=>{if(event.key==='Escape')setOpen(false)};document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape)}},[open])
 return <b ref={ref} className={result.multiplier>1?'battle-effective':result.multiplier<1?'battle-resisted':''}>{result.explanation?<><button className="battle-effect-help" aria-label={`${name}: special damage rules`} aria-expanded={open} onClick={()=>setOpen(value=>!value)}>*</button>{open&&<span role="status" className="battle-effect-explanation">{result.explanation}</span>}</>:result.label}</b>
}
function SpriteSlot({name,src,onSelect,onRemove}){
 const lastTap=useRef(null)
 return <button className="battle-sprite-slot" aria-label={name?`Select ${name}; double-tap to remove`:'Add Pokémon'} title={name?`${name} · Double-tap to remove`:'Add Pokémon'} onPointerUp={event=>{if(event.button!==0)return;const now=event.timeStamp;if(name&&lastTap.current!==null&&now-lastTap.current<350){lastTap.current=null;onRemove()}else{lastTap.current=now;onSelect()}}} onDoubleClick={event=>event.preventDefault()} onClick={event=>{if(event.detail===0)onSelect()}} onKeyDown={event=>{if(name&&(event.key==='Delete'||event.key==='Backspace')){event.preventDefault();onRemove()}}}>{src?<img src={src} alt={name}/>:<span>+</span>}</button>
}
export default function BattleWorkbench({collection,designations,getRole,saveData={}}){
 useResourceViewport()
 const pageRef=useRef(null)
 useEffect(()=>{pageRef.current.style.setProperty('--battle-fixed-height',`${window.visualViewport?.height ?? window.innerHeight}px`)},[])
 function focusWithoutPanning(event){const input=event.target;if(event.pointerType!=='touch'||!(input instanceof HTMLInputElement))return;event.preventDefault();input.style.opacity='0';input.focus({preventScroll:true});requestAnimationFrame(()=>requestAnimationFrame(()=>{input.style.opacity=''}))}
 const [state,setState]=useState(()=>{const saved=load();if(!saved.teamInitialized){if(!saved.team.length)saved.team=collection.filter(mon=>getRole(mon,designations)==='bf').slice(0,3).map(mon=>mon.companionId);saved.active=saved.team.includes(saved.active)?saved.active:saved.team[0]??'';saved.teamInitialized=true}return saved})
 useEffect(()=>{
  const viewport=window.visualViewport
  const size=()=>pageRef.current?.style.setProperty('--battle-picker-viewport',`${viewport?.height??window.innerHeight}px`)
  size();viewport?.addEventListener('resize',size)
  return()=>viewport?.removeEventListener('resize',size)
 },[])
 const [presetName,setPresetName]=useState('')
 const [opponentQuery,setOpponentQuery]=useState('')
 const [hiddenSets,setHiddenSets]=useState(()=>new Set())
 const gender=String(saveData.trainerGender??saveData.gender??'male').toLowerCase()
 const playerSprite=/female|girl|may/.test(gender)?'may.png':'brendan.png'
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(state))}catch{/* Keep the current battle in memory. */}},[state])
 const opponentLimit=state.format==='Doubles'?4:3
 const update=patch=>setState(old=>({...old,...patch}))
 const myPool=collection.filter(mon=>getRole(mon,designations)==='bf')
 const team=state.team.map(id=>collection.find(mon=>mon.companionId===id)).filter(Boolean)
 const mine=(team.length?team:myPool).find(mon=>mon.companionId===state.active)
 const facilityBrain=brains.find(t=>t.name===facilityBrains[state.facility])
 const trainer=trainers.find(t=>t.key===state.trainer) ?? (state.trainer===facilityBrain.name ? facilityBrain : null)
 const trainerImage=trainer ? trainer.brain?brainSprites[trainer.name]:trainer.sprite : null
 const opponentIV=state.facility==='Dome'?3:trainer?.ivs??Number(state.iv)
 const myMon=myView(mine);const opponent=enemyView(bySet.get(state.enemy),Number(state.level),opponentIV)
 const speedWinner=myMon&&opponent ? myMon.stats.speed>opponent.stats.speed?'my':myMon.stats.speed<opponent.stats.speed?'enemy':'tie':null
 const availableSets=(!trainer?allSets.filter(set=>!set.brainSet || set.brainSet.startsWith(`${facilityBrain.name} `)):trainer.brain?allSets.filter(set=>set.brainSet?.startsWith(`${trainer.name} `)):allSets.filter(set=>trainer.pokemonSetIds.includes(set.id)))
 const visibleSets=availableSets.filter(set=>!hiddenSets.has(set.key) && set.species.toLowerCase().startsWith(opponentQuery.trim().toLowerCase()))
 const duplicateMoveColors=(()=>{
  const counts=new Map();for(const set of visibleSets)for(const move of new Set(set.moves))counts.set(move,(counts.get(move)??0)+1)
  const palette=['#9b4f24','#7253a2','#287747','#a33762','#2c7283','#79631e']
  return new Map([...counts].filter(([,count])=>count>1).sort(([a],[b])=>a.localeCompare(b)).map(([move],index)=>[move,palette[index%palette.length]]))
 })()
 function addOpponent(key){setState(old=>{
  const set=bySet.get(key);if(!set)return old
  const brain=set.brainSet?.split(' ')[0]
  const nextTrainer=brain??(brains.some(t=>t.name===old.trainer)?'':old.trainer)
  const selected=nextTrainer===old.trainer ? old.opponents : []
  if(!selected.includes(key)&&selected.length>=(old.format==='Doubles'?4:3))return old
  return {...old,opponents:[...new Set([...selected,key])],enemy:key,trainer:nextTrainer,tab:'matchup'}
 })}

 function chooseTrainer(key){setHiddenSets(new Set());setOpponentQuery('');update({trainer:key,opponents:[],enemy:''})}
 function removeOpponent(key){setState(old=>{const opponents=old.opponents.filter(id=>id!==key);return {...old,opponents,enemy:old.enemy===key?opponents[0]??'':old.enemy}})}
 function removeMyPokemon(key){setState(old=>{const team=old.team.filter(id=>id!==key);return {...old,team,active:old.active===key?team[0]??'':old.active}})}
 function addTeam(id){if(state.team.length>=3)return;update({team:[...state.team,id],active:state.active||id})}
 return <div ref={pageRef} onPointerDownCapture={focusWithoutPanning} className="resources-page resource-scroll-database-page battle-workbench">
 <div className="resource-list-heading"><ResourceHeading>Battle</ResourceHeading></div>
 <div className="battle-active-selects battle-sprite-selects"><div><div className="battle-trainer-label"><img src={`${import.meta.env.BASE_URL}home/trainers/${playerSprite}`} alt="Your trainer"/><span>{saveData.trainerName || 'Trainer'}</span></div><div className="battle-sprite-slots">{Array.from({length:opponentLimit},(_,index)=>{const mon=team[index];return <SpriteSlot key={mon?.companionId??`empty-${index}`} name={mon?pokemonMeta[mon.species]?.name:null} src={mon?`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[mon.species].dex}.png`:null} onSelect={()=>mon?update({active:mon.companionId}):update({tab:'teams'})} onRemove={()=>removeMyPokemon(mon.companionId)}/>})}</div></div><div><div className="battle-trainer-label">{trainerImage&&<img src={`${import.meta.env.BASE_URL}trainers/${trainerImage}.png`} alt={trainer.name}/>}<span>{trainer?`${title(trainer.name)} · ${trainer.trainerClass}`:'Opponent'}</span></div><div className="battle-sprite-slots">{Array.from({length:opponentLimit},(_,index)=>{const set=bySet.get(state.opponents[index]);return <SpriteSlot key={set?.key??`empty-${index}`} name={set?set.id??`${set.species} ${set.brainSet}`:null} src={set?`${import.meta.env.BASE_URL}sprites/emerald/${metadata.get(set.species.toLowerCase()).dex}.png`:null} onSelect={()=>set?update({enemy:set.key}):update({tab:'opponent'})} onRemove={()=>removeOpponent(set.key)}/>})}</div></div></div>
 <nav className="resource-profile-tabs battle-tabs">{[['matchup','Matchup'],['opponent','Opponent'],['teams','Teams'],['rules','Rules']].map(([key,label])=><button key={key} aria-pressed={state.tab===key} className={state.tab===key?'active':''} onClick={()=>update({tab:key})}>{label}</button>)}</nav>
 <div className="battle-tab-content">
 {state.tab==='matchup'&&<div className="battle-matchup battle-matchup-columns"><div className="battle-level-label">Frontier · Level {state.level}</div><div className="battle-speed-row"><span>{speedWinner==='my'?'Faster':speedWinner==='tie'?'Tie':''}</span><span>{speedWinner==='enemy'?'Faster':speedWinner==='tie'?'Tie':''}</span></div><MatchupPanel title="Your Pokémon" mon={myMon} other={opponent}/><MatchupPanel title={trainer?`${title(trainer.name)} · ${trainer.trainerClass}`:'Opponent'} mon={opponent} other={myMon}/></div>}
 {state.tab==='opponent'&&<><div className="battle-trainer-search"><PokemonSearchPicker label="Trainer" placeholder="Search trainer or class" hideEmptyMessage value={state.trainer} options={[...trainers,facilityBrain].map(t=>({value:t.key??t.name,label:`${title(t.name)} · ${t.trainerClass}`}))} onChange={chooseTrainer}/></div><label className="battle-set-search">Pokémon sets<input type="search" aria-label="Search opponent Pokémon" placeholder="Search Pokémon name…" value={opponentQuery} onChange={event=>setOpponentQuery(event.target.value)}/></label>{hiddenSets.size>0&&<button className="battle-restore-candidates" onClick={()=>setHiddenSets(new Set())}>Restore hidden ({hiddenSets.size})</button>}<p className="battle-opponent-count">Selected {state.opponents.length}/{opponentLimit}{state.opponents.length>=opponentLimit ? ' · Remove a selected opponent in Matchup to add another.' : ''}</p><div className="battle-opponent-list">{visibleSets.map(set=>{const view=enemyView(set,Number(state.level),set.brainSet ? set.fixedIVs : opponentIV);return <div className="battle-set-entry" key={set.key}><button className="battle-set-select" disabled={state.opponents.length>=opponentLimit&&!state.opponents.includes(set.key)} onClick={()=>addOpponent(set.key)}><img src={`${import.meta.env.BASE_URL}sprites/emerald/${view.dex}.png`} alt=""/><div className="battle-set-body"><div className="battle-set-heading"><strong>{set.species}{set.instance?` ${set.instance}`:''}</strong><small>{set.item}</small>{set.brainSet&&<small>{set.brainSet}</small>}</div><div className="battle-set-stats">{stats.map(([key,label])=><span key={key}><small>{label}</small><b>{view.stats[key]}</b></span>)}</div><div className="battle-set-moves">{set.moves.map((move,i)=><span key={i}>{i>0&&<span className="battle-move-separator"> · </span>}<span style={{color:duplicateMoveColors.get(move)}}>{move}</span></span>)}</div></div></button><button className="battle-hide-set" aria-label={`Hide ${set.brainSet?`${set.species} ${set.brainSet}`:set.id}`} onClick={()=>setHiddenSets(old=>new Set([...old,set.key]))}>×</button></div>})}</div></>}
 {state.tab==='teams'&&<><div className="battle-team-search"><PokemonSearchPicker label="BF Trained Pokémon" value="" options={myPool.filter(mon=>!team.some(other=>other.species===mon.species)).map(mon=>({value:mon.companionId,label:`${pokemonMeta[mon.species].name}${mon.nickname?` · ${mon.nickname}`:''}`}))} onChange={addTeam}/></div><h3>Current Team · {team.length}/3</h3><div className="battle-team-members">{team.map(mon=><div key={mon.companionId}><SpriteSlot name={pokemonMeta[mon.species].name} src={`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[mon.species].dex}.png`} onSelect={()=>update({active:mon.companionId,tab:'matchup'})} onRemove={()=>removeMyPokemon(mon.companionId)}/><strong>{pokemonMeta[mon.species].name}</strong></div>)}</div><div className="battle-save-team"><input aria-label="Team name" placeholder="Team name" value={presetName} onChange={event=>setPresetName(event.target.value)}/><button disabled={!team.length||!presetName.trim()} onClick={()=>{update({presets:[...state.presets.filter(team=>team.name!==presetName.trim()),{name:presetName.trim(),ids:state.team}]});setPresetName('')}}>Save</button></div><h3>Saved Teams</h3>{state.presets.map(preset=><div className="battle-preset" key={preset.name}><button onClick={()=>update({team:preset.ids,active:preset.ids[0]??'',tab:'matchup'})}><strong>{preset.name}</strong><small>{preset.ids.map(id=>collection.find(mon=>mon.companionId===id)).filter(Boolean).map(mon=>pokemonMeta[mon.species].name).join(' · ')}</small></button><button aria-label={`Delete team ${preset.name}`} onClick={()=>update({presets:state.presets.filter(team=>team.name!==preset.name)})}>×</button></div>)}{!myPool.length&&<p className="battle-empty">Mark Pokémon as BF Trained in My Pokémon to build a team.</p>}</>}
 {state.tab==='rules'&&<div className="battle-rules"><label>Level<FitSelect aria-label="Battle level" value={state.level} onChange={event=>update({level:Number(event.target.value)})}><option value={50}>Level 50</option><option value={100}>Level 100</option></FitSelect></label><label>Facility<FitSelect aria-label="Frontier facility" value={state.facility} onChange={event=>{setHiddenSets(new Set());update({facility:event.target.value,trainer:trainer?.brain?'':state.trainer,opponents:[],enemy:''})}}>{['Tower','Dome','Palace','Arena','Factory','Pike','Pyramid'].map(name=><option key={name}>{name}</option>)}</FitSelect></label><label>Format<FitSelect aria-label="Battle format" value="Singles"><option>Singles</option></FitSelect></label><label>Opponent IVs<FitSelect aria-label="Opponent IVs" value={opponentIV} disabled={Boolean(trainer)||state.facility==='Dome'} onChange={event=>update({iv:Number(event.target.value)})}>{[3,6,9,12,15,18,21,31].map(iv=><option key={iv} value={iv}>{iv}</option>)}</FitSelect></label><p>Stats use the selected level. Trainer IVs and fixed Brain IVs apply automatically. Type matchups show typing only.</p></div>}
 </div></div>
}
