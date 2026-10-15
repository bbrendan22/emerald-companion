import { useLayoutEffect, useRef } from 'react'

export default function FitSelect({ children, value, maxFontSize=16, ...props }) {
  const selectRef = useRef(null)
  const textRef = useRef(null)
  useLayoutEffect(() => {
    const select=selectRef.current
    const text=textRef.current
    const fit=()=>{
      text.textContent=select.selectedOptions[0]?.textContent ?? ''
      let size=maxFontSize
      text.style.fontSize=`${size}px`
      while(text.scrollWidth>text.clientWidth && size>8) text.style.fontSize=`${--size}px`
    }
    fit()
    const observer=new ResizeObserver(fit)
    observer.observe(text)
    return ()=>observer.disconnect()
  },[value,children,maxFontSize])
  return <span className="collection-fit-select"><select {...props} ref={selectRef} value={value}>{children}</select><span ref={textRef} aria-hidden="true" /></span>
}
