function PokedexCard({ pokedex }) {
  const seen = pokedex?.seenCount ?? 0
  const caught = pokedex?.caughtCount ?? 0
  const total = pokedex?.total ?? 386

  return (
    <section className="pokedex-card">
      <div className="pokedex-header">
        <div>
          <p className="card-label">
            NATIONAL POKÉDEX
          </p>

          <h2>Pokédex</h2>
        </div>

        <p className="pokedex-total">
          {caught} / {total}
        </p>
      </div>

      <div className="pokedex-stats">
        <div>
          <p className="stat-label">
            SEEN
          </p>

          <p className="pokedex-number">
            {seen}
          </p>
        </div>

        <div>
          <p className="stat-label">
            CAUGHT
          </p>

          <p className="pokedex-number">
            {caught}
          </p>
        </div>

        <div>
          <p className="stat-label">
            TOTAL
          </p>

          <p className="pokedex-number">
            {total}
          </p>
        </div>
      </div>
    </section>
  )
}

export default PokedexCard