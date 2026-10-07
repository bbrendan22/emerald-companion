import { useEffect } from 'react'

const lockedPages = '.resource-pokemon-database-page,.resource-pokemon-detail-page,.resource-scroll-database-page,.resource-items-scroll-page,.resource-frontier-page,.resource-home-scroll-page'

export default function useResourceViewport() {
  useEffect(() => {
    const viewport = window.visualViewport
    const updateSize = () => {
      // dvh alone does not shrink with the iPhone's on-screen keyboard.
      document.documentElement.style.setProperty('--resource-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
    }
    let previousY = 0
    const startTouch = event => { previousY = event.touches[0]?.clientY ?? 0 }
    const containTouch = event => {
      if (event.touches.length !== 1 || !document.querySelector(lockedPages)) return
      const nextY = event.touches[0].clientY
      const movement = previousY - nextY
      previousY = nextY
      if (!movement) return
      // Allow native scrolling inside data panels, but prevent Safari from
      // panning the keyboard's visual viewport at an edge or over the header.
      let element = event.target instanceof Element ? event.target : null
      while (element && element !== document.body) {
        const overflow = getComputedStyle(element).overflowY
        if (/^(auto|scroll)$/.test(overflow) && element.scrollHeight > element.clientHeight) {
          const canMove = movement > 0
            ? element.scrollTop + element.clientHeight < element.scrollHeight - 1
            : element.scrollTop > 0
          if (canMove) return
        }
        element = element.parentElement
      }
      if (event.cancelable) event.preventDefault()
    }
    updateSize()
    viewport?.addEventListener('resize', updateSize)
    window.addEventListener('resize', updateSize)
    document.addEventListener('touchstart', startTouch, { passive:true })
    document.addEventListener('touchmove', containTouch, { passive:false })
    return () => {
      viewport?.removeEventListener('resize', updateSize)
      window.removeEventListener('resize', updateSize)
      document.removeEventListener('touchstart', startTouch)
      document.removeEventListener('touchmove', containTouch)
      document.documentElement.style.removeProperty('--resource-viewport-height')
    }
  }, [])
}
