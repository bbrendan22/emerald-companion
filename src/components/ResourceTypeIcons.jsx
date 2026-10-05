export default function ResourceTypeIcons({ types }) {
  return <div className="resource-type-icons">{types.map(type => <img key={type} src={`${import.meta.env.BASE_URL}type-icons/${type.toLowerCase()}.png`} alt={`${type} type`} title={type} />)}</div>
}
