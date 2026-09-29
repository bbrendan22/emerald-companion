function StatRow({
  label,
  value,
}) {
  return (
    <div className="mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PartyCard({ party }) {
  const pokemon =
    party?.pokemon ?? []

  return (
    <section className="party-card">
      <div className="party-header">
        <div>
          <p className="card-label">
            CURRENT TEAM
          </p>

          <h2>Party</h2>
        </div>

        <p className="party-count">
          {party?.count ?? 0} / 6
        </p>
      </div>

      {pokemon.length === 0 ? (
        <p className="party-empty">
          Load a save to view
          your party.
        </p>
      ) : (
        <div className="party-grid">
          {pokemon.map(
            (mon) => (
              <article
                className="party-pokemon"
                key={mon.slot}
              >
                <div className="party-pokemon-top">
                  <div>
                    <h3>
                      {
                        mon.speciesName
                      }
                    </h3>

                    <p className="nickname">
                      {mon.nickname}
                    </p>
                  </div>

                  <p className="level">
                    Lv. {mon.level}
                  </p>
                </div>

                <div className="pokemon-details">
                  <span>
                    {mon.nature}
                  </span>

                  {mon.gender && (
                    <span>
                      {mon.gender}
                    </span>
                  )}

                  <span>
                    {mon.ability}
                  </span>

                  {mon.shiny && (
                    <span className="shiny">
                      ★ Shiny
                    </span>
                  )}
                </div>

                <div className="profile-section">
                  <p className="profile-heading">
                    STATUS
                  </p>

                  <div className="profile-grid">
                    <StatRow
                      label="HP"
                      value={`${mon.stats.currentHP}/${mon.stats.maxHP}`}
                    />

                    <StatRow
                      label="Friendship"
                      value={
                        mon.friendship
                      }
                    />

                    <StatRow
                      label="EXP"
                      value={
                        mon.experience.toLocaleString()
                      }
                    />

                    <StatRow
                      label="Item"
                      value={
                        mon.heldItemName
                      }
                    />
                  </div>
                </div>

                <div className="profile-section">
                  <p className="profile-heading">
                    BATTLE STATS
                  </p>

                  <div className="six-stat-grid">
                    <StatRow
                      label="HP"
                      value={
                        mon.stats.maxHP
                      }
                    />

                    <StatRow
                      label="Atk"
                      value={
                        mon.stats.attack
                      }
                    />

                    <StatRow
                      label="Def"
                      value={
                        mon.stats.defense
                      }
                    />

                    <StatRow
                      label="Spe"
                      value={
                        mon.stats.speed
                      }
                    />

                    <StatRow
                      label="SpA"
                      value={
                        mon.stats.spAttack
                      }
                    />

                    <StatRow
                      label="SpD"
                      value={
                        mon.stats.spDefense
                      }
                    />
                  </div>
                </div>

                <div className="profile-section">
                  <p className="profile-heading">
                    IVs
                  </p>

                  <div className="six-stat-grid">
                    <StatRow
                      label="HP"
                      value={mon.ivs.hp}
                    />

                    <StatRow
                      label="Atk"
                      value={
                        mon.ivs.attack
                      }
                    />

                    <StatRow
                      label="Def"
                      value={
                        mon.ivs.defense
                      }
                    />

                    <StatRow
                      label="Spe"
                      value={
                        mon.ivs.speed
                      }
                    />

                    <StatRow
                      label="SpA"
                      value={
                        mon.ivs.spAttack
                      }
                    />

                    <StatRow
                      label="SpD"
                      value={
                        mon.ivs.spDefense
                      }
                    />
                  </div>
                </div>

                <div className="profile-section">
                  <p className="profile-heading">
                    EVs
                  </p>

                  <div className="six-stat-grid">
                    <StatRow
                      label="HP"
                      value={mon.evs.hp}
                    />

                    <StatRow
                      label="Atk"
                      value={
                        mon.evs.attack
                      }
                    />

                    <StatRow
                      label="Def"
                      value={
                        mon.evs.defense
                      }
                    />

                    <StatRow
                      label="Spe"
                      value={
                        mon.evs.speed
                      }
                    />

                    <StatRow
                      label="SpA"
                      value={
                        mon.evs.spAttack
                      }
                    />

                    <StatRow
                      label="SpD"
                      value={
                        mon.evs.spDefense
                      }
                    />
                  </div>
                </div>

                <div className="profile-section">
                  <p className="profile-heading">
                    MOVES
                  </p>

                  <div className="move-list">
                    {mon.moves.map(
                      (move) => (
                        <div
                          className="move-row"
                          key={
                            move.id
                          }
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
                    )}
                  </div>
                </div>

                <div className="profile-section">
                  <p className="profile-heading">
                    CONTEST
                  </p>

                  <div className="six-stat-grid">
                    <StatRow
                      label="Cool"
                      value={
                        mon.contest.cool
                      }
                    />

                    <StatRow
                      label="Beauty"
                      value={
                        mon.contest.beauty
                      }
                    />

                    <StatRow
                      label="Cute"
                      value={
                        mon.contest.cute
                      }
                    />

                    <StatRow
                      label="Smart"
                      value={
                        mon.contest.smart
                      }
                    />

                    <StatRow
                      label="Tough"
                      value={
                        mon.contest.tough
                      }
                    />

                    <StatRow
                      label="Sheen"
                      value={
                        mon.contest.sheen
                      }
                    />
                  </div>
                </div>

                <div className="profile-section">
                  <p className="profile-heading">
                    RIBBONS
                  </p>

                  {mon.ribbons.length ? (
                    <div className="ribbon-list">
                      {mon.ribbons.map(
                        (ribbon) => (
                          <span
                            key={
                              ribbon
                            }
                          >
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

                <div className="profile-footer">
                  <span>
                    Pokérus:{' '}
                    {mon.hasPokerus
                      ? 'Yes'
                      : 'No'}
                  </span>

                  <span>
                    Ability Slot{' '}
                    {mon.abilitySlot}
                  </span>
                </div>

                {!mon.checksumValid && (
                  <p className="checksum-warning">
                    Invalid Pokémon
                    checksum
                  </p>
                )}
              </article>
            )
          )}
        </div>
      )}
    </section>
  )
}

export default PartyCard