function TrainerCard({
  name,
  trainerId,
  playTime,
  money,
}) {
  return (
    <section className="trainer-card">
      <p className="card-label">TRAINER</p>

      <h2>{name}</h2>
      <p>Pokémon Trainer</p>

      <div className="trainer-stats">
        <div>
          <p className="stat-label">ID NO.</p>
          <p>{trainerId}</p>
        </div>

        <div>
          <p className="stat-label">PLAY TIME</p>
          <p>{playTime}</p>
        </div>

        <div>
          <p className="stat-label">MONEY</p>
          <p>{money}</p>
        </div>
      </div>
    </section>
  )
}

export default TrainerCard