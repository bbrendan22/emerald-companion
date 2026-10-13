import { useEffect, useRef } from 'react'
export default function ResourceHeading({ children }) {
  const headingRef=useRef(null)
  useEffect(()=>{
    const header=headingRef.current.closest('.resource-list-heading')
    const handle=event=>{
      if(event.target.closest('button') && !event.target.closest('.resource-heading-top-button')) return
      scrollToTop({currentTarget:header})
    }
    header.addEventListener('click',handle)
    return ()=>header.removeEventListener('click',handle)
  },[])
  function scrollToTop(event) {
    const page=event.currentTarget.closest('.resources-page')
    if(!page) return
    const panels=[...page.querySelectorAll('*')].filter(element=>/^(auto|scroll)$/.test(getComputedStyle(element).overflowY) && element.scrollHeight>element.clientHeight)
    const panel=panels.find(element=>element.scrollTop>0) ?? panels[0]
    if(panel) panel.scrollTo({top:0,behavior:'smooth'})
    else window.scrollTo({top:0,behavior:'smooth'})
  }
  return <h2 ref={headingRef}><button type="button" className="resource-heading-top-button" onClick={event=>{event.stopPropagation();scrollToTop(event)}} title="Scroll to top" aria-label={`${children} — scroll to top`}>{children}</button></h2>
}
