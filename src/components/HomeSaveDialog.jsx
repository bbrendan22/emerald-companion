import { useEffect, useRef, useState } from 'react'
import SaveLoader from './SaveLoader'

const badgeNames = ['Stone', 'Knuckle', 'Dynamo', 'Heat', 'Balance', 'Feather', 'Mind', 'Rain']
const facilities = ['Tower', 'Dome', 'Palace', 'Arena', 'Factory', 'Pike', 'Pyramid']

function makeDraft(save) {
  const gender = String(save.trainerGender ?? save.gender ?? 'male').toLowerCase()
  const symbols = save.frontierSymbols ?? save.frontier?.symbols ?? {}
  return {
    trainerName: save.trainerName ?? '',
    trainerGender: /female|girl|may/.test(gender) ? 'female' : 'male',
    trainerId: save.trainerId ?? '',
    secretId: save.secretId ?? save.secretTrainerId ?? save.sid ?? '',
    hours: save.playTime?.hours ?? 0,
    minutes: save.playTime?.minutes ?? 0,
    money: save.money ?? 0,
    caughtCount: save.pokedex?.caughtCount ?? 0,
    badges: badgeNames.map((_, i) => save.badgeData?.badges?.[i] ?? (i < (save.badgeData?.count ?? 0))),
    symbols: Object.fromEntries(facilities.map(name => {
      const key = name.toLowerCase()
      const value = String(symbols[key] ?? symbols[name.toUpperCase()] ?? '').toLowerCase()
      return [key, value.includes('gold') ? 'gold' : value.includes('silver') ? 'silver' : 'none']
    })),
  }
}

export default function HomeSaveDialog({ saveData, onSaveLoaded, onClose }) {
  const [mode, setMode] = useState('choose')
  const [draft, setDraft] = useState(() => makeDraft(saveData))
  const dialogRef = useRef(null)
  useEffect(() => {
    const previousFocus = document.activeElement
    const dialog = dialogRef.current
    dialog.showModal()
    return () => { dialog.close(); previousFocus?.focus() }
  }, [])

  const update = (key, value) => setDraft(current => ({ ...current, [key]: value }))
  function saveManual(event) {
    event.preventDefault()
    const next = {
      ...saveData,
      trainerName: draft.trainerName.trim(), trainerGender: draft.trainerGender,
      trainerId: draft.trainerId === '' ? null : Number(draft.trainerId),
      secretId: draft.secretId === '' ? null : Number(draft.secretId),
      playTime: { ...saveData.playTime, hours: Number(draft.hours), minutes: Number(draft.minutes) },
      money: Number(draft.money),
      badgeData: { ...saveData.badgeData, badges: draft.badges, count: draft.badges.filter(Boolean).length },
      pokedex: { ...saveData.pokedex, caughtCount: Number(draft.caughtCount) },
      frontierSymbols: draft.symbols, updatedAt: Date.now(),
    }
    onSaveLoaded(next)
    onClose()
  }
  const numberField = (label, key, max, optional = false) => (
    <label>{label}<input type="number" min="0" max={max} step="1" required={!optional} value={draft[key]} onChange={event => update(key, event.target.value)} /></label>
  )

  return <dialog ref={dialogRef} className="home-save-dialog" aria-labelledby="home-save-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="home-save-dialog-heading"><h2 id="home-save-title">{mode === 'manual' ? 'EDIT HOMEPAGE' : 'UPDATE SAVE'}</h2><button type="button" aria-label="Close update save" onClick={onClose}>×</button></div>
    {mode === 'choose' && <div className="home-save-options">
      <button onClick={() => setMode('import')}><strong>Import Save File</strong><span>Update the app from your Emerald .sav file.</span></button>
      <button onClick={() => setMode('manual')}><strong>Edit Manually</strong><span>Update trainer details, badges, and progress.</span></button>
    </div>}
    {mode === 'import' && <div className="home-save-import">
      <p>Importing replaces your tracked homepage information and Pokémon collection with the selected save.</p>
      <SaveLoader compact label="Choose Save File" onSaveLoaded={save => { onSaveLoaded(save); onClose() }} />
      <p className="home-save-note">Your save stays on this device and is parsed locally.</p>
      <button type="button" onClick={() => setMode('choose')}>Back</button>
    </div>}
    {mode === 'manual' && <form onSubmit={saveManual}>
      <fieldset><legend>Trainer</legend><div className="home-save-fields">
        <label>Trainer Name<input maxLength="7" value={draft.trainerName} onChange={event => update('trainerName', event.target.value)} /></label>
        <label>Trainer Sprite<select value={draft.trainerGender} onChange={event => update('trainerGender', event.target.value)}><option value="male">Brendan</option><option value="female">May</option></select></label>
        {numberField('Trainer ID', 'trainerId', 65535, true)}{numberField('Secret ID', 'secretId', 65535, true)}
        {numberField('Hours Played', 'hours', 9999)}{numberField('Minutes', 'minutes', 59)}{numberField('Money', 'money', 999999)}
      </div></fieldset>
      <fieldset><legend>Badges</legend><div className="home-save-badges">{badgeNames.map((name, i) => <label key={name}><input type="checkbox" checked={draft.badges[i]} onChange={event => update('badges', draft.badges.map((earned, index) => index === i ? event.target.checked : earned))} /><img src={`${import.meta.env.BASE_URL}home/badges/${name.toLowerCase()}_badge.png`} alt="" />{name}</label>)}</div></fieldset>
      <fieldset><legend>Pokédex</legend>{numberField('Species Caught', 'caughtCount', 386)}<p className="home-save-note">Owned and Shinies are calculated from My Pokémon.</p></fieldset>
      <fieldset><legend>Battle Frontier</legend><div className="home-save-fields">{facilities.map(name => <label key={name}>{name}<select value={draft.symbols[name.toLowerCase()]} onChange={event => update('symbols', { ...draft.symbols, [name.toLowerCase()]: event.target.value })}><option value="none">None</option><option value="silver">Silver</option><option value="gold">Gold</option></select></label>)}</div></fieldset>
      <div className="home-save-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save Changes</button></div>
    </form>}
  </dialog>
}
