import { useEffect, useRef, useState } from 'react'
import { pokemonMeta } from '../data/pokemonMeta'
import { speciesInfo, abilityNames, moveNames, moveInfo, itemNames } from '../data/emeraldData'

const stats = [['HP','hp'],['Attack','attack'],['Defense','defense'],['Sp. Attack','spAttack'],['Sp. Defense','spDefense'],['Speed','speed']]
const natures = ['Hardy','Lonely','Brave','Adamant','Naughty','Bold','Docile','Relaxed','Impish','Lax','Timid','Hasty','Serious','Jolly','Naive','Modest','Mild','Quiet','Bashful','Rash','Calm','Gentle','Sassy','Careful','Quirky']
const species = Object.entries(pokemonMeta).filter(([,meta]) => meta.dex <= 386 && meta.generation <= 3).sort((a,b)=>a[1].dex-b[1].dex)
const namedOptions = names => Object.entries(names).filter(([id,name])=>Number(id)>0 && !/^(Item \d|Unused)/.test(name)).sort((a,b)=>a[1].localeCompare(b[1]))

export default function PokemonEditor({ pokemon, onSave, onClose }) {
  const ref = useRef(null)
  const [error, setError] = useState('')
  const [draft,setDraft] = useState(()=>({
    species: String(pokemon?.species ?? species[0][0]), nickname: pokemon?.nickname ?? '', level: pokemon?.level ?? 5,
    shiny: pokemon?.shiny ?? false, gender: pokemon?.gender ?? 'Male', nature: pokemon?.nature ?? 'Hardy',
    abilityId: String(pokemon?.abilityId ?? speciesInfo[pokemon?.species ?? species[0][0]]?.abilities?.[0] ?? 0),
    heldItem: String(pokemon?.heldItem ?? 0), moves: Array.from({length:4},(_,i)=>String(pokemon?.moves?.[i]?.id ?? 0)),
    ivs: Object.fromEntries(stats.map(([,key])=>[key,pokemon?.ivs?.[key] ?? 0])),
    evs: Object.fromEntries(stats.map(([,key])=>[key,pokemon?.evs?.[key] ?? 0])),
  }))
  useEffect(()=>{ const focus=document.activeElement; const dialog=ref.current; dialog.showModal(); return ()=>{dialog.close();focus?.focus()} },[])
  const update=(key,value)=>setDraft(current=>({...current,[key]:value}))
  const abilities=speciesInfo[draft.species]?.abilities ?? []
  function submit(event) {
    event.preventDefault()
    if(Object.values(draft.evs).reduce((sum,v)=>sum+Number(v),0)>510){setError('Total EVs cannot exceed 510.');return}
    const chosen=draft.moves.filter(id=>id!=='0')
    if(new Set(chosen).size!==chosen.length){setError('Choose different moves for each slot.');return}
    const next={...pokemon,...draft,species:Number(draft.species),speciesName:pokemonMeta[draft.species].name,
      nickname:draft.nickname.trim() || pokemonMeta[draft.species].name, level:Number(draft.level),
      abilityId:Number(draft.abilityId), ability:abilityNames[draft.abilityId], abilitySlot:Math.max(0,abilities.indexOf(Number(draft.abilityId))),
      heldItem:Number(draft.heldItem),heldItemName:itemNames[draft.heldItem],
      originGame:pokemon?.originGame ?? 'Emerald',
      ivs:Object.fromEntries(Object.entries(draft.ivs).map(([k,v])=>[k,Number(v)])),
      evs:Object.fromEntries(Object.entries(draft.evs).map(([k,v])=>[k,Number(v)])),
      moves:chosen.map(id=>({id:Number(id),name:moveNames[id],pp:moveInfo[id]?.pp ?? 0})),
    }
    const trainingChanged = !pokemon || next.species !== pokemon.species || next.level !== pokemon.level || next.nature !== pokemon.nature || stats.some(([,key]) => next.ivs[key] !== pokemon.ivs?.[key] || next.evs[key] !== pokemon.evs?.[key])
    if (trainingChanged) {
      for (const key of ['currentHp','hp','maxHp','attack','defense','spAttack','spDefense','speed','experience']) delete next[key]
    }
    const movesChanged = !pokemon || chosen.some((id,i) => Number(id) !== pokemon.moves?.[i]?.id) || chosen.length !== pokemon.moves?.length
    if (movesChanged) delete next.ppBonuses
    else next.moves = pokemon.moves
    onSave(next);onClose()
  }
  return <dialog ref={ref} className="pokemon-editor" aria-labelledby="pokemon-editor-title" onCancel={onClose}>
    <header><h2 id="pokemon-editor-title">{pokemon?'Edit Pokémon':'Add Pokémon'}</h2><button type="button" aria-label="Close Pokémon form" onClick={onClose}>×</button></header>
    <form onSubmit={submit}>
      <div className="pokemon-editor-fields">
        <label>Species<select value={draft.species} onChange={e=>setDraft(current=>({...current,species:e.target.value,abilityId:String(speciesInfo[e.target.value]?.abilities?.[0] ?? 0)}))}>{species.map(([id,meta])=><option key={id} value={id}>{meta.name}</option>)}</select></label>
        <label>Nickname<input maxLength="10" value={draft.nickname} onChange={e=>update('nickname',e.target.value)} /></label>
        <label>Level<input type="number" required min="1" max="100" step="1" value={draft.level} onChange={e=>update('level',e.target.value)} /></label>
        <label>Gender<select value={draft.gender} onChange={e=>update('gender',e.target.value)}>{['Male','Female','Genderless'].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Nature<select value={draft.nature} onChange={e=>update('nature',e.target.value)}>{natures.map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Ability<select value={draft.abilityId} onChange={e=>update('abilityId',e.target.value)}>{abilities.map(id=><option key={id} value={id}>{abilityNames[id]}</option>)}</select></label>
        <label>Held Item<select value={draft.heldItem} onChange={e=>update('heldItem',e.target.value)}><option value="0">None</option>{namedOptions(itemNames).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
        <label className="pokemon-editor-shiny"><input type="checkbox" checked={draft.shiny} onChange={e=>update('shiny',e.target.checked)} />Shiny</label>
      </div>
      <fieldset><legend>Moves</legend><div className="pokemon-editor-fields">{draft.moves.map((move,i)=><label key={i}>Move {i+1}<select value={move} onChange={e=>update('moves',draft.moves.map((v,j)=>j===i?e.target.value:v))}><option value="0">None</option>{namedOptions(moveNames).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>)}</div></fieldset>
      <details><summary>Advanced · IVs and EVs</summary><p>IVs: 0–31 each. EVs: 0–255 each, 510 total.</p><div className="pokemon-editor-stats"><span>Stat</span><span>IV</span><span>EV</span>{stats.map(([name,key])=><div className="pokemon-editor-stat-row" key={key}><span>{name}</span>{['ivs','evs'].map(type=><input key={type} aria-label={`${name} ${type==='ivs'?'IV':'EV'}`} type="number" required min="0" max={type==='ivs'?31:255} step="1" value={draft[type][key]} onChange={e=>update(type,{...draft[type],[key]:e.target.value})} />)}</div>)}</div></details>
      {error&&<p role="alert">{error}</p>}
      <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit">{pokemon?'Save Changes':'Add Pokémon'}</button></footer>
    </form>
  </dialog>
}
