import {retaliationPreview} from '../utils/battleRetaliation'
import {battleSpeedValues,displayedBattleStat,possibleAbilities} from '../utils/battleConditions'
import {calculateBattleDamage} from '../utils/battleDamage'
import {battleMoveEffectiveness} from '../utils/battleMoveEffectiveness'
import {actualBattleStats} from '../utils/battleStats'
import {moveResources} from '../data/moveResources'
import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import FitSelect from './FitSelect'
import ResourceTypeIcons from './ResourceTypeIcons'
import {pokemonMeta} from '../data/pokemonMeta'
import {speciesInfo,moveNames,itemNames} from '../data/emeraldData'
import {frontierPokemon} from '../data/frontierPokemon'
import {frontierTrainers} from '../data/frontierTrainers'
import {frontierBrainPokemon} from '../data/frontierBrains'
import {frontierTrainerSprite} from '../utils/frontierSets'
import {emeraldStat} from '../utils/ivCalculator'
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
function moveData(move,index=0,bonuses=0){const id=typeof move==='object'?Number(move.id??move.move):moveIds.get(move)??Number(move);const data=moveResources[id];return {name:moveNames[id]||'—',type:data?.type,power:data?.power,accuracy:data?.accuracy,effect:data?.effect,pp:data ? Math.floor(data.pp*(5+((Number(bonuses)>> (index*2))&3))/5) : null}}
const facilityBrains={Tower:'Anabel',Dome:'Tucker',Palace:'Spenser',Arena:'Greta',Factory:'Noland',Pike:'Lucy',Pyramid:'Brandon'}
const storageKey='emerald-battle-workbench-v1'
const initial=()=>({tab:'matchup',format:'Singles',level:50,facility:'Tower',iv:31,team:[],active:'',opponents:[],enemy:'',trainer:'',mode:'trainers',presets:[]})
function load(){try{const saved={...initial(),...JSON.parse(localStorage.getItem(storageKey))};saved.opponents=[...new Set(saved.opponents)].filter(key=>bySet.has(key)).slice(0,saved.format==='Doubles'?4:3);if(!saved.opponents.includes(saved.enemy))saved.enemy=saved.opponents[0]??'';return saved}catch{return initial()}}
function myView(mon){if(!mon)return null;const meta=pokemonMeta[mon.species];if(!meta)return null;const actual=actualBattleStats(mon);return {...meta,shiny:mon.shiny,friendship:mon.friendship,ivs:mon.ivs,nature:mon.nature||'Hardy',item:typeof mon.heldItem==='string'&&!/^\d+$/.test(mon.heldItem)?mon.heldItem:itemNames[mon.heldItem]||'None',ability:mon.ability||'Unknown',moves:(mon.moves??[]).map((move,index)=>moveData(move,index,mon.ppBonuses)),stats:actual.stats,level:actual.level}}
function enemyView(set,level,iv){if(!set)return null;const meta=metadata.get(set.species.toLowerCase());return {...meta,abilityOptions:possibleAbilities({ability:set.possibleAbility}),friendship:set.moves.includes('Frustration')?0:255,ivs:Object.fromEntries(stats.map(([key])=>[key,set.fixedIVs??iv])),name:`${meta.name}${set.instance?` ${set.instance}`:''}`,nature:set.nature,item:set.item||'None',ability:set.possibleAbility,moves:set.moves.map(move=>moveData(move)),level,stats:Object.fromEntries(stats.map(([key,,short])=>[key,emeraldStat(speciesInfo[meta.id].baseStats[key],key,set.fixedIVs??iv,set.evs[short]??0,level,set.nature,meta.dex===292)]))}}
function BattleSummaryDetails({mon}){
 const root=useRef(null)
 useLayoutEffect(()=>{
  const node=root.current
  const fit=()=>{for(const line of node.children){let size=9;line.style.fontSize=`${size}px`;while(line.scrollWidth>line.clientWidth&&size>7){size-=.25;line.style.fontSize=`${size}px`}}}
  fit();const observer=new ResizeObserver(fit);observer.observe(node)
  return()=>observer.disconnect()
 },[mon.ability,mon.item])
 const itemId=heldItemIds.get(mon.item.toLowerCase().replace(/[^a-z0-9]/g,''))
 return <div ref={root} className="battle-summary-extra"><span className="battle-held-item"><span className="battle-item-centered-text">{itemId&&<img src={`${import.meta.env.BASE_URL}items/${itemId}.png`} alt=""/>}{mon.item}</span></span><span className="battle-summary-abilities">{mon.ability}</span></div>
}
function MatchupPanel({title,mon,other,onMove}){
 if(!mon)return null
 return <section aria-label={title} className={`battle-matchup-panel battle-analysis-panel ${title==='Your Pokémon'?'battle-player-panel':'battle-enemy-panel'}`}><>
 <div className="battle-summary"><img src={`${import.meta.env.BASE_URL}sprites/emerald/${mon.shiny?'shiny/':''}${mon.dex}.png`} alt=""/><div><strong>{mon.name}</strong><ResourceTypeIcons types={mon.types}/></div><BattleSummaryDetails mon={mon}/></div>
 <div className="battle-stat-line">{stats.map(([key,label])=><div key={key}><small>{label}</small><strong className={key==='speed'&&other&&Math.min(...battleSpeedValues(mon,other))>Math.max(...battleSpeedValues(other,mon))?'battle-higher-speed':undefined}>{key==='speed'?battleSpeedValues(mon,other).join('/'):displayedBattleStat(mon,key)}</strong></div>)}</div>
 <div className="battle-analysis-moves">{[0,1,2,3].map(i=>{const move=mon.moves[i];const result=battleMoveEffectiveness(move,other,mon.ivs,mon);return <div key={`${mon.name}-${i}`} data-move-type={result.type}><ResourceTypeIcons types={result.type?[result.type]:[]}/><button type="button" className="battle-analysis-move-name battle-damage-trigger" disabled={!move} onClick={event=>onMove({move,attacker:mon,defender:other,anchor:event.currentTarget})}>{move?.name||'—'}</button><small>{move?.pp!=null?`PP ${move.pp}`:''}</small><MoveEffectiveness result={result} name={move?.name} onClick={event=>onMove({move,attacker:mon,defender:other,anchor:event.currentTarget})}/></div>})}</div>

</></section>
}
function BattleConditionSide({mon,side,onHp,onCondition,onScreens}){
 if(!mon)return null
 return <section className={`battle-condition-side battle-hp-conditions ${side}`}><div className="battle-condition-heading"><h4>{mon.name}</h4>{side==='enemy'&&mon.abilityOptions?.length>1&&<label className="battle-ability-field"><FitSelect maxFontSize={10} aria-label="Opponent ability" value={mon.abilitySelection??''} onChange={event=>onCondition({abilitySelection:event.target.value})}><option value="">Ability</option>{mon.abilityOptions.map(ability=><option key={ability} value={ability}>{ability}</option>)}</FitSelect></label>}</div><div className="battle-hp-input-row"><label>Current HP <span><input type="number" inputMode="numeric" aria-label={`${mon.name} current HP`} min="0" max={mon.stats.hp} value={mon.currentHp} onChange={event=>onHp(Math.max(0,Math.min(mon.stats.hp,Number(event.target.value))))}/><small>/ {mon.stats.hp}</small></span></label></div><div className="battle-condition-fields"><label className="battle-status-field">Status<FitSelect aria-label={`${mon.name} status`} value={mon.status??'none'} onChange={event=>onCondition({status:event.target.value})}>{[['none','None'],['burn','Burn'],['paralysis','Paralysis'],['poison','Poison'],['toxic','Bad poison'],['sleep','Sleep'],['freeze','Freeze']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</FitSelect></label>{stats.filter(([key])=>key!=='hp').map(([key,label])=><label key={key}>{label}<FitSelect aria-label={`${mon.name} ${label} stage`} value={mon.stages?.[key]??0} onChange={event=>onCondition({stages:{...mon.stages,[key]:Number(event.target.value)}})}>{Array.from({length:13},(_,i)=>i-6).map(n=><option key={n} value={n}>{n>0?`+${n}`:n}</option>)}</FitSelect></label>)}</div><div className="battle-screen-fields">{[['reflect','Reflect'],['lightScreen','Light Screen']].map(([key,label])=><label key={key}><input type="checkbox" checked={Boolean(mon.screens?.[key])} onChange={event=>onScreens({...mon.screens,[key]:event.target.checked})}/>{label}</label>)}</div></section>
}
function MoveEffectiveness({result,name,onClick}){
 return <b className={result.multiplier>1?'battle-effective':result.multiplier<1?'battle-resisted':''}>{result.explanation?<button className="battle-effect-help" aria-label={`${name}: ${result.label}, details`} onClick={onClick}>{result.label}</button>:result.label}</b>
}
function RetaliationDetails({move,attacker,defender}){
 const preview=retaliationPreview(move,attacker,defender)
 return <div className="battle-retaliation">{preview.message?<p>{preview.message}</p>:preview.rows.map((row,i)=><section key={i}><strong>{row.name}</strong>{row.message?<small>{row.message}</small>:row.scenarios.map((scenario,j)=><div key={j}>{scenario.message?<small>{scenario.message}</small>:<>{row.scenarios.length>1&&<small>{scenario.userAbility} / {scenario.opponentAbility}</small>}<b>{scenario.minPercent.toFixed(1)}–{scenario.maxPercent.toFixed(1)}%</b><small>{scenario.blocked?'Opponent immune':`${Number(scenario.koChance.toFixed(1))}% KO${scenario.survivalChance<100?` · ${Number(scenario.survivalChance.toFixed(1))}% survive`:''}`}</small></>}</div>)}</section>)}{!preview.message&&!preview.rows.length&&<p>No qualifying opponent attacks.</p>}</div>
}
function DamagePopup({selection,onClose}){
 const popup=useRef(null)
 const {move,attacker,defender,anchor}=selection
 const result=calculateBattleDamage(move,attacker,defender)
 const effectiveness=battleMoveEffectiveness(move,defender,attacker.ivs,attacker)
 useLayoutEffect(()=>{
  const node=popup.current
  node.showPopover()
  const position=()=>{
   const rect=anchor.getBoundingClientRect(),box=node.getBoundingClientRect()
   const width=window.innerWidth,height=window.visualViewport?.height??window.innerHeight
   node.style.left=`${Math.max(8,Math.min(width-box.width-8,rect.left+rect.width/2-box.width/2))}px`
   node.style.top=`${Math.max(8,Math.min(height-box.height-8,rect.top-box.height-7>=8?rect.top-box.height-7:rect.bottom+7))}px`
  }
  const observer=new ResizeObserver(position);observer.observe(node);position();window.addEventListener('resize',position);window.addEventListener('scroll',position,true)
  return()=>{observer.disconnect();window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);if(node.matches(':popover-open'))node.hidePopover()}
 },[anchor])
 const retaliation=['COUNTER','MIRROR_COAT'].includes(move.effect)
 const attackerVaries=new Set(result.scenarios?.map(scenario=>scenario.attackAbility)).size>1
 return <div ref={popup} popover="auto" role="dialog" aria-label={`${move.name} damage`} className="battle-damage-popover" onToggle={event=>{if(event.newState==='closed')onClose()}}><strong>{move.name}</strong><div className="battle-damage-popover-meta">Power {result.power??(move.power>1?move.power:'—')} · Accuracy {move.accuracy?`${move.accuracy}%`:'—'}</div>{defender&&defender.currentHp<defender.stats.hp&&<div className="battle-damage-popover-meta">Target HP {defender.currentHp}/{defender.stats.hp}</div>}{retaliation?<RetaliationDetails move={move} attacker={attacker} defender={defender}/>:result.message?(move.power===0?null:<p>{result.exactMessage?result.message:effectiveness.explanation??result.message}</p>):result.scenarios.map((scenario,i)=><div className="battle-damage-result" key={i}><span>{attackerVaries?`${scenario.attackAbility} → `:''}{scenario.defendAbility}{scenario.critBlocked?' · Crit blocked':''}</span>{scenario.outcomeRanges?<><div className="battle-hit-ranges">{scenario.outcomeRanges.map(row=><div key={row.label}><span>{row.label} · {Number((row.probability*100).toFixed(1))}%</span><b>{row.healed!=null?(row.healed?`+${row.healed} HP`:'Full HP'):`${row.minPercent.toFixed(1)}–${row.maxPercent.toFixed(1)}%`}</b></div>)}</div><small className="battle-total-ko">{Number(scenario.koChance.toFixed(1))}% {defender.currentHp<defender.stats.hp?'KO':'OHKO'} overall</small></>:scenario.hitRanges?<><div className="battle-hit-ranges">{scenario.hitRanges.map(row=><div key={row.hits}><span>{row.hits} hits{scenario.hitRanges.length>1?` · ${Number((row.probability*100).toFixed(1))}%`:''}</span><b>{row.minPercent.toFixed(1)}–{row.maxPercent.toFixed(1)}%</b></div>)}</div><small className="battle-total-ko">{Number(scenario.koChance.toFixed(1))}% {defender.currentHp<defender.stats.hp?'KO':'OHKO'} overall</small></>:<><b>{scenario.minPercent.toFixed(1)}–{scenario.maxPercent.toFixed(1)}%</b><small>{Number(scenario.koChance.toFixed(1))}% {defender.currentHp<defender.stats.hp?'KO':'OHKO'}</small></>}</div>)}{result.conditionalHits&&<p>Odds after the first hit lands.</p>}{!retaliation&&!result.message&&effectiveness.explanation&&<p>{effectiveness.explanation}</p>}</div>
}
function BattlePokemonPicker({pool,onSelect,onClose}){
 const dialog=useRef(null)
 const [query,setQuery]=useState('')
 useEffect(()=>{const node=dialog.current;node.showModal();return()=>node.close()},[])
 return <dialog ref={dialog} className="battle-team-dialog battle-quick-picker" aria-labelledby="battle-quick-picker-title" onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose()}}><div className="battle-quick-picker-layout"><header><h2 id="battle-quick-picker-title">BF Trained Pokémon</h2><button type="button" aria-label="Close Pokémon search" onClick={onClose}>×</button></header><div className="battle-team-editor-body"><label><input autoFocus type="search" aria-label="Search BF Trained Pokémon" placeholder="Search Pokémon…" value={query} onChange={event=>setQuery(event.target.value)}/></label><div className="battle-editor-pokemon">{pool.filter(mon=>pokemonMeta[mon.species].name.toLowerCase().startsWith(query.trim().toLowerCase())).map(mon=><button type="button" key={mon.companionId} onClick={()=>onSelect(mon.companionId)}><img src={`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[mon.species].dex}.png`} alt=""/><span>{pokemonMeta[mon.species].name}{mon.nickname&&mon.nickname!==pokemonMeta[mon.species].name&&<small>{mon.nickname}</small>}</span><b>+</b></button>)}{!pool.length&&<p>No additional BF Trained Pokémon available.</p>}</div></div></div></dialog>
}
function TeamEditor({draft,pool,presets,limit,onClose,onSave,onDelete}){
 const dialog=useRef(null)
 const [name,setName]=useState(draft.name)
 const [ids,setIds]=useState(draft.ids)
 const [query,setQuery]=useState('')
 useEffect(()=>{const node=dialog.current;node.showModal();return()=>node.close()},[])
 const duplicate=presets.some(team=>team.name!==draft.original&&team.name.toLowerCase()===name.trim().toLowerCase())
 const selected=ids.map(id=>pool.find(mon=>mon.companionId===id)).filter(Boolean)
 return <dialog ref={dialog} className="battle-team-dialog" aria-labelledby="battle-team-editor-title" onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose()}}><form onSubmit={event=>{event.preventDefault();if(name.trim()&&ids.length&&!duplicate)onSave({name:name.trim(),ids})}}>
 <header><h2 id="battle-team-editor-title">{draft.original?'Edit Team':'Add Team'}</h2><button type="button" aria-label="Close team editor" onClick={onClose}>×</button></header>
 <div className="battle-team-editor-body"><label>Team name<input autoFocus value={name} maxLength={40} placeholder="Team name" onChange={event=>setName(event.target.value)}/></label>{duplicate&&<p className="battle-team-editor-error">That team name is already in use.</p>}
 <div className="battle-editor-slots">{Array.from({length:limit},(_,i)=>{const mon=selected[i];return <button type="button" key={mon?.companionId??i} aria-label={mon?`Remove ${pokemonMeta[mon.species].name}`:'Empty team slot'} disabled={!mon} onClick={()=>setIds(old=>old.filter(id=>id!==mon.companionId))}>{mon?<><img src={`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[mon.species].dex}.png`} alt=""/><small>{pokemonMeta[mon.species].name}</small></>:<span>+</span>}</button>})}</div>
 <label>BF Trained Pokémon<input type="search" placeholder="Search Pokémon…" value={query} onChange={event=>setQuery(event.target.value)}/></label>
 <div className="battle-editor-pokemon">{pool.filter(mon=>pokemonMeta[mon.species].name.toLowerCase().startsWith(query.trim().toLowerCase())).map(mon=>{const chosen=ids.includes(mon.companionId);const blocked=!chosen&&(ids.length>=limit||selected.some(other=>other.species===mon.species));return <button type="button" key={mon.companionId} aria-pressed={chosen} disabled={blocked} onClick={()=>setIds(old=>chosen?old.filter(id=>id!==mon.companionId):[...old,mon.companionId])}><img src={`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[mon.species].dex}.png`} alt=""/><span>{pokemonMeta[mon.species].name}{mon.nickname&&mon.nickname!==pokemonMeta[mon.species].name&&<small>{mon.nickname}</small>}</span><b>{chosen?'✓':'+'}</b></button>})}{!pool.length&&<p>Mark Pokémon as BF Trained in My Pokémon to build a team.</p>}</div></div>
 <footer>{draft.original&&<button type="button" className="battle-team-delete" onClick={onDelete}>Delete</button>}<button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={!name.trim()||!ids.length||duplicate}>Save</button></footer></form></dialog>
}
function SpriteSlot({name,src,onSelect,onRemove}){
 const lastTap=useRef(null)
 return <button className="battle-sprite-slot" aria-label={name?`Select ${name}; double-tap to remove`:'Add Pokémon'} title={name?`${name} · Double-tap to remove`:'Add Pokémon'} onPointerUp={event=>{if(event.button!==0)return;const now=event.timeStamp;if(name&&lastTap.current!==null&&now-lastTap.current<350){lastTap.current=null;onRemove()}else{lastTap.current=now;onSelect()}}} onDoubleClick={event=>event.preventDefault()} onClick={event=>{if(event.detail===0)onSelect()}} onKeyDown={event=>{if(name&&(event.key==='Delete'||event.key==='Backspace')){event.preventDefault();onRemove()}}}>{src?<img src={src} alt={name}/>:<span>+</span>}</button>
}
export default function BattleWorkbench({collection,designations,getRole,saveData={},isActive=false}){
 useResourceViewport()
 useEffect(()=>{
  if(!isActive)return
  const theme=document.querySelector('meta[name="theme-color"]')
  const previous=theme?.getAttribute('content')
  theme?.setAttribute('content','#09131e')
  return()=>{if(previous!=null)theme?.setAttribute('content',previous)}
 },[isActive])

 const pageRef=useRef(null)
 const trainerLastTap=useRef(null)
 useEffect(()=>{pageRef.current.style.setProperty('--battle-fixed-height',`${window.visualViewport?.height ?? window.innerHeight}px`)},[])
 function focusWithoutPanning(event){const input=event.target;if(event.pointerType!=='touch'||!(input instanceof HTMLInputElement))return;event.preventDefault();input.style.opacity='0';input.focus({preventScroll:true});requestAnimationFrame(()=>requestAnimationFrame(()=>{input.style.opacity=''}))}
 const [state,setState]=useState(()=>{const saved=load();if(!saved.teamInitialized){if(!saved.team.length)saved.team=collection.filter(mon=>getRole(mon,designations)==='bf').slice(0,3).map(mon=>mon.companionId);saved.active=saved.team.includes(saved.active)?saved.active:saved.team[0]??'';saved.teamInitialized=true}return saved})
 useEffect(()=>{
  const viewport=window.visualViewport
  const size=()=>pageRef.current?.style.setProperty('--battle-picker-viewport',`${viewport?.height??window.innerHeight}px`)
  size();viewport?.addEventListener('resize',size)
  return()=>viewport?.removeEventListener('resize',size)
 },[])
 const [teamDraft,setTeamDraft]=useState(null)
 const [pokemonPickerOpen,setPokemonPickerOpen]=useState(false)
 const [damageSelection,setDamageSelection]=useState(null)
 const [hpByPokemon,setHpByPokemon]=useState({})
 const [conditionsByPokemon,setConditionsByPokemon]=useState({})
 const [field,setField]=useState({weather:'none',critical:false,playerScreens:{},enemyScreens:{}})
 const [opponentQuery,setOpponentQuery]=useState('')
 const [trainerQuery,setTrainerQuery]=useState('')
 const [hiddenSets,setHiddenSets]=useState(()=>new Set())
 useEffect(()=>{
  const reset=()=>{setState(old=>({...old,trainer:'',team:[],active:'',opponents:[],enemy:'',tab:'matchup',teamInitialized:true}));setOpponentQuery('');setTrainerQuery('');setHiddenSets(new Set());setTeamDraft(null);setPokemonPickerOpen(false);setDamageSelection(null);setHpByPokemon({});setConditionsByPokemon({});setField({weather:'none',critical:false,playerScreens:{},enemyScreens:{}})}
  window.addEventListener('emerald-reset-battle',reset)
  return()=>window.removeEventListener('emerald-reset-battle',reset)
 },[])

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
 const myHpKey=`my-${mine?.companionId}`,enemyHpKey=`enemy-${state.enemy}`
 if(myMon)myMon.currentHp=Math.min(myMon.stats.hp,hpByPokemon[myHpKey]??myMon.stats.hp)
 if(opponent)opponent.currentHp=Math.min(opponent.stats.hp,hpByPokemon[enemyHpKey]??opponent.stats.hp)
 if(myMon)Object.assign(myMon,conditionsByPokemon[myHpKey]??{})
 if(opponent)Object.assign(opponent,conditionsByPokemon[enemyHpKey]??{})
 if(myMon)Object.assign(myMon,{weather:field.weather,critical:field.critical,screens:field.playerScreens})
 if(opponent)Object.assign(opponent,{weather:field.weather,critical:field.critical,screens:field.enemyScreens})
 if(opponent?.abilityOptions.includes(opponent.abilitySelection))opponent.ability=opponent.abilitySelection
 const setConditions=(key,patch)=>setConditionsByPokemon(old=>({...old,[key]:{...old[key],...patch}}))
 const setBattleHp=(key,value)=>setHpByPokemon(old=>({...old,[key]:value}))

 const availableSets=(!trainer?allSets.filter(set=>!set.brainSet || set.brainSet.startsWith(`${facilityBrain.name} `)):trainer.brain?allSets.filter(set=>set.brainSet?.startsWith(`${trainer.name} `)):allSets.filter(set=>trainer.pokemonSetIds.includes(set.id)))
 const visibleSets=availableSets.filter(set=>!hiddenSets.has(set.key) && set.species.toLowerCase().startsWith(opponentQuery.trim().toLowerCase()))
 const moveColors=(()=>{
  if(new Set(visibleSets.map(set=>set.species)).size!==1)return new Map()
  const counts=new Map();for(const set of visibleSets)for(const move of new Set(set.moves))counts.set(move,(counts.get(move)??0)+1)
  return new Map([...counts].filter(([,count])=>count>1).sort(([a],[b])=>a.localeCompare(b)).map(([move],index)=>[move,`hsl(${(index*137.508+25)%360} 70% 76%)`]))
 })()

 function addOpponent(key){setState(old=>{
  const set=bySet.get(key);if(!set)return old
  const brain=set.brainSet?.split(' ')[0]
  const nextTrainer=brain??(brains.some(t=>t.name===old.trainer)?'':old.trainer)
  const selected=nextTrainer===old.trainer ? old.opponents : []
  if(!selected.includes(key)&&selected.length>=(old.format==='Doubles'?4:3))return old
  return {...old,opponents:[...new Set([...selected,key])],enemy:key,trainer:nextTrainer,tab:'matchup'}
 })}

 function chooseTrainer(key){setHiddenSets(new Set());setOpponentQuery('');update({trainer:key,opponents:[],enemy:'',tab:'opponent'})}
 function removeOpponent(key){setState(old=>{const opponents=old.opponents.filter(id=>id!==key);return {...old,opponents,enemy:old.enemy===key?opponents[0]??'':old.enemy}})}
 function removeMyPokemon(key){setState(old=>{const team=old.team.filter(id=>id!==key);return {...old,team,active:old.active===key?team[0]??'':old.active}})}
 return <div ref={pageRef} onPointerDownCapture={focusWithoutPanning} className={`resources-page resource-scroll-database-page battle-workbench${state.tab==='matchup'?' battle-matchup-preview':''}`}>
 <div className="battle-active-selects battle-sprite-selects"><div><div className="battle-trainer-label"><img src={`${import.meta.env.BASE_URL}home/trainers/${playerSprite}`} alt="Your trainer"/><span>{saveData.trainerName || 'Trainer'}</span></div><div className="battle-sprite-slots">{Array.from({length:opponentLimit},(_,index)=>{const mon=team[index];return <SpriteSlot key={mon?.companionId??`empty-${index}`} name={mon?pokemonMeta[mon.species]?.name:null} src={mon?`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[mon.species].dex}.png`:null} onSelect={()=>mon?update({active:mon.companionId}):setPokemonPickerOpen(true)} onRemove={()=>removeMyPokemon(mon.companionId)}/>})}</div></div><div><div className="battle-trainer-label" role="button" tabIndex={0} aria-label={trainer?'Opponent trainer; double-tap to remove':'Opponent trainer'} title={trainer?'Double-tap to remove trainer':'Opponent'} onPointerUp={event=>{if(event.button!==0)return;const now=event.timeStamp;if(trainer&&trainerLastTap.current!==null&&now-trainerLastTap.current<350){trainerLastTap.current=null;setHiddenSets(new Set());setOpponentQuery('');update({trainer:'',opponents:[],enemy:''})}else{trainerLastTap.current=now}}} onDoubleClick={event=>event.preventDefault()} onKeyDown={event=>{if(trainer&&(event.key==='Delete'||event.key==='Backspace')){event.preventDefault();setHiddenSets(new Set());setOpponentQuery('');update({trainer:'',opponents:[],enemy:''})}}}>{trainerImage&&<img src={`${import.meta.env.BASE_URL}trainers/${trainerImage}.png`} alt={trainer.name}/>}{!trainerImage&&<span className="battle-trainer-spacer" aria-hidden="true"/>}<span>{trainer?`${title(trainer.name)} · ${trainer.trainerClass}`:'Opponent'}</span></div><div className="battle-sprite-slots">{Array.from({length:opponentLimit},(_,index)=>{const set=bySet.get(state.opponents[index]);return <SpriteSlot key={set?.key??`empty-${index}`} name={set?set.id??`${set.species} ${set.brainSet}`:null} src={set?`${import.meta.env.BASE_URL}sprites/emerald/${metadata.get(set.species.toLowerCase()).dex}.png`:null} onSelect={()=>set?update({enemy:set.key}):update({tab:'opponent'})} onRemove={()=>removeOpponent(set.key)}/>})}</div></div></div>
 <nav className="resource-profile-tabs battle-tabs">{[['matchup','Matchup'],['trainers','Trainers'],['opponent','Sets'],['teams','Teams'],['rules','Rules']].map(([key,label])=><button key={key} aria-pressed={state.tab===key} className={state.tab===key?'active':''} onClick={()=>update({tab:key})}>{label}</button>)}</nav>
 <div className="battle-tab-content">
 {state.tab==='matchup'&&<div className="battle-matchup battle-matchup-columns"><div className="battle-level-label">Frontier · Level {state.level}</div><MatchupPanel title="Your Pokémon" mon={myMon} other={opponent} onMove={setDamageSelection}/><MatchupPanel title={trainer?`${title(trainer.name)} · ${trainer.trainerClass}`:'Opponent'} mon={opponent} other={myMon} onMove={setDamageSelection}/><details className="battle-field-conditions battle-combined-conditions" onClickCapture={event=>{if(event.target instanceof Element&&event.target.closest('label')&&!event.target.closest('input,select,button'))event.preventDefault()}}><summary>Battle Conditions</summary><button type="button" className="battle-conditions-reset" onClick={()=>{setHpByPokemon({});setConditionsByPokemon({});setField({weather:'none',critical:false,playerScreens:{},enemyScreens:{}})}}>Reset</button><label>Weather<FitSelect aria-label="Battle weather" value={field.weather} onChange={event=>setField(old=>({...old,weather:event.target.value}))}>{[['none','None'],['sun','Sun'],['rain','Rain'],['sand','Sandstorm'],['hail','Hail']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</FitSelect></label><label className="battle-critical-control"><input type="checkbox" aria-label="Critical hit damage" checked={Boolean(field.critical)} onChange={event=>setField(old=>({...old,critical:event.target.checked}))}/>Crit</label><div className="battle-condition-sides"><BattleConditionSide side="player" mon={myMon} onScreens={screens=>setField(old=>({...old,playerScreens:screens}))} onCondition={patch=>setConditions(myHpKey,patch)} onHp={value=>setBattleHp(myHpKey,value)}/><BattleConditionSide side="enemy" mon={opponent} onScreens={screens=>setField(old=>({...old,enemyScreens:screens}))} onCondition={patch=>setConditions(enemyHpKey,patch)} onHp={value=>setBattleHp(enemyHpKey,value)}/></div></details></div>}

 {state.tab==='trainers'&&<><label className="battle-set-search"><input type="search" aria-label="Search trainer or class" placeholder="Search name or class…" value={trainerQuery} onChange={event=>setTrainerQuery(event.target.value)}/></label><div className="battle-trainer-list">{[facilityBrain,...trainers].filter(t=>`${t.name} ${t.trainerClass}`.toLowerCase().split(/\s+/).some(word=>word.startsWith(trainerQuery.trim().toLowerCase()))).map(t=>{const key=t.key??t.name;const count=t.brain?allSets.filter(set=>set.brainSet?.startsWith(`${t.name} `)).length:t.pokemonSetIds.length;return <button key={key} aria-pressed={state.trainer===key} onClick={()=>chooseTrainer(key)}><img src={`${import.meta.env.BASE_URL}trainers/${t.brain?brainSprites[t.name]:t.sprite}.png`} alt=""/><span><strong>{title(t.name)}</strong><small>{t.trainerClass}</small></span><span className="battle-trainer-count"><b>{count}</b><small>Pokémon</small></span></button>})}</div></>}
 {state.tab==='opponent'&&<><label className="battle-set-search"><input type="search" aria-label="Search opponent Pokémon" placeholder="Search Pokémon name…" value={opponentQuery} onChange={event=>{setOpponentQuery(event.target.value);if(!event.target.value.trim())setHiddenSets(new Set())}}/></label><div className="battle-opponent-list">{visibleSets.map(set=>{const view=enemyView(set,Number(state.level),set.brainSet ? set.fixedIVs : opponentIV);return <div className="battle-set-entry" key={set.key}><button className="battle-set-select" aria-pressed={state.opponents.includes(set.key)} disabled={state.opponents.length>=opponentLimit&&!state.opponents.includes(set.key)} onClick={()=>addOpponent(set.key)}><img src={`${import.meta.env.BASE_URL}sprites/emerald/${view.dex}.png`} alt=""/><div className="battle-set-body"><div className="battle-set-heading"><strong>{set.species}{set.instance?` ${set.instance}`:''}</strong><small>{set.item}</small>{set.brainSet&&<small>{set.brainSet}</small>}</div><div className="battle-set-stats">{stats.map(([key,label])=><span key={key}><small>{label}</small><b>{view.stats[key]}</b></span>)}</div><div className="battle-set-moves">{set.moves.map((move,i)=><span key={i}>{i>0&&<span className="battle-move-separator"> · </span>}<span style={{color:moveColors.get(move)??'#f1f5f9'}}>{move}</span></span>)}</div></div></button><button className="battle-hide-set" aria-label={`Hide ${set.brainSet?`${set.species} ${set.brainSet}`:set.id}`} onClick={()=>setHiddenSets(old=>new Set([...old,set.key]))}>×</button></div>})}</div></>}
 {state.tab==='teams'&&<><div className="battle-teams-heading"><h3>Saved Teams</h3><button onClick={()=>setTeamDraft({name:'',ids:[],original:null})}>+ Add Team</button></div><div className="battle-saved-teams">{state.presets.map(preset=><div className="battle-saved-team" data-selected={preset.ids.length===state.team.length&&preset.ids.every((id,index)=>state.team[index]===id)} key={preset.name}><button className="battle-load-team" aria-pressed={preset.ids.length===state.team.length&&preset.ids.every((id,index)=>state.team[index]===id)} aria-label={`Use ${preset.name}`} onClick={()=>update({team:preset.ids,active:preset.ids[0]??'',tab:'matchup'})}><strong>{preset.name}</strong><span>{preset.ids.map(id=>collection.find(mon=>mon.companionId===id)).filter(Boolean).map(mon=><img key={mon.companionId} src={`${import.meta.env.BASE_URL}sprites/emerald/${pokemonMeta[mon.species].dex}.png`} alt={pokemonMeta[mon.species].name}/>)}</span></button><button className="battle-edit-team" onClick={()=>setTeamDraft({name:preset.name,ids:preset.ids.filter(id=>myPool.some(mon=>mon.companionId===id)),original:preset.name})}>Edit</button></div>)}</div>{!state.presets.length&&<p className="battle-empty">Add a team, then tap its name or sprites to use it in battle.</p>}</>}
 {damageSelection&&<DamagePopup key={`${damageSelection.attacker.name}-${damageSelection.move.name}`} selection={damageSelection} onClose={()=>setDamageSelection(null)}/>}
 {pokemonPickerOpen&&<BattlePokemonPicker pool={myPool.filter(mon=>!team.some(other=>other.species===mon.species))} onClose={()=>setPokemonPickerOpen(false)} onSelect={id=>{setState(old=>old.team.length>=opponentLimit?old:{...old,team:[...old.team,id],active:id});setPokemonPickerOpen(false)}}/>}
 {teamDraft&&<TeamEditor draft={teamDraft} pool={myPool} presets={state.presets} limit={opponentLimit} onClose={()=>setTeamDraft(null)} onSave={preset=>{update({presets:[...state.presets.filter(team=>team.name!==teamDraft.original),preset],team:preset.ids,active:preset.ids[0]??''});setTeamDraft(null)}} onDelete={()=>{update({presets:state.presets.filter(team=>team.name!==teamDraft.original)});setTeamDraft(null)}}/>}

 {state.tab==='rules'&&<div className="battle-rules"><label>Level<FitSelect aria-label="Battle level" value={state.level} onChange={event=>update({level:Number(event.target.value)})}><option value={50}>Level 50</option><option value={100}>Level 100</option></FitSelect></label><label>Facility<FitSelect aria-label="Frontier facility" value={state.facility} onChange={event=>{setHiddenSets(new Set());update({facility:event.target.value,trainer:trainer?.brain?'':state.trainer,opponents:[],enemy:''})}}>{['Tower','Dome','Palace','Arena','Factory','Pike','Pyramid'].map(name=><option key={name}>{name}</option>)}</FitSelect></label><label>Format<FitSelect aria-label="Battle format" value="Singles"><option>Singles</option></FitSelect></label><label>Opponent IVs<FitSelect aria-label="Opponent IVs" value={opponentIV} disabled={Boolean(trainer)||state.facility==='Dome'} onChange={event=>update({iv:Number(event.target.value)})}>{[3,6,9,12,15,18,21,31].map(iv=><option key={iv} value={iv}>{iv}</option>)}</FitSelect></label><p>Opponent stats use the selected level; your Pokémon use their actual stats. Trainer IVs and fixed Brain IVs apply automatically. Move effectiveness includes defensive abilities. Double-tap a Pokémon or the opponent trainer to remove them. Double-tap Battle in the bottom navigation to clear the battle; saved teams and Rules are kept.</p></div>}
 </div></div>
}
