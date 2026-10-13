import { useEffect, useLayoutEffect, useRef } from 'react'
export default function StepInput({label,value,max,min=0,onChange,tabOrder,allowBlank=false}) {
  const current=useRef({value,max,min,onChange})
  useLayoutEffect(()=>{current.current={value,max,min,onChange}},[value,max,min,onChange])
  const timer=useRef(null)
  const delay=useRef(null)
  function stop(){clearTimeout(delay.current);clearInterval(timer.current);delay.current=null;timer.current=null}
  useEffect(()=>stop,[])
  function step(direction){const state=current.current;const next=Math.max(state.min,Math.min(state.max,Number(state.value)+direction));current.current.value=next;state.onChange(next)}
  function hold(event,direction){if(event.button!==0)return;event.preventDefault();stop();event.currentTarget.setPointerCapture(event.pointerId);step(direction);delay.current=setTimeout(()=>{timer.current=setInterval(()=>step(direction),65)},350)}
  function arrow(direction,name){return <button type="button" aria-label={`${name} ${label}`} onPointerDown={event=>hold(event,direction)} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onContextMenu={event=>event.preventDefault()} onClick={event=>{if(event.detail===0)step(direction)}}>{direction===1 ? '▴' : '▾'}</button>}
  return <div className="resource-stat-stepper"><input aria-label={label} tabIndex={tabOrder} type="number" min={min} max={max} value={value} onFocus={()=>{if(Number(value)===0)onChange('')}} onBlur={()=>{if(!allowBlank && current.current.value==='')current.current.onChange(0)}} onChange={event=>{const raw=event.target.value;onChange(raw==='' ? '' : Math.max(min,Math.min(max,Math.trunc(Number(raw)))))}} /><div>{arrow(1,'Increase')}{arrow(-1,'Decrease')}</div></div>
}
