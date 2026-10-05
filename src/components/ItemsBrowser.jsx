import { useState } from 'react'
import { itemCategories, itemCategory, battleGroups, berryGroups, utilityGroups, miscGroups, itemDescription } from '../utils/itemCategories'
import { itemResources, machineResources } from '../data/itemResources'
import { machineIconIds } from '../data/itemIcons'
import { emeraldShopItems, frontierItemPrices, machineItemPrices } from '../data/itemShopData'
import { itemNames, moveNames } from '../data/emeraldData'
import { pokemonMeta } from '../data/pokemonMeta'
import { moveResources } from '../data/moveResources'
const pockets={ITEMS:'Items',KEY_ITEMS:'Key Items',POKE_BALLS:'Poké Balls',TM_HM:'TMs/HMs',BERRIES:'Berries'}
const machines=machineResources.map(m=>({...itemResources[machineIconIds[m.code]],...m,id:machineIconIds[m.code],price:machineItemPrices[machineIconIds[m.code]],name:moveNames[m.moveId],machine:true}))
const items=Object.entries(itemResources).map(([id,item])=>({id,...item,name:itemNames[id]??item.name})).sort((a,b)=>a.name.localeCompare(b.name))

export default function ItemsBrowser({ machinesOnly, initialEntry, onToolBack, onLocationBack, onBack, onMove, onPokemon }) {
 const [search,setSearch]=useState('')
 const [filter,setFilter]=useState(machinesOnly?'TMs/HMs':'Battle')
 const [selected,setSelected]=useState(initialEntry??null)
 const entries=[...items.filter(item=>item.pocket!=='TM_HM'),...machines]
 const matches=entries.filter(item=>`${item.name} ${item.code??''}`.toLowerCase().includes(search.trim().toLowerCase())&&itemCategory(item)===filter)
 const groupDefinitions={Battle:battleGroups,Utility:utilityGroups,Berries:berryGroups,'Misc.':miscGroups}[filter]
 const groups=filter==='TMs/HMs'?['TM','HM'].map(prefix=>({name:prefix==='TM'?'TMs':'HMs',entries:matches.filter(item=>item.code.startsWith(prefix))})).filter(group=>group.entries.length):groupDefinitions?Object.entries(groupDefinitions).map(([name,ids])=>({name,entries:matches.filter(item=>ids.includes(Number(item.id)))})).filter(group=>group.entries.length):[{name:null,entries:matches}]
 const machine=selected?.machine?selected:machines.find(m=>m.code===selected?.name)
 return <div className="resources-page">
 {selected&&<button className="resources-back" onClick={onToolBack??onLocationBack??(()=>setSelected(null))}>← Back</button>}
 {selected?<article className="resource-species">
 <div className="resource-species-hero"><span>EMERALD · {machine?machine.code:pockets[selected.pocket]??'ITEM'}</span><h2>{machine?`${machine.code} · ${machine.name}`:selected.name}</h2>{machine&&<div className="resource-types"><span>{moveResources[machine.moveId].type}</span></div>}</div>
 <section><h3>Effect</h3><p className="resource-effect-copy">{machine?moveResources[machine.moveId].description:itemDescription(selected)}</p>{machine&&<><p className="resource-note">{machine.code.startsWith('TM')?'Single-use TM in Emerald.':'Reusable HM in Emerald. HM moves require the Move Deleter to forget.'}</p><button className="resource-ability-link" onClick={()=>onMove(machine.moveId,selected)}>View {machine.name} move details →</button></>}</section>
 {!selected.machine&&<section><h3>Item Info</h3><dl><dt>Bag pocket</dt><dd>{pockets[selected.pocket]??selected.pocket}</dd><dt>Base price</dt><dd>{selected.price?`₽${selected.price.toLocaleString()}`:'Not normally sold'}</dd><dt>Held effect</dt><dd>{selected.held?'Yes':'No'}</dd></dl><p className="resource-note">Base price is game data, not a guarantee that a shop sells this item. Some defined items are unused or belong to other Gen III games.</p></section>}
 {machine&&<section><h3>Compatible Pokémon</h3><p className="resource-note">{machine.species.length} species · Emerald learnsets</p><div className="resource-pokemon-grid">{machine.species.map(id=>{const meta=pokemonMeta[id];return <button key={id} onClick={()=>onPokemon([String(id),meta],selected)}><span>#{String(meta.dex).padStart(3,'0')}</span><img loading="lazy" src={`${import.meta.env.BASE_URL}sprites/emerald/${meta.dex}.png`} alt=""/><strong>{meta.name}</strong><small>{meta.types.join(' / ')}</small></button>})}</div></section>}
 <p className="resource-note">Explore Hoenn lists pickups, hidden items, and scripted gifts by location. Source: <a href="https://github.com/pret/pokeemerald/blob/master/src/data/items.h" target="_blank" rel="noreferrer">Emerald item data</a> and <a href="https://github.com/pret/pokeemerald/blob/master/src/data/pokemon/tmhm_learnsets.h" target="_blank" rel="noreferrer">TM/HM learnsets</a>.</p>
 </article>:<>
 <div className="resource-list-heading"><button className="resources-back" onClick={onBack}>← Back</button><h2>Items</h2><span>{matches.length} entries</span></div>
 <div className="resource-database-controls resource-abilities-controls"><label className="resources-search"><input aria-label="Search items" type="search" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
 <div className="resource-profile-tabs resource-item-tabs" role="tablist" aria-label="Item categories">{itemCategories.map(category=><button key={category} role="tab" aria-selected={filter===category} onClick={()=>setFilter(category)}>{category}</button>)}</div>
 <div className="resource-item-groups">{groups.map(group=><section key={group.name??filter}>{group.name&&<h3>{group.name}</h3>}<div className="resource-move-list">{group.entries.map(item=><div className="resource-item-entry" key={item.code??item.id}><img loading="lazy" src={`${import.meta.env.BASE_URL}items/${item.machine?machineIconIds[item.code]:item.id}.png`} alt=""/><div><strong>{item.machine?`${item.code} · ${item.name}`:item.name}</strong><small>{item.machine?moveResources[item.moveId].description:itemDescription(item)}</small></div>{(item.price>0||frontierItemPrices[item.id])&&<aside className="resource-item-prices">{emeraldShopItems.has(Number(item.id))&&<span>Buy ₽{item.price.toLocaleString()}</span>}{frontierItemPrices[item.id]&&<span>{frontierItemPrices[item.id]} BP</span>}{item.price>0&&<span>Sell ₽{Math.floor(item.price/2).toLocaleString()}</span>}</aside>}</div>)}</div></section>)}</div>{!matches.length&&<p className="resource-empty">No results.</p>}

 </>}
 </div>
}
