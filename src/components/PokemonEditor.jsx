import { speciesMoveOptions } from '../utils/speciesMoveOptions'
import FitSelect from './FitSelect'
import { useEffect, useRef, useState } from 'react'
import { collectionRibbonCatalog, ribbonEarned, toggleRibbon, friendshipAssessments, pokerusDisplay, expForLevel, levelFromExperience } from '../utils/collectionDetails'
import { speciesGenders } from '../utils/breeding'
import { pokemonMeta } from '../data/pokemonMeta'
import { speciesInfo, abilityNames, moveNames, moveInfo, itemNames } from '../data/emeraldData'

const stats = [['HP','hp'],['Attack','attack'],['Defense','defense'],['Sp. Attack','spAttack'],['Sp. Defense','spDefense'],['Speed','speed']]
const natures = ['Hardy','Lonely','Brave','Adamant','Naughty','Bold','Docile','Relaxed','Impish','Lax','Timid','Hasty','Serious','Jolly','Naive','Modest','Mild','Quiet','Bashful','Rash','Calm','Gentle','Sassy','Careful','Quirky']
const species = Object.entries(pokemonMeta).filter(([,meta]) => meta.dex <= 386 && meta.generation <= 3).sort((a,b)=>a[1].dex-b[1].dex)
const namedOptions = names => Object.entries(names).filter(([id,name])=>Number(id)>0 && !/^(Item \d|Unused)/.test(name)).sort((a,b)=>a[1].localeCompare(b[1]))


export default function PokemonEditor({ pokemon, onSave, onClose, onDelete }) {
  const ref = useRef(null)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draft,setDraft] = useState(()=>({
    species: String(pokemon?.species ?? species[0][0]), nickname: pokemon?.nickname ?? '', level: pokemon?.level ?? 5,
    shiny: pokemon?.shiny ?? false, gender: speciesGenders(pokemon?.species ?? species[0][0]).includes(pokemon?.gender) ? pokemon.gender : speciesGenders(pokemon?.species ?? species[0][0])[0], nature: pokemon?.nature ?? 'Hardy',
    abilityId: String(pokemon?.abilityId ?? speciesInfo[pokemon?.species ?? species[0][0]]?.abilities?.[0] ?? 0),
    heldItem: String(pokemon?.heldItem ?? 0), moves: Array.from({length:4},(_,i)=>String(pokemon?.moves?.[i]?.id ?? 0)),
    ivs: Object.fromEntries(stats.map(([,key])=>[key,pokemon?.ivs?.[key] ?? 0])),
    evs: Object.fromEntries(stats.map(([,key])=>[key,pokemon?.evs?.[key] ?? 0])),
    originGame:pokemon?.originGame ?? 'Emerald', otName:pokemon?.otName ?? '',
    experience:pokemon?.experience ?? '', friendship:pokemon?.friendship ?? '', friendshipAssessment:pokemon?.friendshipAssessment ?? '', friendshipMode:pokemon?.friendship != null ? 'exact' : pokemon?.friendshipAssessment ? 'assessment' : 'unknown',
    pokerusStatus:pokerusDisplay(pokemon), pokeBall:pokemon?.pokeBall ?? '', ribbons:pokemon?.ribbons ?? [], ribbonsChecked:pokemon?.ribbonsChecked ?? (pokemon?.ribbons != null),
  }))
  useEffect(()=>{ const focus=document.activeElement; const dialog=ref.current; dialog.showModal(); return ()=>{dialog.close();focus?.focus()} },[])
  useEffect(()=>{
    const viewport=window.visualViewport
    const dialog=ref.current
    const anchor=()=>{
      dialog.style.setProperty('--editor-top',`${(viewport?.offsetTop ?? 0)+16}px`)
      dialog.style.setProperty('--editor-height',`${Math.min(680,(viewport?.height ?? window.innerHeight)-32)}px`)
    }
    anchor()
    viewport?.addEventListener('resize',anchor)
    viewport?.addEventListener('scroll',anchor)
    window.addEventListener('resize',anchor)
    return ()=>{viewport?.removeEventListener('resize',anchor);viewport?.removeEventListener('scroll',anchor);window.removeEventListener('resize',anchor)}
  },[])
  const update=(key,value)=>setDraft(current=>({...current,[key]:value}))
  const abilities=speciesInfo[draft.species]?.abilities ?? []
  const genders=speciesGenders(draft.species)
  const moveOptions=speciesMoveOptions(draft.species)
  function submit(event) {
    event.preventDefault()
    if(Object.values(draft.evs).reduce((sum,v)=>sum+Number(v),0)>510){setError('Total EVs cannot exceed 510.');return}
    const growth=speciesInfo[draft.species]?.growthRate
    if(draft.experience !== '' && Number(draft.experience)>expForLevel(100,growth)){setError('Experience exceeds this species’ level 100 maximum.');return}
    const savedLevel=draft.experience !== '' ? levelFromExperience(Number(draft.experience),growth) : Number(draft.level)
    const chosen=draft.moves.filter(id=>id!=='0')
    if(new Set(chosen).size!==chosen.length){setError('Choose different moves for each slot.');return}
    const next={...pokemon,...draft,species:Number(draft.species),speciesName:pokemonMeta[draft.species].name,
      nickname:draft.nickname.trim() || pokemonMeta[draft.species].name, level:savedLevel,
      abilityId:Number(draft.abilityId), ability:abilityNames[draft.abilityId], abilitySlot:Math.max(0,abilities.indexOf(Number(draft.abilityId))),
      heldItem:Number(draft.heldItem),heldItemName:itemNames[draft.heldItem],
      originGame:draft.originGame,otName:draft.otName.trim(),
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
    delete next.friendshipMode
    next.friendship=draft.friendshipMode === 'exact' && draft.friendship !== '' ? Number(draft.friendship) : null
    next.friendshipAssessment=draft.friendshipMode === 'assessment' ? draft.friendshipAssessment : null
    next.experience=draft.experience === '' ? null : Number(draft.experience)
    onSave(next);onClose()
  }
  return <dialog ref={ref} className="pokemon-editor collection-themed-editor" aria-labelledby="pokemon-editor-title" onCancel={onClose}>
    <header><h2 id="pokemon-editor-title">{pokemon?'Edit Pokémon':'Add Pokémon'}</h2><button type="button" aria-label="Close Pokémon form" onClick={onClose}>×</button></header>
    {confirmDelete ? <div className="collection-editor-delete-confirm"><h3>Delete {pokemon.nickname || pokemon.speciesName}?</h3><p>This removes it from your tracked collection. Your original save file is unchanged.</p><footer><button type="button" onClick={() => setConfirmDelete(false)}>Keep Pokémon</button><button type="button" className="collection-editor-delete" onClick={() => {onDelete(pokemon);onClose()}}>Delete Pokémon</button></footer></div> : <form onSubmit={submit}>
      <div className="collection-editor-scroll">
      <h3>Pokémon</h3>
      <div className="pokemon-editor-fields">
        <label>Species<FitSelect value={draft.species} onChange={e=>setDraft(current=>({...current,species:e.target.value,experience:'',abilityId:String(speciesInfo[e.target.value]?.abilities?.[0] ?? 0),gender:speciesGenders(e.target.value).includes(current.gender) ? current.gender : speciesGenders(e.target.value)[0],moves:current.moves.map(move => speciesMoveOptions(e.target.value).some(([id]) => id === move) ? move : '0')}))}>{species.map(([id,meta])=><option key={id} value={id}>{meta.name}</option>)}</FitSelect></label>
        <label>Nickname<input placeholder="Optional" maxLength="10" value={draft.nickname} onChange={e=>update('nickname',e.target.value)} /></label>
        <label>Level<input type="number" required min="1" max="100" step="1" value={draft.level} onChange={e=>setDraft(current=>({...current,level:e.target.value,experience:''}))} /></label>
        <label>Gender<FitSelect value={draft.gender} onChange={e=>update('gender',e.target.value)}>{genders.map(v=><option key={v}>{v}</option>)}</FitSelect></label>
        <label>Nature<FitSelect value={draft.nature} onChange={e=>update('nature',e.target.value)}>{natures.map(v=><option key={v}>{v}</option>)}</FitSelect></label>
        <label>Ability<FitSelect value={draft.abilityId} onChange={e=>update('abilityId',e.target.value)}>{abilities.map(id=><option key={id} value={id}>{abilityNames[id]}</option>)}</FitSelect></label>
        <label>Held Item<FitSelect value={draft.heldItem} onChange={e=>update('heldItem',e.target.value)}><option value="0">None</option>{namedOptions(itemNames).map(([id,name])=><option key={id} value={id}>{name}</option>)}</FitSelect></label>
        <div className="pokemon-editor-shiny"><label><input type="checkbox" checked={draft.shiny} onChange={e=>update('shiny',e.target.checked)} />Shiny</label></div>
      </div>
      <fieldset><legend>Moves</legend><div className="pokemon-editor-fields">{draft.moves.map((move,i)=><label key={i}>Move {i+1}<FitSelect value={move} onChange={e=>update('moves',draft.moves.map((v,j)=>j===i?e.target.value:v))}><option value="0">None</option>{moveOptions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</FitSelect></label>)}</div></fieldset>
      <details><summary>IVs & EVs</summary><p>IVs: 0–31 each. EVs: 0–255 each, 510 total.</p><div className="pokemon-editor-stats"><span>Stat</span><span>IV</span><span>EV</span>{stats.map(([name,key])=><div className="pokemon-editor-stat-row" key={key}><span>{name}</span>{['ivs','evs'].map(type=><input key={type} aria-label={`${name} ${type==='ivs'?'IV':'EV'}`} type="number" required min="0" max={type==='ivs'?31:255} step="1" value={draft[type][key]} onChange={e=>update(type,{...draft[type],[key]:e.target.value})} />)}</div>)}</div></details>
      <details className="collection-editor-placeholder"><summary>Details</summary><div className="pokemon-editor-fields collection-editor-details-fields">
        <label>Origin game<FitSelect value={draft.originGame} onChange={e=>update('originGame',e.target.value)}>{['Unknown','Emerald','Ruby','Sapphire','FireRed','LeafGreen','Colosseum','XD','Colosseum / XD'].map(game=><option key={game}>{game}</option>)}</FitSelect></label>
        <label>Original trainer (OT)<input maxLength="7" placeholder="Unknown" value={draft.otName} onChange={e=>update('otName',e.target.value)} /></label>
        <label>Total experience<input type="number" min="0" step="1" placeholder="Unknown" value={draft.experience} onChange={e=>{const value=e.target.value;setDraft(current=>({...current,experience:value,level:value === '' ? current.level : levelFromExperience(Number(value),speciesInfo[current.species]?.growthRate)}))}} /></label>
        <label>Poké Ball<FitSelect value={draft.pokeBall} onChange={e=>update('pokeBall',e.target.value)}><option value="">Unknown</option>{['Poké Ball','Great Ball','Ultra Ball','Master Ball','Safari Ball','Net Ball','Dive Ball','Nest Ball','Repeat Ball','Timer Ball','Luxury Ball','Premier Ball'].map(ball=><option key={ball}>{ball}</option>)}</FitSelect></label>
        <label>Pokérus<FitSelect value={draft.pokerusStatus} onChange={e=>update('pokerusStatus',e.target.value)}>{['Unknown','Never infected','Currently infected','Previously infected'].map(status=><option key={status}>{status}</option>)}</FitSelect></label>
        <label>Friendship information<FitSelect value={draft.friendshipMode} onChange={e=>update('friendshipMode',e.target.value)}><option value="unknown">Unknown</option><option value="exact">Exact value</option><option value="assessment">Verdanturf assessment</option></FitSelect></label>
        {draft.friendshipMode === 'exact' && <label>Friendship (0–255)<input type="number" min="0" max="255" step="1" placeholder="Unknown" value={draft.friendship} onChange={e=>update('friendship',e.target.value)} /></label>}
        {draft.friendshipMode === 'assessment' && <label className="collection-editor-wide">Rater assessment<FitSelect value={draft.friendshipAssessment} onChange={e=>update('friendshipAssessment',e.target.value)}><option value="">Unknown</option>{friendshipAssessments.map(a=><option key={a.id} value={a.id}>{a.label} ({a.min === a.max ? a.min : `${a.min}–${a.max}`})</option>)}</FitSelect></label>}
      </div><p>Copy total experience from the in-game summary. Its level updates automatically. Friendship assessments record a range, not an exact value.</p></details>
      <details className="collection-editor-placeholder"><summary>Ribbons</summary><label className="collection-editor-ribbons-checked"><input type="checkbox" checked={draft.ribbonsChecked} onChange={e=>update('ribbonsChecked',e.target.checked)} />Ribbons checked</label><h4>Contest ribbons</h4><div className="pokemon-editor-fields">{['Cool','Beauty','Cute','Smart','Tough'].map(category=>{const ranks=collectionRibbonCatalog.filter(r=>r.category===category);const rank=ranks.reduce((highest,r)=>ribbonEarned(draft.ribbons,r) ? r.rank : highest,0);return <label key={category}>{category}<FitSelect value={rank} onChange={event=>{const value=Number(event.target.value);setDraft(current=>{const cleared=toggleRibbon(current.ribbons,ranks[0],false);return {...current,ribbons:value ? toggleRibbon(cleared,ranks[value-1],true) : cleared,ribbonsChecked:true}})}}><option value="0">None</option>{ranks.map(r=><option key={r.rank} value={r.rank}>{['Normal','Super','Hyper','Master'][r.rank-1]}</option>)}</FitSelect></label>})}</div><h4>Other ribbons</h4><div className="collection-editor-ribbon-names">{collectionRibbonCatalog.filter(r=>!r.category).map(ribbon=>{const earned=ribbonEarned(draft.ribbons,ribbon);return <label key={ribbon.name}><input type="checkbox" checked={earned} onChange={event=>{const checked=event.target.checked;setDraft(current=>({...current,ribbons:toggleRibbon(current.ribbons,ribbon,checked),ribbonsChecked:true}))}} />{ribbon.name}</label>})}</div><p>Contest ranks include earlier ranks. Check your ribbons in the PokéNav.</p></details>
      <p className="collection-editor-ev-total">EVs used: <strong>{Object.values(draft.evs).reduce((sum,value)=>sum+Number(value),0)} / 510</strong></p>
      {error&&<p role="alert">{error}</p>}
      </div>
      <footer>{pokemon && onDelete && <button type="button" className="collection-editor-delete" onClick={() => setConfirmDelete(true)}>Delete</button>}<button type="button" onClick={onClose}>Cancel</button><button type="submit">{pokemon?'Save':'Add Pokémon'}</button></footer>
    </form>}
  </dialog>
}
