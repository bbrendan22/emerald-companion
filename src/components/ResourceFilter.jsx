import { useLayoutEffect, useRef } from 'react'

export default function ResourceFilter({ label, value, onChange, options }) {
  const textRef = useRef(null)
  const selected = options.find(option => String(option.value) === String(value))
  const text = !value || value === 'all' ? label : selected?.label ?? value
  useLayoutEffect(() => {
    const element = textRef.current
    const fit = () => {
      element.style.fontSize = '16px'
      let size = 16
      while (element.scrollWidth > element.clientWidth && size > 9) element.style.fontSize = `${--size}px`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text])
  return <label className="resource-type-filter resource-fit-filter">
    <select aria-label={label} value={value || ''} onChange={event => onChange(event.target.value)}>
      <option value="" disabled hidden>{label}</option>
      <option value="all">All</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <span ref={textRef} className="resource-fit-filter-text" aria-hidden="true">{text}</span>
    <span className="resource-fit-filter-arrow" aria-hidden="true" />
  </label>
}
