import { calculatorPokemonOptions } from '../utils/calculatorPokemonOptions'
import StepInput from './StatStepInput'
import { useEffect, useRef, useState } from 'react'
import ResourceHeading from './ResourceHeading'
import PokemonSearchPicker from './PokemonSearchPicker'
import FitSelect from './FitSelect'
import { pokemonMeta } from '../data/pokemonMeta'
import { deoxysForms } from '../data/deoxysForms'
import { speciesInfo } from '../data/emeraldData'
import { ivNatures, emeraldStat, natureStatEffect } from '../utils/ivCalculator'
import { minimumStatEV } from '../utils/evPlanner'
import { levelFromExperience } from '../utils/collectionDetails'

const stats=[['hp','HP'],['attack','Atk'],['defense','Def'],['spAttack','SpA'],['spDefense','SpD'],['speed','Spe']]

const spread=value=>Object.fromEntries(stats.map(([key])=>[key,value]))
const total=values=>stats.reduce((sum,[key])=>sum+Number(values[key]),0)
const valid=(values,max)=>stats.every(([key])=>Number.isInteger(Number(values[key])) && Number(values[key])>=0 && Number(values[key])<=max)
let sessionDraft=null
export default function StatsEVTool({ onBack, collection=[] }) {
  const pageRef=useRef(null)
  useEffect(()=>{
    const page=pageRef.current
    // Use layout coordinates and a fixed opening height; don't follow the
    // visual viewport's animated offsets while the keyboard opens.
    page.style.setProperty('--stats-fixed-height',`${window.visualViewport?.height ?? window.innerHeight}px`)
  },[])
  function focusWithoutPanning(event) {
    const input=event.target
    if(event.pointerType!=='touch' || !(input instanceof HTMLInputElement)) return
    // Safari pans to a visible focused field even inside a fixed page.
    // Focus it invisibly, then restore it before painting the keyboard.
    event.preventDefault()
    input.style.opacity='0'
    input.focus({preventScroll:true})
    requestAnimationFrame(()=>requestAnimationFrame(()=>{input.style.opacity=''}))
  }
  const [speciesId,setSpecies]=useState(sessionDraft?.speciesId ?? '')
  const [deoxysForm,setDeoxysForm]=useState(sessionDraft?.deoxysForm ?? 'speed')
  const [nature,setNature]=useState(sessionDraft?.nature ?? '')
  const [level,setLevel]=useState(sessionDraft?.level ?? '')
  const [ivs,setIVs]=useState(sessionDraft?.ivs ?? spread(0))
  const [evs,setEVs]=useState(sessionDraft?.evs ?? spread(0))
  const [loadId,setLoadId]=useState(sessionDraft?.loadId ?? '')
  const [target,setTarget]=useState(sessionDraft?.target ?? '')
  const [goal,setGoal]=useState(sessionDraft?.goal ?? 'speed')
  const [message,setMessage]=useState('')
  useEffect(()=>{sessionDraft={speciesId,deoxysForm,nature,level,ivs,evs,loadId,target,goal}},[speciesId,deoxysForm,nature,level,ivs,evs,loadId,target,goal])
  function reset(){setSpecies('');setDeoxysForm('speed');setNature('');setLevel('');setIVs(spread(0));setEVs(spread(0));setLoadId('');setTarget('');setGoal('speed');setMessage('')}
  const pokemonLevel=pokemon=>pokemon.level ?? levelFromExperience(pokemon.experience,speciesInfo[pokemon.species]?.growthRate)
  const meta=pokemonMeta[speciesId]
  const calculationNature=nature || 'Hardy'
  const base=meta?.dex===386 ? deoxysForms[deoxysForm].baseStats : speciesInfo[speciesId]?.baseStats
  const levelValid=level!=='' && Number.isInteger(Number(level)) && level>=1 && level<=100
  const ivValid=valid(ivs,31)
  const active=evs
  const used=total(active)
  const activeValid=valid(active,255) && used<=510
  function stat(key,values) {return base && levelValid && ivValid && valid(values,255) && total(values)<=510 ? emeraldStat(base[key],key,Number(ivs[key]),Number(values[key]),Number(level),calculationNature,meta?.dex===292) : '—'}
  function load(id) {
    setLoadId(id)
    const pokemon=collection.find(p=>p.companionId===id)
    if(!pokemon)return
    setDeoxysForm(deoxysForms[pokemon.deoxysForm] ? pokemon.deoxysForm : 'speed')
    setSpecies(String(pokemon.species));setNature(ivNatures.includes(pokemon.nature)?pokemon.nature:'Hardy')
    setLevel(pokemonLevel(pokemon) ?? '')
    setIVs(Object.fromEntries(stats.map(([key])=>[key,pokemon.ivs?.[key] ?? 0])))
    const current=Object.fromEntries(stats.map(([key])=>[key,pokemon.evs?.[key] ?? 0]))
    setEVs(current);setMessage('')
  }
  function findEVs() {
    if(!base || !levelValid || !ivValid){setMessage('Choose Pokémon, level, and valid IVs first.');return}
    const ev=minimumStatEV({base:base[goal],key:goal,iv:Number(ivs[goal]),level:Number(level),nature:calculationNature,otherEVs:0,target:Number(target),shedinja:meta?.dex===292})
    if(ev==null){setMessage('That target cannot be reached with 0–255 EVs in this stat.');return}
    setMessage(`${ev} ${stats.find(([key])=>key===goal)[1]} EVs → ${emeraldStat(base[goal],goal,Number(ivs[goal]),ev,Number(level),calculationNature,meta?.dex===292)}`)
  }
  return <div ref={pageRef} onPointerDownCapture={focusWithoutPanning} className="resources-page resource-scroll-database-page resource-stats-tool">
    <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><ResourceHeading>Stat Calculator</ResourceHeading><button className="resource-stats-reset" onClick={reset}>Reset</button></div>
    <div className="resource-stats-controls">
      <div className="resource-stats-fields"><PokemonSearchPicker label="Pokémon" value={meta?.dex===386 ? `${speciesId}:${deoxysForm}` : speciesId} options={calculatorPokemonOptions} onChange={value=>{const [id,form]=value.split(':');setSpecies(id);if(form)setDeoxysForm(form);setLoadId('');setMessage('')}} /><label>Nature<FitSelect value={nature} onChange={event=>{setNature(event.target.value);setMessage('')}}><option value="">Choose nature</option>{ivNatures.map(name=><option key={name}>{name}</option>)}</FitSelect></label></div>
      <div className="resource-stats-fields"><label>Level<div className="resource-stats-level">{[50,100].map(value=><button key={value} aria-pressed={level!=='' && Number(level)===value} onClick={()=>{setLevel(value);setMessage('')}}>{value}</button>)}<input aria-label="Custom level" placeholder="Level" type="number" min="1" max="100" value={level} onChange={event=>{setLevel(event.target.value);setMessage('')}} /></div></label><PokemonSearchPicker label="My Pokémon" value={loadId} options={collection.map(p=>({value:p.companionId,label:`${p.nickname || p.speciesName}${pokemonLevel(p)!=null ? ` · Lv. ${pokemonLevel(p)}` : ''}`})).sort((a,b)=>a.label.localeCompare(b.label))} onChange={load} /></div>
    </div>
    <div className="resource-stats-results" id="stats-tool-content">

      <table className="resource-stats-calculator-table"><thead><tr><th>Stat</th><th>IV</th><th>EV</th><th>Value</th></tr></thead><tbody>{stats.map(([key,label],index)=><tr key={key}><th className={natureStatEffect(nature,key)>0 ? 'nature-increased' : natureStatEffect(nature,key)<0 ? 'nature-decreased' : undefined}>{label}</th><td><StepInput tabOrder={index+1} label={`${label} IV`} max={31} value={ivs[key]} onChange={value=>setIVs(current=>({...current,[key]:value}))} /></td><td><StepInput tabOrder={index+7} label={`${label} EV`} max={255} value={evs[key]} onChange={value=>{setEVs(current=>({...current,[key]:value}));setMessage('')}} /></td><td><strong>{stat(key,evs)}</strong></td></tr>)}</tbody><tfoot><tr><th>Total</th><td>{total(ivs)} / 186</td><td>{used} / 510</td><td>—</td></tr></tfoot></table>
      <div className="resource-stats-budget" aria-live="polite"><span>{used} / 510 EVs allocated</span><span>{used<=510 ? `${510-used} remaining` : `${used-510} over budget`}</span></div><div className="resource-stats-budget-track"><i style={{width:`${Math.min(100,used/510*100)}%`}} /></div>
      <div className="resource-stats-validation" role="status">{(level!=='' && !levelValid) ? 'Level must be 1–100.' : !ivValid ? 'IVs must be 0–31.' : !activeValid ? 'EVs must be 0–255 each, 510 total.' : ''}</div>
      <div className="resource-stats-goal"><label>Target stat<FitSelect value={goal} onChange={event=>{setGoal(event.target.value);setMessage('')}}>{stats.map(([key,label])=><option key={key} value={key}>{label}</option>)}</FitSelect></label><label>Target value<input type="number" min="1" value={target} onChange={event=>setTarget(event.target.value)} /></label><button onClick={findEVs}>Find EVs</button></div>{message && <p className="resource-note" aria-live="polite">{message}</p>}

    </div>
  </div>
}
