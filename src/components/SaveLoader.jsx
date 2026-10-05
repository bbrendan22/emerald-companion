import { useRef, useState } from 'react'

import {
  inspectSaveSections,
  readTrainerId,
  readSecretId,
  readTrainerName,
  readPlayTime,
  readMoney,
  readBadges,
  readPokedex,
  readParty,
  readPCStorage,
} from '../utils/saveParser'

function SaveLoader({
  onSaveLoaded,
  compact = false,
  label = 'Update Save',
}) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  async function handleFileChange(
    event
  ) {
    const file =
      event.target.files[0]

    if (!file) {
      return
    }

    setError('')
    try {
    const buffer =
      await file.arrayBuffer()

    const bytes =
      new Uint8Array(buffer)

    if (!readTrainerName(bytes) || readTrainerId(bytes) === null) {
      throw new Error('Please select a valid Pokémon Emerald save file.')
    }
    inspectSaveSections(bytes)

    const saveData = {
      trainerId:
        readTrainerId(bytes),

      secretId: readSecretId(bytes),

      trainerName:
        readTrainerName(bytes),

      playTime:
        readPlayTime(bytes),

      money:
        readMoney(bytes),

      badgeData:
        readBadges(bytes),

      pokedex:
        readPokedex(bytes),

      party:
        readParty(bytes),

      pcStorage:
        readPCStorage(bytes),

      updatedAt:
        Date.now(),

      fileName:
        file.name,
    }

    onSaveLoaded(saveData)

    } catch {
      setError('Unable to read this save. Please select a valid Pokémon Emerald .sav file.')
    } finally {
      event.target.value = ''
    }
  }

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          className="hidden-file-input"
          type="file"
          accept=".sav"
          onChange={
            handleFileChange
          }
        />

        <button
          className="update-save-button"
          onClick={() =>
            inputRef.current?.click()
          }
        >
          <svg className="save-upload-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M12 15V3m-5 5 5-5 5 5M4 14v6h16v-6" />
          </svg>
          {label}
        </button>
        {error && <p role="alert">{error}</p>}
      </>
    )
  }

  return (
    <section className="first-load-card">
      <div className="emerald-orb">
        <span>◆</span>
      </div>

      <p className="page-eyebrow">
        EMERALD COMPANION
      </p>

      <h2>
        Load your Emerald save
      </h2>

      <p className="first-load-copy">
        Choose your Pokémon
        Emerald .sav file once.
        Emerald Companion will
        remember the parsed save
        on this device.
      </p>

      <input
        ref={inputRef}
        className="hidden-file-input"
        type="file"
        accept=".sav"
        onChange={
          handleFileChange
        }
      />

      <button
        className="primary-button"
        onClick={() =>
          inputRef.current?.click()
        }
      >
        Choose Save File
      </button>

      <p className="privacy-note">
        Your save is parsed
        locally in your browser.
      </p>
    </section>
  )
}

export default SaveLoader