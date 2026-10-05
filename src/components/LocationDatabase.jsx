import { useState } from 'react'
import { locationIndex } from '../data/locationIndex'

const categories=['Cities & Towns','Routes','Other Areas','Battle Frontier']
const roots=locationIndex.filter(location=>!location.parent).map(location=>({
 ...location,
 category:location.id==='MAPSEC_BATTLE_FRONTIER'?categories[3]:/ (City|Town)$/.test(location.name)?categories[0]:/^Route \d+$/.test(location.name)?categories[1]:categories[2],
 children:locationIndex.filter(child=>child.parent===location.id),
}))

export default function LocationDatabase({onBack}) {
 const [search,setSearch]=useState('')
 const [selected,setSelected]=useState(null)
 const [tab,setTab]=useState('Overview')
 const query=search.trim().toLowerCase()
 const matches=roots.flatMap(location=>{
  if(location.name.toLowerCase().includes(query))return [location]
  const children=location.children.filter(child=>child.name.toLowerCase().includes(query))
  return children.length?[{...location,children}]:[]
 })
 if(selected)return <div className="resources-page">
  <div className="resource-list-heading"><button className="resources-back" onClick={()=>setSelected(null)}>← Back</button><h2>{selected.name}</h2></div>
  <div className="resource-profile-tabs resource-location-tabs" role="tablist" aria-label="Location information">{['Overview','Encounters','Trainers','Items'].map(name=><button key={name} id={`location-tab-${name}`} role="tab" aria-selected={tab===name} aria-controls="location-tab-content" onClick={()=>setTab(name)}>{name}</button>)}</div>
  <div id="location-tab-content" role="tabpanel" aria-labelledby={`location-tab-${tab}`}/>
 </div>
 return <div className="resources-page">
  <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><h2>Locations</h2><span>{locationIndex.length} locations</span></div>
  <div className="resource-database-controls resource-abilities-controls"><label className="resources-search"><input type="search" aria-label="Search locations" placeholder="Search" value={search} onChange={event=>setSearch(event.target.value)}/></label></div>
  {categories.map(category=>{
   const locations=matches.filter(location=>location.category===category)
   return locations.length>0&&<section className="resource-location-category" key={category}><h3>{category}</h3><div className="resource-location-index">{locations.map(location=>location.children.length?
    <div className="resource-location-parent" key={location.id}><div className="resource-location-parent-name">{location.name}</div><div className="resource-location-children">{location.children.map(child=><div key={child.id}>{child.name}</div>)}</div></div>:
    <div key={location.id}>{location.id==='MAPSEC_ROUTE_102'?<button className="resource-location-link" onClick={()=>{setTab('Overview');setSelected(location)}}>{location.name}</button>:location.name}</div>
   )}</div></section>
  })}
  {!matches.length&&<p className="resource-empty">No results.</p>}
 </div>
}
