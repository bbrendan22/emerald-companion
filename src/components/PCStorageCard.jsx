import {
  useEffect,
  useState,
} from 'react'

function MiniStat({
  label,
  value,
}) {
  return (
    <div className="pc-mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PokemonProfile({
  pokemon,
  onClose,
}) {
  if (!pokemon) {
    return null
  }

  return (
    <div className="pc-profile">
      <div className="pc-profile-header">
        <div>
          <p className="card-label">
            {pokemon.boxName} ·
            SLOT{' '}
            {pokemon.position}
          </p>

          <h3>
            {
              pokemon.speciesName
            }
          </h3>

          {pokemon.nickname &&
            pokemon.nickname !==
              pokemon.speciesName && (
              <p className="nickname">
                {
                  pokemon.nickname
                }
              </p>
            )}
        </div>

        <button
          className="pc-close-button"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="pokemon-details">
        <span>
          {pokemon.nature}
        </span>

        {pokemon.gender && (
          <span>
            {pokemon.gender}
          </span>
        )}

        <span>
          {pokemon.ability}
        </span>

        {pokemon.shiny && (
          <span className="shiny">
            ★ Shiny
          </span>
        )}
      </div>

      <div className="pc-profile-section">
        <p className="profile-heading">
          DETAILS
        </p>

        <div className="pc-detail-grid">
          <MiniStat
            label="Item"
            value={
              pokemon.heldItemName
            }
          />

          <MiniStat
            label="Friendship"
            value={
              pokemon.friendship
            }
          />

          <MiniStat
            label="EXP"
            value={
              pokemon.experience.toLocaleString()
            }
          />

          <MiniStat
            label="Pokérus"
            value={
              pokemon.hasPokerus
                ? 'Yes'
                : 'No'
            }
          />
        </div>
      </div>

      <div className="pc-profile-section">
        <p className="profile-heading">
          IVs
        </p>

        <div className="pc-six-grid">
          <MiniStat
            label="HP"
            value={
              pokemon.ivs.hp
            }
          />

          <MiniStat
            label="Atk"
            value={
              pokemon.ivs.attack
            }
          />

          <MiniStat
            label="Def"
            value={
              pokemon.ivs.defense
            }
          />

          <MiniStat
            label="Spe"
            value={
              pokemon.ivs.speed
            }
          />

          <MiniStat
            label="SpA"
            value={
              pokemon.ivs.spAttack
            }
          />

          <MiniStat
            label="SpD"
            value={
              pokemon.ivs.spDefense
            }
          />
        </div>
      </div>

      <div className="pc-profile-section">
        <p className="profile-heading">
          EVs
        </p>

        <div className="pc-six-grid">
          <MiniStat
            label="HP"
            value={
              pokemon.evs.hp
            }
          />

          <MiniStat
            label="Atk"
            value={
              pokemon.evs.attack
            }
          />

          <MiniStat
            label="Def"
            value={
              pokemon.evs.defense
            }
          />

          <MiniStat
            label="Spe"
            value={
              pokemon.evs.speed
            }
          />

          <MiniStat
            label="SpA"
            value={
              pokemon.evs.spAttack
            }
          />

          <MiniStat
            label="SpD"
            value={
              pokemon.evs.spDefense
            }
          />
        </div>
      </div>

      <div className="pc-profile-section">
        <p className="profile-heading">
          MOVES
        </p>

        <div className="move-list">
          {pokemon.moves.length ? (
            pokemon.moves.map(
              (move) => (
                <div
                  className="move-row"
                  key={move.id}
                >
                  <strong>
                    {
                      move.name
                    }
                  </strong>

                  <span>
                    PP {move.pp}
                  </span>
                </div>
              )
            )
          ) : (
            <p className="muted">
              No moves
            </p>
          )}
        </div>
      </div>

      <div className="pc-profile-section">
        <p className="profile-heading">
          CONTEST
        </p>

        <div className="pc-six-grid">
          <MiniStat
            label="Cool"
            value={
              pokemon.contest.cool
            }
          />

          <MiniStat
            label="Beauty"
            value={
              pokemon.contest.beauty
            }
          />

          <MiniStat
            label="Cute"
            value={
              pokemon.contest.cute
            }
          />

          <MiniStat
            label="Smart"
            value={
              pokemon.contest.smart
            }
          />

          <MiniStat
            label="Tough"
            value={
              pokemon.contest.tough
            }
          />

          <MiniStat
            label="Sheen"
            value={
              pokemon.contest.sheen
            }
          />
        </div>
      </div>

      <div className="pc-profile-section">
        <p className="profile-heading">
          RIBBONS
        </p>

        {pokemon.ribbons.length ? (
          <div className="ribbon-list">
            {pokemon.ribbons.map(
              (ribbon) => (
                <span key={ribbon}>
                  {ribbon}
                </span>
              )
            )}
          </div>
        ) : (
          <p className="muted">
            No ribbons
          </p>
        )}
      </div>

      {!pokemon.checksumValid && (
        <p className="checksum-warning">
          Invalid Pokémon
          checksum
        </p>
      )}
    </div>
  )
}

function PCStorageCard({
  storage,
}) {
  const [
    selectedBox,
    setSelectedBox,
  ] = useState(0)

  const [
    selectedPokemon,
    setSelectedPokemon,
  ] = useState(null)

  useEffect(() => {
    if (storage) {
      setSelectedBox(
        storage.currentBox ?? 0
      )

      setSelectedPokemon(
        null
      )
    }
  }, [storage])

  if (!storage) {
    return (
      <section className="pc-card">
        <p className="card-label">
          POKÉMON STORAGE
        </p>

        <h2>PC Boxes</h2>

        <p className="party-empty">
          Load a save to view
          your PC.
        </p>
      </section>
    )
  }

  const box =
    storage.boxes[
      selectedBox
    ]

  const slotMap =
    new Map(
      box.pokemon.map(
        (pokemon) => [
          pokemon.slot,
          pokemon,
        ]
      )
    )

  return (
    <section className="pc-card">
      <div className="pc-card-header">
        <div>
          <p className="card-label">
            POKÉMON STORAGE
          </p>

          <h2>PC Boxes</h2>
        </div>

        <div className="pc-summary">
          <strong>
            {
              storage.totalPokemon
            }
          </strong>

          <span>
            / {storage.capacity}
          </span>
        </div>
      </div>

      <div className="pc-overview">
        <div>
          <span>Stored</span>

          <strong>
            {
              storage.totalPokemon
            }
          </strong>
        </div>

        <div>
          <span>Shiny</span>

          <strong>
            {
              storage.shinyCount
            }
          </strong>
        </div>

        <div>
          <span>
            Current Box
          </span>

          <strong>
            {
              storage.currentBoxNumber
            }
          </strong>
        </div>
      </div>

      <div className="box-tabs">
        {storage.boxes.map(
          (item) => (
            <button
              key={
                item.index
              }
              className={
                item.index ===
                selectedBox
                  ? 'box-tab active'
                  : 'box-tab'
              }
              onClick={() => {
                setSelectedBox(
                  item.index
                )

                setSelectedPokemon(
                  null
                )
              }}
            >
              <span>
                {item.number}
              </span>

              <small>
                {
                  item.occupied
                }
                /30
              </small>
            </button>
          )
        )}
      </div>

      <div className="selected-box-header">
        <div>
          <p className="card-label">
            BOX {box.number}
          </p>

          <h3>
            {box.name}
          </h3>
        </div>

        <strong>
          {box.occupied} / 30
        </strong>
      </div>

      <div className="box-grid">
        {Array.from(
          { length: 30 },
          (_, slot) => {
            const pokemon =
              slotMap.get(
                slot
              )

            if (!pokemon) {
              return (
                <div
                  className="box-slot empty"
                  key={slot}
                >
                  <span>
                    {slot + 1}
                  </span>
                </div>
              )
            }

            return (
              <button
                className={
                  pokemon.shiny
                    ? 'box-slot occupied shiny-slot'
                    : 'box-slot occupied'
                }
                key={slot}
                onClick={() =>
                  setSelectedPokemon(
                    pokemon
                  )
                }
              >
                <span className="box-slot-number">
                  {slot + 1}
                </span>

                <strong>
                  {
                    pokemon.speciesName
                  }
                </strong>

                <small>
                  {
                    pokemon.nature
                  }
                </small>

                {pokemon.shiny && (
                  <span className="box-shiny">
                    ★
                  </span>
                )}
              </button>
            )
          }
        )}
      </div>

      <PokemonProfile
        pokemon={
          selectedPokemon
        }
        onClose={() =>
          setSelectedPokemon(
            null
          )
        }
      />
    </section>
  )
}

export default PCStorageCard