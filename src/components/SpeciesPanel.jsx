export default function SpeciesPanel({ anchor, title, open = false, embedded = false, children }) {
  if (embedded) return <div className="resource-species-embedded">{children}</div>
  return <details id={`species-${anchor}`} className="resource-species-panel" open={open}>
    <summary>{title}</summary><section>{children}</section>
  </details>
}
