import { useRef } from 'react'

import {
  inspectSaveSections,
  readTrainerId,
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
}) {
  const inputRef = useRef(null)

  async function handleFileChange(
    event
  ) {
    const file =
      event.target.files[0]

    if (!file) {
      return
    }

    const buffer =
      await file.arrayBuffer()

    const bytes =
      new Uint8Array(buffer)

    inspectSaveSections(bytes)

    const saveData = {
      trainerId:
        readTrainerId(bytes),

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

    event.target.value = ''
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
          Update Save
        </button>
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