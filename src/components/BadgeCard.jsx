const badgeNames = [
  'Stone',
  'Knuckle',
  'Dynamo',
  'Heat',
  'Balance',
  'Feather',
  'Mind',
  'Rain',
]

function BadgeCard({ badgeData }) {
  const badges =
    badgeData?.badges ??
    Array(8).fill(false)

  const count =
    badgeData?.count ?? 0

  return (
    <section className="badge-card">
      <div className="badge-header">
        <div>
          <p className="card-label">
            HOENN LEAGUE
          </p>

          <h2>Badges</h2>
        </div>

        <p className="badge-count">
          {count} / 8
        </p>
      </div>

      <div className="badge-grid">
        {badgeNames.map((name, index) => {
          const earned = badges[index]

          return (
            <div
              className={
                earned
                  ? 'badge earned'
                  : 'badge'
              }
              key={name}
            >
              <div className="badge-icon">
                {index + 1}
              </div>

              <p>{name}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default BadgeCard