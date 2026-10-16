import {useLayoutEffect, useRef, useState} from 'react'
import ResourceTypeIcons from './ResourceTypeIcons'
import artworkFrames from '../data/battleArtworkFrames.json'

const baseUrl = import.meta.env.BASE_URL
const heroHeight = 44.9733 // 841 / 1870, expressed in the matchup's container units.
const platformBaseline = heroHeight * .76

function artworkPlacement(dex) {
  // Measure the visible silhouette rather than the transparent image canvas.
  const [, top, width] = artworkFrames[dex] ?? [38, 18, 436, 432]
  const size = Math.min(
    heroHeight * .81,
    46 * 512 / width,
    (platformBaseline - heroHeight * .18) * 512 / (450 - top),
  )
  return {
    '--art-size': `${size}cqw`,
    '--art-top': `${platformBaseline - size * 450 / 512}cqw`,
  }
}

function BattleBall() {
  return <img className="battle-art-ball" src={`${baseUrl}icons/apple-touch-icon.png?v=pokeball`} alt="" width="24" height="24"/>
}

export function BattleStill({dex, shiny=false, view='front', name='', className='', normalized=true, loading='eager'}) {
  const [failedSource, setFailedSource] = useState('')
  const directory = normalized && view === 'front' ? 'pokemon/bdsp' : '__bdsp-stills'
  const source = `${baseUrl}${directory}/${view}${shiny ? '_shiny' : ''}/${dex}.webp`
  const fallback = `${baseUrl}sprites/emerald/${shiny ? 'shiny/' : ''}${dex}.png`
  return <img
    className={className}
    src={failedSource === source ? fallback : source}
    alt={name}
    width="512" height="512"
    decoding="async" loading={loading}
    onError={() => setFailedSource(source)}
  />
}

export function BattleVersus() {
  const scene = useRef(null)
  useLayoutEffect(() => {
    const panel = scene.current.closest('.battle-matchup')
    let cancelled = false
    // Reveal the initial arena, artwork, and labels in the same paint.
    panel.style.visibility = 'hidden'
    Promise.allSettled([...panel.querySelectorAll('img')].map(image => image.decode()))
      .then(() => { if (!cancelled) panel.style.removeProperty('visibility') })
    return () => { cancelled = true; panel.style.removeProperty('visibility') }
  }, [])
  return <div ref={scene} className="battle-art-scene" aria-hidden="true">
    <img className="battle-arena-background" src={`${baseUrl}battle/matchup-arena-transparent.png`} alt="" width="1870" height="841" decoding="sync" fetchPriority="high" loading="eager"/>
  </div>
}

export function BattleHero({mon, side, children}) {
  const gender = /^(male|m|♂)$/i.test(mon.gender ?? '') ? '♂'
    : /^(female|f|♀)$/i.test(mon.gender ?? '') ? '♀' : null
  return <div className={`battle-summary battle-art-hero ${side}`}>
    <div className="battle-art-name">
      <span className="battle-art-identity">
        <strong>{mon.name}</strong>
        {gender && <span className="battle-art-gender" aria-label={gender === '♂' ? 'Male' : 'Female'}>{gender}</span>}
      </span>
      <span className="battle-art-type-symbols"><ResourceTypeIcons types={mon.types}/></span>
      <small>Lv. {mon.level}{mon.shiny ? ' ✦' : ''}</small>
    </div>
    <div className="battle-art-stage" data-count="1" style={artworkPlacement(mon.dex)}>
      <div className="battle-art-figures">
        <BattleStill
          dex={mon.dex} shiny={mon.shiny} view="front"
          className={side === 'player' ? 'battle-art-mirrored' : ''}
          name={`${mon.shiny ? 'Shiny ' : ''}${mon.name}, front view${side === 'player' ? ', mirrored' : ''}`}
        />
      </div>
    </div>
    {children}
  </div>
}

export function BattleRoster({name, portrait, side, children, onClear}) {
  const lastTap = useRef(null)
  const clearOnDoubleTap = event => {
    if (!onClear || event.button !== 0) return
    if (lastTap.current !== null && event.timeStamp - lastTap.current < 350) {
      lastTap.current = null
      onClear()
    } else {
      lastTap.current = event.timeStamp
    }
  }
  const clearHint = onClear ? 'Double-tap to remove trainer and opponent team' : undefined
  return <section className={`battle-art-roster ${side}`} aria-label={`${name} team`}>
    <div
      className="battle-art-trainer-name"
      role={onClear ? 'button' : undefined}
      tabIndex={onClear ? 0 : undefined}
      aria-label={onClear ? `${name}; double-tap to remove trainer and opponent team` : undefined}
      title={clearHint}
      onPointerUp={clearOnDoubleTap}
      onDoubleClick={event => event.preventDefault()}
      onKeyDown={event => {
        if (onClear && (event.key === 'Delete' || event.key === 'Backspace')) {
          event.preventDefault()
          onClear()
        }
      }}
    ><BattleBall/><strong>{name}</strong></div>
    <div className="battle-art-roster-line">
      {portrait
        ? <img className="battle-art-trainer-sprite" src={portrait} alt={`${name} trainer`}/>
        : <span className="battle-art-trainer-sprite" aria-hidden="true"/>}
      <div className="battle-sprite-slots">{children}</div>
    </div>
  </section>
}
