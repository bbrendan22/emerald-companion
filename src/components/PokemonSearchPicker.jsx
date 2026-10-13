import { useEffect, useRef, useState } from 'react'
export default function PokemonSearchPicker({ label, value, options, onChange, placeholder, hideEmptyMessage=false }) {
  const [open,setOpen]=useState(false)
  const [query,setQuery]=useState('')
  const root=useRef(null)
  useEffect(()=>{
    const close=event=>{if(!root.current?.contains(event.target))setOpen(false)}
    document.addEventListener('pointerdown',close)
    return ()=>document.removeEventListener('pointerdown',close)
  },[])
  useEffect(()=>{
    if(!open)return
    const input=root.current.querySelector('input')
    input.style.opacity='0'
    input.focus({preventScroll:true})
    requestAnimationFrame(()=>requestAnimationFrame(()=>{input.style.opacity=''}))
  },[open])
  useEffect(()=>{
    if(!open)return
    const viewport=window.visualViewport
    let smallest=viewport?.height ?? window.innerHeight
    let keyboardSeen=false
    const check=()=>{
      const height=viewport?.height ?? window.innerHeight
      smallest=Math.min(smallest,height)
      if(window.innerHeight-height>100) keyboardSeen=true
      if(keyboardSeen && height-smallest>100 && window.innerHeight-height<100) setOpen(false)
    }
    viewport?.addEventListener('resize',check)
    check()
    return ()=>viewport?.removeEventListener('resize',check)
  },[open])
  const selected=options.find(option=>option.value===value)
  const matches=options.filter(option=>option.label.toLowerCase().split(/\s+/).some(word=>word.startsWith(query.trim().toLowerCase())))
  return <div className="resource-pokemon-search-picker" ref={root}>
    <span className="resource-picker-label">{label}</span>
    <button type="button" className="resource-picker-trigger" aria-expanded={open} onClick={()=>{setOpen(!open);setQuery('')}}>{selected?.label || placeholder || `Search ${label==='My Pokémon'?'My Pokémon':'Pokémon'}`}</button>
    {open && <div className="resource-picker-menu"><input type="search" aria-label={`Search ${label}`} placeholder="Search name…" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')setOpen(false)}} /><div className="resource-picker-options">{matches.map(option=><button type="button" key={option.value} onClick={()=>{onChange(option.value);setOpen(false)}}>{option.label}</button>)}{!matches.length && !hideEmptyMessage && <p>No Pokémon found.</p>}</div></div>}
  </div>
}
